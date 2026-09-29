# Staatsräson — Übernommene Mechaniken

Stand: 29. September 2026. Protokoll der Übernahmen aus der [Mechanik-Analyse](RECHERCHE_MECHANIKEN.md) (HOI4, Democracy 4, Suzerain, Civilization 6, Victoria 3, Anno 1800, Workers & Resources). Jeder übernommene Punkt steht hier mit Quelle, Anpassung und Stelle im Code. Prioritäten laut Analyse: **sofort** (wird jetzt übernommen), **später**, **abgelehnt**.

## Bisher umgesetzt

| Punkt | Quelle | Was übernommen wurde | Wo |
|---|---|---|---|
| PM-Stufenleiter **alle Themenfelder** | Victoria 3 (Production Methods), Anno 1800 (Traktor-Scheune: +200 %, −50 % Arbeitskraft), Workers & Resources (Maschinen als Investitionsgut), Tropico (Bildung als Voraussetzung) | Je Feld eine Modernisierungsleiter: **Landwirtschaftliche Mechanisierung**, **Agrarforschung**, **Industrielle Modernisierung**, **Digitale Verwaltung und Steuertechnik**, **Fachkräfte und Weiterbildung**, **Bildungstechnik**, **Medizintechnik**, **Intelligente Infrastruktur**, **Netzmodernisierung und Speicher**, **Industrieller Wohnungsbau**, **Moderne Sicherheitsverwaltung**, **Digitale Öffentlichkeit**, **Moderne Zoll- und Handelssysteme** — je mit Umsetzungsdauer, Kosten und ehrlichen Gegenwirkungen (z. B. Automation senkt Industriearbeitsplätze, digitale Öffentlichkeit erhöht die Polarisierung, Mechanisierung treibt Energieimporte) | `game/src/data/politiknetz.ts` (199 Knoten, 412 Kanten) |
| Problem-Hysterese | Democracy 4 (getrennte Start-/Stop-Schwellen, Momentum) | Ein Problem bleibt **akut**, bis es 8 Punkte unter die Start-Schwelle fällt (Stoppschwelle), nicht bei harter Kante | `game/src/sim/netz.ts` (`stepNet`, `activeProvinces`, `NetState.acute`) |
| Ghost-Slider + Implementierungsbalken | Democracy 4 (Zielposition sichtbar, Umsetzung läuft) | Balken unter dem Stufenregler: Ist-Stand (petrol) vs. Ziel-Marker (Siegelrot); „Gesetz verabschiedet ≠ wirksam" sichtbar | `game/src/ui/NetView.tsx`, `styles.css` (.impl-bar) |

## Als nächstes (Priorität „sofort" der Analyse)

| Punkt | Quelle | Für NWO |
|---|---|---|
| Kantenformel mit Inertia und Skalierern | Democracy 4 | Kanten zusätzlich glätten und über Fremdknoten skalieren (`*BIP`, `*Konsum`) |
| Produktionsketten 1:1 mit Ratios | Anno 1800 | 2–4-stufige Ketten je türkischem Industriezweig, Ketten-Diagramm pro Provinz |
| Ressourcen-Mangelstrafe gestaffelt | HOI4 | 5–6 strategische Ressourcen (Stahl, Zement, Strom, Öl, Halbleiter) mit Rationierung |
| PE-Lernkurve + Retentions-Matrix | HOI4 | Umstellungsdauer der Betriebe bei Maschinen-Generationen (Anti-Flip-Flop) |
| Wunderlogik für Großprojekte | Civilization 6 | Standortwettbewerb, 50 %-Rückerstattung bei Scheitern |
| Produktions-Queue pro Provinz | Civilization 6 | Baukapazität aus Bevölkerung + Industrie + Infrastruktur |
| Bauvergabe an Firmen | Suzerain | Drei Optionen (Staatskonzern / privat teuer / privat billig) mit Korruptions-Flag |
| Mobilisierungs-Gesetzleiter | HOI4 | Kriegswirtschaft-Stufen als Politiknetz-Äste mit Wählerkosten |
| Krisen-Blocker für Reformen | HOI4 | Wirtschaftskrisen sperren bestimmte Maßnahmen |
| Political Capital | Democracy 4 | „Präsidentialer Erlass" vs. „Parlamentsweg" als zwei Preisspalten |
| In-Character-Labels mit Kostenklammern | Suzerain | Dialogoptionen als Sätze mit sichtbaren Kosten |
| Verdeckte Beziehungsstatistik | Suzerain | Figuren-Gunst verdeckt, nur Reaktionen sichtbar |
| Lens-System der Karte | Civilization 6 | Karten-Ebenen (politisch, Wirtschaft, Risiko, Verkehr) + Platzierungs-Lens für Großprojekte |
| Zeitung als Feedback | Suzerain | Türkische Pressevielfalt übersetzt Stat-Änderungen |
| Kausale Tooltips („Warum sinkt X?") | HOI4 | Jede Zahl erklärt ihre Herkunft — unser „Warum?"-Prinzip |
| Verträge mit Exklusivitäten | Suzerain | Bilaterale Verträge mit harten Ausschlüssen |
| Bilaterale Grievance-Konten | Civilization 6 | Beziehungsnetz Türkei ↔ Akteure mit natürlichem Auslauf |
| Event-Wettbewerb + Grudge-Decay | Democracy 4 | Ereignisse aus dem Netz, Anti-Spam, exponentieller Auslauf |
| Haushalts-Parallelität | Suzerain | Staatshaushalt vs. Parteigelder als getrennte Töpfe |
| Subventionen als Budgetposten | Victoria 3 + Democracy 4 | Subventions-Slider mit Kosten ∝ Höhe, Ziel pro Provinz/Branche |
| Focus-Baum-Vokabular | HOI4 | Agenda-Pfade und Reformketten (UND/ODER, Exklusiv-Icons) |
| National-Spirits-Kacheln | HOI4 | Einheitliche Darstellung aktiver Effekte („Lira-Abwertung aktiv") |
| Hohler Boost-Balken | Civilization 6 | Agenda-/Forschungsfortschritt mit anstehendem Bonus |
| Wirkungslinien bei Hover | Democracy 4 | Politiknetz-Hover zeigt Kanten, Farbe = Richtung |
| Minister-Drei-Rollen + Reshuffle | Democracy 4 | Kabinett als Kostenmultiplikator; Entlassung senkt Loyalität aller |

## Bewusst abgelehnt

Echtzeit-Kriegstaktik und Einheiten-Designer (HOI4/Civ 6), Score-Auktion als Friedensverhandlung (HOI4), Items/Experten-Slots (Anno), Builder-Charges (Civ 6), detailliertes Nachschub-Netz (HOI4), Excel-Tabellen als Haupt-UI, Mobile-first-Design (Suzerain-2.0-Warnung).
