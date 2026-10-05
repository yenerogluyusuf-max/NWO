# GLM-Recherche 14: Gesundheitssystem (05.10.2026)

Ausweitungsrunde A4 (Abschlussbericht, Priorität A Punkt 4). Primärquellen: Sağlık Bakanlığı (Sağlık İstatistikleri Yıllığı), TTB (Türk Tabipleri Birliği), TBMM-Budgetberatungen, OECD. Stand: 05.10.2026. Wartelisten (MR- und Op-Termine) sind die Hauptlücke.

## 1. Kurzfassung

Das System ist personenarm und anlaufstark: 228 bis 239 Ärzte je 100.000 Einwohner (EU: 402, OECD: 372), 270.829 Betten (~3,1 je 1.000), rund eine Milliarde Arztbesuche im Jahr, 11,4 % Ansuchenszuwachs je Kopf — und dazwischen der Gehabdruck der Abwanderung: **2.692 Ärzte holten 2024 das Auslands-Gutachten (İyi Hal Belgesi)**, das Ministerium meldet für 2025 nur 412 tatsächliche Gänge und 249 Rückkehrer. Die Lücke zwischen den beiden Zählweisen (Zeugnis ≠ Abflug) ist der Kernbefund: Die TTB zählt Abwanderungsbereitschaft, das Ministerium Vollzüge. Für das Spiel: Die Ärztekante ist die lebendigste Verbindung von Bildungskette (GLM_2), Gehaltspolitik (m_aerztegehalt), Streik- und Kliniklücken-Karte (GLM_6 5.4) — mit zwei belegten Zählern, die im Spiel als getrennte Größen (Willige und Gegangene) geführt werden können.

## 2. Befund: Zahlen mit Quellen

| Posten | Wert | Quelle |
|---|---|---|
| Ärzte je 100.000 Einwohner | **228 (2022-Basis) → 239 (2023)**; EU 402, OECD 372 | T24/OHSA-Auswertung (Sağlık-Yıllığı-Reihe) |
| Rechnerisch je 1.000 | ~2,3–2,4 | ebenda (Abgeleitet) |
| Gesamtärzte 2025 | **234.000** (Ministerangabe) | TBMM-Budgetberatung, Memişoğlu 13.12.2025 (tbmm.gov.tr) |
| Auslandsgutachten (İyi Hal) 2024 | **2.692 Ärzte** | TTB über Cumhuriyet/Medyascope (23.1.2025) |
| Tatsächlich gegangen 2025 | **412** von 234.000; Rückkehrer 249 | Minister in TBMM (Dez. 2025) — **Abgrenzungswiderspruch offen gelegt** |
| Betten | 270.829 aktiv (2025); ~3,1 je 1.000 | Sağlık-Yıllığı-Auswertung (GLM_6 2.3) |
| Arztbesuche | ~1 Mrd. je Jahr; Ansuchen je Kopf von 8 % auf **11,4 %** gestiegen | ATO-Auswertung |
| Wartelisten (MR/OP) | **Lücke** — Sağlık-Veröffentlichungen/Alo-183-Daten auswerten | — |
| Vertragsärzte-System | MHRS-Terminierung flächendeckend (qualitativ) | — |

## 3. Zusammenhänge (Richtung, Verzug)

| Kante | Richtung | Verzug | Beleg/Lücke |
|---|---|---|---|
| Gehaltspolitik (m_aerztegehalt) → Abwanderungsbereitschaft | − | 3–12 Monate | TTB-Zähler reagiert auf Tarifrunden (qualitativ) |
| Ausbildungszuwachs → Praxisärzte | + | **6–10 Jahre** | GLM_2-Kette; Facharztdauer (Lücke) |
| Bettenausbau ohne Personal → Leerbetten | − | sofort | GLM_6 5.4-Kopplung |
| MHRS-System → Verteilungsgerechtigkeit | ± | sofort | qualitativ; Provinzreihen Lücke |
| Pandemie/Seuche → Systemlast | − | sofort | Ereigniskette gebaut |
| Pflegepersonal (GLM_1-Verwandte) → Systemlast | ± | 2–4 Jahre | Lücke |

## 4. Anschluss im Code

- `data/politiknetz.ts`: m_krankenhausbau, m_aerztegehalt, m_hausarzt, m_zuzahlungen, m_medizintechnik — diese Zahlen sind die Unterlage der Hebel.
- `sim/katastrophe.ts`: Bebenlast auf Kliniken (Kapazitätsdeckel) — GLM_6 5.4.
- GLM_2-Abwanderung: Ärzte als Sondertreiber der Fachkräftekante (belegte 2.692/412-Doppelzählung).
- `ui/` Bereich Gesundheit: Ampel nach Betten/Ärzten je 1.000.

## 5. Integrationsvorschläge

### 5.1 Zwei Abwanderungszähler (ehrliche Doppelzählung)

- **Entscheidung:** Keine direkte; die Akte zeigt **Bereitschaft** (İyi-Hal-Zeugnisse) und **Vollzug** (Ministerzahl) getrennt. Gehalts-/Arbeitsbedingungsentscheidungen bewegen erst die erste Zahl, nach Monaten die zweite.
- **Folgen:** Der Spieler sieht Gehör und Abflug getrennt — den Unterschied zwischen Protest und Abflug. Verlierer: Kurzfristig das System bei jeder Besserung nicht; langfristig Verbleibende (doppelte Last).
- **Gegenspieler:** TTB (zählt laut), Ministerium (zählt freundlich), oppositionelle Presse (Vergleich der Zähler als Skandalmuster).
- **Anzeige:** Bereich Gesundheit: zwei Zähler mit Pfeil; Wirkungsbericht nennt beide.
- **Daten:** `aerzteZaehler` (Feldblock, Vorschlag im Anhang).
- **Aufwand:** klein.
- **Spieltest:** Spaß, wenn die Gehaltserhöhung den ersten Zähler senkt und drei Monate später der zweite folgt — Spieler lernen den Verzug des Systems.

### 5.2 Kliniklücken-Karte mit Personalkopplung (aus GLM_6 5.4, hier vertieft)

- **Entscheidung:** Provinzklinik-Serie nur mit Personalplan (Ärztepfad und Bettenpfad gekoppelt); Alternativpfad „Betten ohne Plan" als Angebot mit Warnung.
- **Folgen:** Gekoppelt: dauerhafte Kapazität; unkoppelt: Leerbetten-Ereignis, Presse, Verwaltungskosten. Verlierer: kurz Steuerzahler; Gewinner: Provinz-Milieus.
- **Gegenspieler:** Ärztekammer, Provinzverwaltungen, private Kliniken.
- **Anzeige:** Gesundheit-Linie: Betten-/Ärztebalken je Provinz.
- **Daten:** GLM_6-Entwurfsfile (`klinikLücken`).
- **Aufwand:** klein.
- **Spieltest:** Erfolgreich, wenn das „Betten ohne Ärzte"-Ereignis einmal auftaucht und der Spieler die Kopplung danach niemals vergisst.

### 5.3 MHRS-Terminierung als Verteilungshuk

- **Entscheidung:** Digitale Terminvergabe (vorhandenes Realvorbild) mit drei Stufen (frei / mit Prioritäten / mit Zuzahlungslock) — koppelt an m_hausarzt und m_zuzahlungen.
- **Folgen:** Prioritäten drücken Wartezeiten in Notfällen, verschieben Last in die Provinz; Zuzahlungslock einkassiert kurz Geld und erzeugt Gerechtigkeitskonflikt. Verlierer: Ältere Milieus bei Digitalisierung.
- **Gegenspieler:** Ärzte (Terminlast), Patientenmilieus, Tech-Firmen (Systembieter).
- **Anzeige:** Bereich-Gesundheit-Zeile; Ereignis „Terminskandal".
- **Daten:** Feldblock im Anhang.
- **Aufwand:** klein.
- **Spieltest:** Erfolgreich, wenn die Stufe die Wartelistenlücke (Lücke in der Recherche!) sichtbar bewegt — sobald die Reihe beschafft ist.

## 6. Verworfen

- **Eigene Seuchen-/Epidemie-Simulation:** Die Katastrophenkette trägt Seuchen (gebaut); keine zweite Gesundheitsmaschinerie.
- **Krankenkassen-Finanzen (SGK-Gesundheit) als Detailmodell:** GLM_1-Rententransfer-Logik deckt die Kassenhärte; Kassensplit wäre doppelte Buchführung.
- **Pharma-Preisverhandlungen als Szene:** g_preiswahrheit und Güter-Pharma (GLM_3) tragen es.

## 7. Vorbilder

- **Democracy 4:** Gesundheitslinie mit Warteliste — übernommen als Ampel, nicht als Slider.
- **Suzerain:** Personalentscheidungen als Szene (Arztbriefe) — der Doppelzähler (5.1) ist die ehrliche Version.
- **Victoria 3:** Institutionen-Level Gesundheit — übernommen als Leiter (5.2), nicht als Rechtskatalog.

## 8. Unsicher oder unbelegt

1. Wartelisten (MR/OP-Termine): Hauptlücke — Sağlık-Bulletin/Alo-183-Reihen.
2. Facharztdauer und Nachwuchsströme je Fach: Lücke.
3. Regionale Arztverteilung je Provinz: Sağlık-Yılligung auswerten.
4. Pflegepersonal-Zahlen: Lücke (GLM_1-Verwandte).
5. Widerspruch TTB (2.692 Zeugnisse 2024) vs. Ministerium (412 Vollzüge 2025): Abgrenzungen (Jahr, Definition) im Quellenmenü dokumentieren.
