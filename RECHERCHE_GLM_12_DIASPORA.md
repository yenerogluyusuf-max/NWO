# GLM-Recherche 12: Diaspora und Auslandstürken (05.10.2026)

Ausweitungsrunde A2 (Abschlussbericht, Priorität A Punkt 2). Primärquellen: Dışişleri Bakanlığı (Personenstand), YSK (Auslands-Wähler), TCMB EVDS (Überweisungen — Lücke markiert). Stand: 05.10.2026.

## 1. Kurzfassung

**7,5 Millionen türkische Staatsbürger leben im Ausland** (Dışişleri, April 2024), rund 6,5 Millionen davon in Westeuropa — eine halbe Großstadt-Einwanderung in Deutschland allein. Wählen können bei der letzten Wahl 3,42 Millionen registrierte Auslands-Wähler, von denen 1,91 Millionen gewählt haben (73 Länder, 151 Vertretungen). Die Überweisungen (Arbeitsmigranten-Rückflüsse) sind eine feste Devisenlinie mit mehreren Milliarden Dollar je Jahr — die exakte TCMB-Reihe ist die offene Lücke dieser Recherche. Für das Spiel: Die Diaspora ist gebaut (Diaspora-Kanal der Außenlage); diese Zahlen kalibrieren die drei Kanten — Devisen, Ereignisse (Auslandsaffären, Diskriminierungsdynamiken), Wahlverhalten bei den nächsten Wahlen (Auslandsurnen 2028/2033).

## 2. Befund: Zahlen mit Quellen

| Posten | Wert | Quelle |
|---|---|---|
| Staatsbürger im Ausland | **~7,5 Mio. (April 2024)** | Dışişleri Bakanlığı (über sonhaber.eu/Dünya) |
| Davon Westeuropa | ~6,5 Mio. | Reform Haber/Dünya-Auswertung |
| Registrierte Auslands-Wähler 2023 | **3.416.098** (73 Länder, 151 Vertretungen) | YSK/Wikipedia-Auswertung der 2023er-Ergebnisse |
| Tatsächlich gewählt (Ausland, inkl. Zoll) | **1.912.030** | ebenda |
| 2018er Vergleich | 3.044.837 registriert | ebenda |
| Erstim-wähler 2023 (Ausland) | 277.646 | ebenda |
| Überweisungen je Jahr (Arbeitsmigranten) | **Lücke** — TCMB „İşçilik gelirleri" (EVDS) auswerten; Größenordnung mehrere Mrd. $ | TCMB EVDS |
| Verteilung nach Ländern | Deutschland Spitze (Band ~2,5–3 Mio.); Detailverteilung **zu prüfen** (Dışişleri-Länderliste) | zu prüfen |
| Organisationen/Institutionen | YTB (Diasporabehörde), Diyanet-Auslandsdienste, Verbände — im Spiel erfunden (Entscheidung Block B) | — |

## 3. Zusammenhänge (Richtung, Verzug)

| Kante | Richtung | Verzug | Beleg/Lücke |
|---|---|---|---|
| Abwanderung von Fachkräften → Diaspora → Rückkehrgewinn | ± | 1–5 Jahre | GLM_2-Abwanderungskante; Rückholstipendien (fok2_wis_rueckkehrstipendien) |
| Auslandsbeziehungen (DE/NL/FR) → Diaspora-Wohlbefinden → Stimmen und Devisen | ± | 1–2 Jahre | Beziehungskanten laender.ts (gebaut) |
| Diskriminierung/Affären im Ausland → Diaspora-Mobilisierung | ± | sofort | Diaspora-Ereignisse (DIASPORA_EREIGNISSE — Verbraucher laut Audit offen: Prüfpunkt) |
| Währungsschock → Überweisungswert in Lira | + | sofort | TCMB-Reihe (Lücke) |
| Auslandsurnen → Wahlrechnung 2028/2033 | ± | Wahltag | YSK-Zahlen (3,42 Mio./1,91 Mio. Beteiligungs-Basis) |
| Rückkehrprogramm (g_rueckkehr) → Diaspora- und Grenzkanten | + | 12–24 Monate | Gesetzesbaustein |

## 4. Anschluss im Code

- `sim/diplomatie.ts` (Diaspora-Kanal gebaut: Devisen- und Ereigniskante): Zahlen kalibrieren 7,5 Mio./6,5 Mio. Westeuropa/3,42 Mio. Wähler.
- **Audit-Anschluss (Prüfpunkt aus SPIEL_DURCHDACHT U6):** `DIASPORA_EREIGNISSE` und Diaspora-Daten haben laut Audit keinen Verbraucher — dieser Strang liefert die Kanten und der Außenstrang verdrahtet.
- `sim/wahl.ts` (Wahlnacht): Auslandsstimmenschätzung als eigene Hochrechnungszeile (belegte Basis 1,91 Mio. gewählte Stimmen 2023).
- `sim/laender.ts` (DE/NL/FR): Diskriminierungs- und Affärenereignisse koppeln Diaspora-Stimmung an Länderbeziehung.
- Haushalte (data/haushalte.ts): eine Diaspora-Familie (z. B. Sohn in Deutschland, Eltern in Kayseri) als achter Haushalt — Vorschlag 5.4.

## 5. Integrationsvorschläge

### 5.1 Diaspora-Leiste mit drei Kanten (Kernbaustein)

- **Entscheidung:** Keine; die Leiste zeigt drei Zustände je Herkunftsregion (Westeuropa, USA, Golf, Turkstaaten): Wohlbefinden, Bindung, Überweisungsvolumen. Spielerhebel: Konsulatspolitik, Rückholprogramme, Auslandsbüros (YTB-artig), Reaktion auf Diskriminierungsfälle.
- **Folgen:** Bindung + → Devisen und Stimmen +, aber Diskriminierungsfälle schlagen sofort durch; übertriebene Diasporapolitik belastet Herkunftsländer-Beziehungen. Verlierer: kurz Beziehung zu Gastländern bei lautstarker Politik.
- **Gegenspieler:** Gastlandregierungen (Souveränität), Diaspora-Verbände (eigene Agenden), Opposition im Ausland (GTB-Affären-Muster).
- **Anzeige:** Welt-Akte: Diaspora-Modus mit Leiste; Ereignisse: Affäre, Überweisungsrekord, Wahlurnen.
- **Daten:** `game/src/data/entwurf_glm/diaspora.ts`.
- **Aufwand:** klein bis mittel.
- **Spieltest:** Spaß, wenn ein Diskriminierungsfall in Deutschland die Leiste bewegt und der Spieler zwischen lautem Protest und stiller Diplomatie wählen muss — mit zwei verschiedenen Preisen.

### 5.2 Auslandsurnen in der Wahlnacht

- **Entscheidung:** Keine; die Wahlnacht (gebaut) bekommt eine eigene Auslandszeile (3,42 Mio. registriert, ~56 % Beteiligung als Kalibrierung) mit Landenschwerpunkten.
- **Folgen:** Auslandsstimmen können Stichwahlen kippen — realistische Härte für knappe 2028/2033-Wahlen.
- **Gegenspieler:** YSK-Führung, Gastländer (Urnenlogistik), beide Lager.
- **Anzeige:** Wahlabend-Ansicht (gebaut): eigene Zeile; Chronik.
- **Daten:** Felder im Entwurfsfile (`wahl`).
- **Aufwand:** klein.
- **Spieltest:** Erfolgreich, wenn der Spieler am Wahlabend auf die Auslandszeile schaut, weil sie einmal kippt.

### 5.3 Überweisungslinie als Devisenpuffer

- **Entscheidung:** Keine direkte; die Linie reagiert auf Lohnentwicklung der Gastländer und Wechselkurs (Verzug 1–2 Monate) und dämpft Devisennot.
- **Folgen:** In Krisenmonaten ein Puffer; politikabhängig nicht steuerbar — Ehrlichkeit: Der Spieler kann sie nur durch Beziehungspflege stabil halten.
- **Gegenspieler:** TCMB-Kurspolitik (Informationskante), Gastländer-Konjunktur.
- **Anzeige:** Wirtschaftsakte: Devisen-Zeile „Überweisungen"; Verlauf.
- **Daten:** `ueberweisungen` im Entwurfsfile.
- **Aufwand:** klein.
- **Spieltest:** Erfolgreich, wenn die Linie in der Währungskrise leise hilft — und die Mentorin sie einmal erklärt.

### 5.4 Der achte Haushalt: Familie mit Diaspora-Sohn

- **Entscheidung:** Keine; ein achter Haushalt (Eltern in Kayseri, Sohn in Deutschland) bekommt den Überweisungs- und Visumskanal im Haushaltsbrief (data/haushalte.ts-Familie).
- **Folgen:** Sichtbarkeit des Themas in Wirkungsberichten.
- **Gegenspieler:** — (Berichtsteil).
- **Anzeige:** Wirkungsbericht-Haushaltsbrief (GLM_9-Muster).
- **Daten:** Erweiterung der Haushaltsliste.
- **Aufwand:** klein.
- **Spieltest:** Spieler zitieren den Haushalt (Öffnungsquante wie GLM_9 5).

## 6. Verworfen

- **Diaspora als Wählergruppe im Inlandsnetz:** bewusste Entscheidung (sim/gruppen.ts TODO); die Kanten (Stimmen, Devisen) laufen über den Außenstrang.
- **Auslandsorganisationen als Figuren:** Block-B-Regel (nur erfundene Geheimnisse für Figuren ohne Vorbild); Verbände bleiben Institutionen.
- **Remittance-Wirtschaftssimulation:** Linie reicht.

## 7. Vorbilder

- **Suzerain:** Exil- und Auslandspolitik-Szenen — übernommen als Ereignisrichtung.
- **Civ 6:** Loyalität von Städten an entferntes Volk (Diaspora-Loyalität) — das ist die Bindungsleiste in anderer Sprache.
- **Victoria 3:** Diaspora-Populationen mit Interessen — verworfen als Simulation, übernommen als Zustandsleiste.

## 8. Unsicher oder unbelegt

1. Überweisungsvolumen: TCMB EVDS-Reihe „İşçilik gelirleri" auswerten — Hauptlücke.
2. Länderverteilung (Deutschland exakt): Dışişleri-Länderliste beschaffen.
3. Rückkehrer-Zahlen je Jahr: Lücke.
4. Auslands-Wählerentwicklung seit 2023 (Kursaktualisierung 2026): YSK-Kursakfrage offen.
