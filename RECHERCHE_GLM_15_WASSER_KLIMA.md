# GLM-Recherche 15: Wasser und Klima (05.10.2026)

Ausweitungsrunde A5 (Abschlussbericht, Priorität A Punkt 5). Primärquellen: TÜİK (Bevölkerung/Wasser), DSİ (Stauseestände), Presse zur Dürre 2025. Stand: 05.10.2026. Diese Recherche speist die Katastrophenkette, die Weizenkalkulation (GLM_3) und den Dammzustrom (GLM_7).

## 1. Kurzfassung

Türkiye rutscht messbar in die Wasserknappheit: **1.301 Kubikmeter nutzbares Wasser je Kopf (Ende 2025, TÜİK bei 86,09 Mio. Einwohnern)** — direkt an der internationalen Wasserstress-Grenze — und die Projektionslinie fällt auf **1.200 (2030), 1.116 (2040), 1.069 (2050)**, was Fachleute zum „Wasserarmen-Land" (unter 1.000) führen kann. 77 Prozent des Nutzwassers geht in die Landwirtschaft. Der Sommer 2025 war die Probe: DSİ meldete einen Niederschlagsrückgang von **76,4 % im Wasserjahr**, die Ankara-Staudämme fielen auf **19 %** (Kapazität 1,585 Mrd. m³), İstanbul auf **23,12 %** (24.10.2025) — danach Erholung auf 81,4 % aktive Füllung. Für das Spiel: Die Dürrekette (gebaut) bekommt echte Pegel: Stauseestand je Becken, Ernte-, Strom- und Trinkwasserfolgekette, und der Dammzustrom (GLM_7 5.3) wird von denselben Zahlen gespeist.

## 2. Befund: Zahlen mit Quellen

| Posten | Wert | Quelle |
|---|---|---|
| Nutzwasser je Kopf | **1.301 m³ je Jahr (Ende 2025)**; Bevölkerung 86.092.168 | TÜİK 31.12.2025 (Presseauswertung satinalmadergisi/mansethaber) |
| Nutzbare Wasserpotenz | **112 Mrd. m³** (DSİ) | DSİ |
| Nutzungsaufteilung | **77 % Landwirtschaft** | DSİ/TÜİK-Auswertung |
| Projektion | **2030: 1.200 m³ · 2040: 1.116 m³ · 2050: 1.069 m³**; Fachmeinung: bis 700 m³ möglich → „wasserarmes Land" (<1.000) | DSİ/WWF/Presse (TRT Haber) |
| Dürre 2025 | Niederschlag **−76,4 %** im Wasserjahr (DSİ-Erstmeldung transparent) | ticarihayat (DSİ-Daten) |
| Ankara-Staudämme | **19 % Füllung** (Kapazität 1.585 Mio. m³), Sommer 2025; Wassersperren-Diskussion | ASKİ über Yandex-Gündem |
| İstanbul-Staudämme | **23,12 % (24.10.2025)**; teilweise nahe Trockenheit | ankara24 (İSKİ-Daten) |
| Erholung | Aktive Füllung von 53,2 % auf **81,4 %** (DSİ, nach Regenperiode) | ekoturk/t24 (DSİ) |
| Netzverluste | Schadensverluste im Verteilnetz als Diskussionsthema (Zahl **Lücke**) | Lücke |

## 3. Zusammenhänge (Richtung, Verzug)

| Kante | Richtung | Verzug | Beleg/Lücke |
|---|---|---|---|
| Bevölkerungswachstum → Pro-Kopf-Wasser | − | dauerhaft | TÜİK-Reihe (1.301 und fallend) |
| Dürre → Stauseestand → Trinkwasserbeschränkungen | − | sofort | Ankara 19 %, İstanbul 23 % (2025) |
| Dürre → Bewässerung → Weizenernte (GLM_3) | − | 1 Saison | Kette gebaut (Katastrophe); Erntekoppel Vorschlag 5.4 GLM_3 |
| Stauseestand → Strom (Wasserwerke) | − | 1–2 Monate | GLM_3-Strommix (Wasser 21,5 %) |
| Landwirtschaft 77 % → Bewässerungseffizienz (GAP) | + | 2–5 Jahre | fok2_reg_gap_wasser |
| Zustrom an Nachbarn (GLM_7 5.3) ↔ eigener Stand | ± | 1 Saison | 1987/1990-Abkommen |
| Klimawandel langsam → Hitzewellen/Waldbrand-Häufigkeit | − | dauerhaft | Waldbrand-Fokus (fok2_reg_waldbrand) |
| Entsalzung/Effizienz → Pro-Kopf-Relief | + | 3–8 Jahre | GLM_3-Entsalzungstechnik |

## 4. Anschluss im Code

- `sim/katastrophe.ts` (Kette repariert): Dürre-Ereignisse bekommen Pegel-Eingänge (Beckenstufen statt Zufallswerte); die 2025er-Zahlen sind der Kalibrierfall.
- `data/politiknetz.ts`: m_staudaemme, m_bewaesserung, m_wasserleitungen, m_energieeffizienz — Pegel als Zustandsgrößen hinter diesen Hebeln.
- `sim/grossprojekt.ts`: Staudamm-/Entsalzungsprojekte lesen die Pegel als Bitten-Trigger (KI_PROJEKTE_UND_KARTE Abschnitt 8).
- GLM_3 `gueter.ts` (Wasser-Gut) und GLM_7 Zustrom: dieselbe Pegelgröße, drei Verbraucher.
- Karte: Wasser-Linse (Stauseestand je Becken, Färbung) — Anschluss an geplante Linsen.

## 5. Integrationsvorschläge

### 5.1 Pegelstufen je Becken (Kernbaustein)

- **Entscheidung:** Keine direkte; drei Becken-Zustände (Marmara/İstanbul, Ankara/İç Anadolu, Südosten/GAP) mit Füllstufen (Voll/Normal/Tief/Kritisch), die aus Niederschlag, Verbrauch und Zustrom rechnen. Der Spieler entscheidet an Warnstufen: Verbrauchsbeschränkungen, Trinkwasser-Umleitung, Notwasserkauf (Tanker).
- **Folgen:** Kritisch: Trinkwassersperren (Milieugroll, Gesundheitsrisiko), Ernte −, Strom −; Ausbau (Staudämme, Entsalzung, Effizienz) senkt langfristig. Verlierer: Landwirtschaft (77 % des Verbrauchs) bei jeder Beschränkung.
- **Gegenspieler:** DSİ, Wasserversorger (ASKİ/İSKİ), Bauernverbände, Kommunen, Nachbarn (Zustrom).
- **Anzeige:** Katastrophen-Akte: Pegelleiste je Becken; Karte: Wasser-Linse; Schreibtisch-Warnung bei „Tief".
- **Daten:** `becken` (Feldblock im Anhang).
- **Aufwand:** mittel.
- **Spieltest:** Spaß, wenn der Sommer 2025-ähnliche Dürre die drei Becken unterschiedlich trifft und der Spieler zwischen Stadt, Bauer und Nachbar wählt.

### 5.2 Wassereffizienz-Programm (77%-Landwirtschaft als Hebel)

- **Entscheidung:** Bewässerungswende (tropfenweise Modernisierung, GAP-Ausbau, Preisgestaltung für Agrarwasser) in drei Stufen — der größte Einzelhebel, weil 77 % des Wassers dorthin fließen.
- **Folgen:** Kurz: Kosten, Bauern-Wut (Umstellung); lang: Pro-Kopf-Relief +, Erntesicherheit +. Verlierer: kurz kleine Betriebe (Umstellungskosten); Gewinner: alle Becken.
- **Gegenspieler:** Bauernverbände, DSİ, Bewässerungsfirmen, Nachbarn (mehr Eigenverbrauch = weniger Zustrom-Frage? Nein — mehr Effizienz erlaubt beides).
- **Anzeige:** Landwirtschaft-Linie; Katastrophen-Akte: Effizienzfortschritt.
- **Daten:** Feldblock im Anhang.
- **Aufwand:** mittel.
- **Spieltest:** Erfolgreich, wenn die Effizienz nach fünf Jahren die Becken sichtbar entlastet und der Spieler den Unterschied zwischen „mehr Wasser bauen" und „weniger verschwenden" erklärt bekommt.

### 5.3 Trinkwassernotfallleiter (Städte)

- **Entscheidung:** Leiter für die Großstädte (Normal / Warnung / Beschränkung / Notstand) mit Lkw-Wasser und Rationierung — Kopplung an die Kommunalwahlen 2029 (Rathäuser-Rathauskante).
- **Folgen:** Beschränkung: Milieugroll sofort, kommunale Vertrauensverluste; Notstand: Notverwaltung (Zwangsverwalter gebaut). Verlierer: Stadtmilieus; Gewinner: kurz Wasserwerke.
- **Gegenspieler:** İSKİ/ASKİ-Führung, Bürgermeister, Presse.
- **Anzeige:** Schreibtisch-Warnung; Karte: Stadtmarken-Färbung.
- **Daten:** Feldblock im Anhang.
- **Aufwand:** klein.
- **Spieltest:** Spaß, wenn die Leiter vor den Kommunalwahlen anspringt und der Spieler zwischen Wahl und Wasser wählt.

## 6. Verworfen

- **Klimamodell mit Eigenprognose:** Die Projections-Reihe (1.200/1.116/1.069) ist der Anker; eine eigene Klimarechnung wäre Wissenschaftssimulation ohne Entscheid.
- **Einzeltalsperren-Verwaltung:** Drei Becken genügen; Talsperrenliste ist Deko.
- **Eigene Entsalzungs-Wirtschaftsrechnung:** Vorhabenskette (GLM_3-Technik) trägt es.

## 7. Vorbilder

- **Civ 6:** Wasser-Platzierung (Flüsse geben Boni, Wüste kostet) — übernommen: Pegel als Kartengröße.
- **Frostpunk (Impression):** Knappheit als Dauerdruck mit Gesellschaftsentscheid — die Trinkwassernotfallleiter ist die gemäßigte Version.
- **Victoria 3:** Infrastruktur-/Güterknappheit — übernommen als Beckenzustände.

## 8. Unsicher oder unbelegt

1. Netzverluste (Trinkwasser): Zahl nicht erhoben (Lücke).
2. Grundwasser-Spiegel und Salzintrusion der Küsten: Lücke (DSİ).
3. Becken-Abgrenzung (welche Staudämme zu welchem Becken): DSİ-Dokumentation auswerten.
4. Klimaprojektionsquelle (2040er-Werte): DSİ/WWF-Pressewerte gegen Originalstudie prüfen.
5. Historische Dürrejahre für die Kalibrierung (2014, 2021): DSİ-Reihen beschaffen.
