# RECHERCHE-VERTIEFUNG: Krieg, Militär, Verteidigung auf der Präsidentenebene

**Vertiefungsrecherche zu RECHERCHE_MECHANIKEN.md — nicht Duplikat, sondern Schwerpunkt: Wie bilden Strategiespiele Krieg, Verteidigung und Eskalation auf Führungsebene ab, was kosten die Maßnahmen, was bringen sie, wer trägt die Folgen?** Verbindliche Designvorgabe von „Staatsräson" (NWO): *Der Präsident bestellt und verantwortet, er kommandiert nicht* — keine Taktik-Kämpfe, kein Einheiten-Designer, Krieg strategisch/abstrakt mit vollen Folgen (ENTSCHEIDUNGEN.md Block C, SPIELDESIGN.md Abschnitt 13). Vorhandene Anschlusspunkte im Spiel: 27 Beschaffungsvorhaben, 13 Politiknetz-Knoten (Bereitschaft je Teilstreitkraft, Moral, Offiziersvertrauen, Abschreckung, Rüstungsautarkie), 3 sich ausschließende Doktrinen, Generalsvertrauen, Vorgangs-Objekt mit 6 Zuständen, Beziehungsmatrix mit 4 Dimensionen (Handel, Vertrauen, Sicherheit, Ansehen), Rote Linien, Verhandlungstisch mit 54 Klauseln, Katastrophen-Modul, Parlament mit Gesetz/Erlass.

Recherche-Stand: Oktober 2026. Zahlen sind, wo möglich, gegen Wikis/Defines verifiziert; unsichere oder patch-empfindliche Werte sind **[unverifiziert]** markiert. HOI4-Werte beziehen sich auf den aktuellen Patch-Strang 1.15+ (Paradox-Wiki, teils Wayback), Victoria 3 auf Version 1.13.

## Inhaltsverzeichnis

1. Einordnung: Was diese Datei vertieft
2. Hearts of Iron IV (Tiefenrecherche)
3. Victoria 3 — die nächste Verwandte unseres „Krieg als Vorgang"
4. Civilization VI — das Preisschild am Angriff
5. Suzerain — der Präsidenten-Krieg (wichtigste Einzelreferenz)
6. Rebel Inc. — Counterinsurgency als Kosten-Nutzen-Maschine
7. Shadow President (1993) / CyberJudas (1996)
8. Supreme Ruler (BattleGoat) — Delegation an Minister
9. Balance of Power (1985/1990) — das Eskalationsspiel
10. Europa Universalis IV — der politische Preis der Eroberung
11. Frostpunk — Militär als Ordnungsmechanik
12. Kurzreferenzen: DEFCON, Realpolitiks, Power & Revolution
13. „Krieg ohne Schlachten" — ein Design-Toolkit (Typologie + Empfehlung + Ablauf + Folge-Tabellen)
14. Top-15-Übernahmen (sortiert nach Wert/Aufwand)
15. Offene Punkte und Unsicherheiten

---

## 1. Einordnung: Was diese Datei vertieft

RECHERCHE_MECHANIKEN.md hat HOI4 bereits als Lieferanten für Gesetzleitern, Produktions-Effizienz und Compliance/Resistance identifiziert (Übernahmeliste „Militär/Kriegswirtschaft", Priorisierung sofort/später) und die Friedenskonferenz sowie Echtzeit-Taktik bewusst abgelehnt. Der VERBESSERUNGSPLAN (MIL-1 bis MIL-6) formuliert die Zielrichtung: Krieg als Vorgangsobjekt, Mobilisierungsleiter, Krisen-Blocker. Diese Vertiefung geht drei Schritte weiter:

1. **Sie liefert die fehlenden Zahlen und Formeln** zu den bereits benannten HOI4-Mechaniken (War Support, Weltspannung, Rechtfertigung, Kapitulation, Friedenskonferenz im Detail) — als Kalibrierungsgrundlage, nicht nur als Idee.
2. **Sie deckt Spiele ab, die in der Mechanik-Recherche fehlten**: Victoria 3 (Play-System), Rebel Inc., Shadow President/CyberJudas, Supreme Ruler, Balance of Power, EU4, Frostpunk, DEFCON, Realpolitiks, Power & Revolution.
3. **Sie mündet in ein Design-Toolkit** (Kapitel 13) mit konkretem Ablaufvorschlag für den Kriegs-Vorgang in Staatsräson — direkt auf das vorhandene Vorgangs-Objekt, die Beziehungsmatrix und den Verhandlungstisch zugeschnitten.

Die zentrale Querbeobachtung vorab: **Praktisch jedes ernsthafte Spiel bepreist Krieg über mindestens drei getrennte Kanäle gleichzeitig** — eine Ressource (Geld/Güter/Manpower), eine innenpolitische Währung (War Support, Kriegsmüdigkeit, Reputation, Popularität) und eine außenpolitische Währung (Infamie, Grievances, Aggressive Expansion, Prestige). Spiele, die nur einen Kanal haben (Realpolitiks: „war button"), werden von der Community als unglaubwürdig verrissen. Das ist die stärkste Bestätigung für Staatsräsons Architektur mit Beziehungsmatrix + Wählergruppen + Märkten.

---

## 2. Hearts of Iron IV (Paradox) — der tiefste Zahlenfundus

HOI4 ist Echtzeit-Taktikspiel *und* gleichzeitig die reichhaltigste Quelle für Gesetzleitern, Schwellen-Gates und Kriegsfolge-Systeme auf nationaler Ebene. Wir übernehmen die politische Schicht und lehnen die operative Schicht weiterhin ab (so schon in RECHERCHE_MECHANIKEN entschieden — hier jetzt mit den konkreten Zahlen).

### 2.1 Wirtschaftsgesetze (Mobilisierungsleiter)

**Funktionsweise.** Fünf Stufen, Wechsel kostet je **150 Politische Macht (PP)**, Stufen sind an War-Support- und Lage-Schwellen gebunden. Aktuelle Werte (Paradox-Wiki, Ideas):

| Gesetz | Konsumgüter-Anteil | Milfabrik-Bau | Zivfabrik-Bau | Umrüstungskosten | Treibstoff/Öl | Energieverbrauch Fabriken | Voraussetzung |
|---|---|---|---|---|---|---|---|
| Zivilwirtschaft | +35 % | −30 % | −30 % | +30 % | −40 % | −30 % | — |
| Frühe Mobilmachung | +30 % | −10 % | −10 % | ±0 | −25 % | −15 % | War Support > 15 % |
| Teilmobilmachung | +25 % | +10 % | ±0 | −10 % | −10 % | ±0 | War Support > 25 % |
| Kriegswirtschaft | +20 % | +20 % | ±0 | −20 % | ±0 | +25 % | WS > 50 % **und** (fasch./komm. Regierung **oder** im Krieg gegen Feind mit > 40 % eigener Fabrikzahl) |
| Totalmobilmachung | +15 % | +30 % | ±0 | −30 %, Rekrutierbare **−3 %** | ±0 | +50 % | Im Krieg, WS > 80 %, Feind > 50 % eigener Fabrikzahl |

**Länder-spezifische Gates — die eigentliche Lehre für uns.** Die USA brauchen für Gesetzeswechsel Kongress-Mehrheiten (**58 Senatoren und 261 Abgeordnete**) und zahlen unter „Limited Intervention" **+100 % auf Wirtschafts- und Wehrpflichtgesetz-Kosten**; die Türkei (DLC „Battle for the Bosporus") kann die Leiter **nicht** hochschalten, solange die Krisen-Spirits „Devaluation of the Turkish Lira", „Worsening Recession" oder „Imminent Depression" aktiv sind — eine Wirtschaftskrise sperrt die Mobilmachung. Totalmobilmachung kann mit der Entscheidung „Women in the Workforce" (100 PP) kompensiert werden, die im Frieden verfällt.

**Kosten.** 150 PP pro Stufe; Opportunität über Konsumgüter (Anteil *aller* Fabriken, die für den Konsum abgezweigt werden); bei Total −3 % rekrutierbare Bevölkerung; Energieverbrauch +25/+50 % auf den oberen Stufen (neueres Stromsystem, Details [unverifiziert]).

**Nutzen.** Kurzfristig: Baugeschwindigkeit und Umrüstung werden spürbar billiger/schneller — der Anti-Flip-Flop-Anreiz aus der alten Recherche (Linienreife) greift hier als „Leiter hoch ist Investition, Leiter runter ist Verlust". Langfristig: eine hochgefahrene Kriegswirtschaft ist im Frieden ein Klotz (Konsumgüter fehlen, Energie teuer).

**Wer gewinnt / verliert.** Gewinner: Rüstungssektor, Generalstab (Kapazität), äußere Abschreckung. Verlierer: Konsumwirtschaft und Haushalte (Konsumgüterquote ist faktisch eine Kopfsteuer auf Lebensstandard), im USA-Modell der Kongress als Mitentscheider, im Türkei-Modell jede Regierung in der Krise.

**Versteckte/Zweitrunden-Effekte.** Die Schwellen erzeugen **Eigeneskalation**: Wer „War Economy" will, braucht War Support > 50 % — der am einfachsten durch eine Verteidigungslage (+20 %) oder hohe Weltspannung entsteht. Das Spiel sagt damit: Mobilmachung ohne Bedrohungs narrative ist politisch unmöglich. Zweitens: Totalmobilmachung senkt die Rekrutierung um 3 Prozentpunkte — die letzte Wirtschaftsstufe *frisst* die Wehrpflichtleiter. Drittens: Der „Women in the Workforce"-Patch ist ein sozialer Vertrag mit Verfallsdatum — Rückstellung nach Kriegsende inklusive.

**Übernahme für Staatsräson.** Unsere Mobilisierungsleiter (im Plan MIL-2) sollte 4–5 Stufen mit exakt dieser Logik bekommen: (a) Wechsel kostet Politisches Kapital + Umsetzungsdauer (Ghost-Slider); (b) Gates über „Öffentliche Kriegsbereitschaft" (siehe 2.3) **und** Krisen-Blocker — bei Lira-Krise/Inflation > Schwelle oder aktivem Katastrophen-Vorgang ist die obere Stufe gesperrt (HOI4-Türkei-Mechanik 1:1, das ist unsere Kern-Domäne); (c) Konsumgüterquote als sichtbarer Abzug auf Lebensstandard/Wählergruppen statt Fabrikprozenten; (d) eine kompensierende Zeitentscheidung („Frauen in die Rüstungsindustrie" bzw. „Verlängerung der Dienstzeiten") mit Ablauf nach Kriegsende und Rückstellungs-Event.

### 2.2 Rekrutierungsgesetze (Wehrpflicht-Leiter)

**Funktionsweise.** Sieben Stufen, Wechsel je 150 PP. Werte (Paradox-Wiki, Ideas + Recruitable population):

| Gesetz | Rekrutierbare Bevölkerung | Fabrik-/Werft-Output | Baugeschwindigkeit | Ausbildungszeit | Voraussetzung |
|---|---|---|---|---|---|
| Entwaffnete Nation | 1,0 % | — | — | — | — |
| Nur Freiwillige | 1,5 % | — | — | — | kein Isolations-Wirtschaftsgesetz |
| Begrenzte Wehrpflicht | 2,5 % | — | — | — | WS > 10 % |
| Erweiterte Wehrpflicht | 5,0 % | — | — | +10 % | WS > 20 %; zusätzlich: Regime fasch./komm. **oder** im Krieg gegen Feind mit ≥ 50 % eigener Heeresstärke |
| Dienstpflicht | 10,0 % | **−10 %** | −10 % | +20 % | WS > 60 % **oder** Kapitulationsfortschritt > 0 %; Feind ≥ 60 % Stärke |
| Alle Erwachsenen dienen | 20,0 % | **−30 %** | −30 % | +30 % | analog verschärft [Detail unverifiziert] |
| Auskratzen des Fasses | 25,0 % | **−40 %** | −40 % | +50 % | Extremlage |

**Kosten.** Nicht PP allein: ab „Dienstpflicht" zahlt die Wirtschaft direkt (−10 bis −40 % Output) — Manpower konkurriert mit Produktion um dieselben Menschen. Ausbildungszeit steigt (+50 % auf der letzten Stufe): spät eingezogene Soldaten sind schlechter ausgebildet.

**Nutzen.** Kurzfristig: Manpower-Pool als direktes Vielfaches der Bevölkerung. Langfristig: wer 25 % der arbeitsfähigen Bevölkerung einzieht, zerstört die eigene Produktionsbasis — ein sich selbst begrenzendes Maximum.

**Wer gewinnt / verliert.** Gewinner: Verteidigungslage (die Gates sind so gebaut, dass nur existenzielle Bedrohung die hohen Stufen freigibt). Verlierer: Industrie, Haushalte, Ausbildungsqualität der Truppe — und der Arbeitgebersektor, der in unserem Spiel eine eigene Interessengruppe ist.

**Versteckte/Zweitrunden-Effekte.** Die Formel „Gates an *geschätzte Feindstärke*" (≥ 50/60 %) ist subtil: Die Freigabe hängt von der *Lageeinschätzung* ab, nicht vom Kriegszustand allein — ein stärkerer Gegner legalisiert härtere Innenmaßnahmen. Und „Kapitulationsfortschritt > 0 %" als alternatives Gate bedeutet: Erst wenn es brennt, darf der Staat die letzte Stufe ziehen — Verzweiflung als Freischaltung.

**Übernahme für Staatsräson.** Unsere Wehrpflicht steht heute als Knoten im Politiknetz; sie sollte zur Stufenleiter mit 4 Stufen werden: Berufsheer-Ausbau → Dienstpflicht modernisiert → Teilmobilmachung der Reserve → Generalmobilmachung. Jede Stufe: direkter Abzug am Arbeitsmarkt (Wirtschaftsakte: Erwerbstätige sinken messbar), Ausbildungsqualität als eigener Wert (wirkt auf Kriegsverlauf, siehe Toolkit), Gates an „wahrgenommene Bedrohung" (Sicherheitsdimension der Beziehungsmatrix + Kriegsbegeisterung) statt an einem binären Kriegsflag. Wichtig: Die Türkei hat realhistorisch Wehrpflicht — die Leiter startet nicht bei null, sondern bei „bestehende Wehrpflicht", was die politischen Kosten der *Aussetzung* (Berufsheer = Valken/Iosef-Streit bei Suzerain, siehe 5.1) genauso modelliert wie die der Ausweitung.

### 2.3 War Support und Stability — die zweigeteilte innenpolitische Kriegswährung

**Funktionsweise.** Zwei getrennte Prozentwerte 0–100, beide neutral bei 50 (Defines: `DEFAULT_STABILITY = 0.5`, `DEFAULT_WAR_SUPPORT = 0.5`). **Stability** = Unterstützung der Regierung; **War Support** = Bereitschaft, die Entbehrungen des Krieges zu ertragen.

- War-Support-Effekte (linear über/unter 50 %): bei 100 % → **+30 % Mobilisierungsgeschwindigkeit, +10 % Angriff/Verteidigung im Kerngebiet, +50 % Kommandokraft-Zuwachs**; bei 0 % → **−50 % Mobilisierungsgeschwindigkeit, −95 % Kommandokraft-Zuwachs, −30 % Kapitulationsgrenze**, Krisenrisiko im Krieg.
- Stability-Effekte: über 50 % Produktionsboni (skalierend bis ca. +20 % auf 100 % — genaue Sättigungswerte [unverifiziert], die Wiki-Tabelle wurde im Abruf abgeschnitten), unter 50 % Malus bis zu Bürgerkriegs-/Krisenereignissen im Krieg. Stability beeinflusst außerdem den Widerstand in Besatzungsgebieten (`RESISTANCE_TARGET_MODIFIER_PER_STABILITY_LOSS = 0.2`).
- Quellen/Senken: **Angriffskrieg −20 % War Support, Verteidigungskrieg +20 %**, Attaché im fremden Land +10 %, „Pride of the Fleet" +5 %, **Weltspannung +0,4 % je Punkt (bis +40 %)**; Krieg an sich gibt **−20 % Stability** (`BASE_STABILITY_WAR_FACTOR = -0.2`), Regierungspartei-Popularität bis +15 %.

**Kosten.** War Support ist *der* Gatekeeper der Gesetzleitern (2.1/2.2) — wer ihn nicht hat, kann weder Wirtschaft noch Wehrpflicht hochfahren. Er kostet also nichts direkt, sondern er ist die Eintrittskarte.

**Nutzen.** Kurzfristig: Mobilisierungstempo, Kampfkraft im Kernland, Kommandokraft. Langfristig: niedriger War Support senkt die Kapitulationsgrenze um 30 % — das Land bricht militärisch *früher* zusammen, egal wie groß die Armee ist.

**Wer gewinnt / verliert.** Die Trennung ist die Aussage: Ein Volk kann die Regierung lieben und den Krieg hassen — oder umgekehrt. Für Staatsräson: „Unterstützung für einen Einsatz ist nicht identisch mit Unterstützung für die Regierung" steht wörtlich so in SPIELDESIGN.md Abschnitt 13 — HOI4 liefert die bewährte Zwei-Werte-Struktur dafür.

**Versteckte/Zweitrunden-Effekte.** Weltspannung füttert War Support aller Länder gleichzeitig (+0,4 %/Punkt) — Eskalation *irgendwo* macht Krieg *überall* politisch billiger. Und der Attaché-Bonus (+10 % für einen Beobachter im fremden Krieg) belohnt militärische Neugier — ein Nebenpfad, der in keiner anderen Referenz vorkommt.

**Übernahme für Staatsräson.** Zwei neue Politiknetz-Größen: **„Kriegsbereitschaft der Bevölkerung"** (Gate für Mobilisierungsleiter, Einsatzbeschluss, Wehrpflicht-Stufen; steigt durch Angriffe auf das Land, Grenzzwischenfälle, Weltlage, staatliche Medien; sinkt durch Verlustlisten, Wirtschaftsbelastung, Kriegsdauer) und **„Regierungsstabilität"** (gekoppelt an vorhandene Legitimität/Umfragen; Krieg wirkt −X pauschal). Konsequenterweise: Verteidigungskriege geben +, Angriffskriege − — das macht die *Framing-Entscheidung* (wer hat angefangen, wie verkaufe ich es) zur echten Mechanik, siehe Civ 6 (4.1).

### 2.4 Eskalation: Weltspannung und Kriegsziel-Rechtfertigung

**Funktionsweise.** **Weltspannung** (0–100 %) ist ein globales Konto, das fast alle Aggressionshandlungen speisen und das täglich um 0,005 Punkte zerfällt (`TENSION_DECAY_DAILY`). Sie wirkt in beide Richtungen:

- Jeder Prozentpunkt reduziert Zeit **und** PP-Kosten der Kriegsziel-Rechtfertigung um 0,5 % (`WARGOAL_WORLD_TENSION_REDUCTION = -0.5`), bis **−50 % bei 100 %** — je verrückter die Welt, desto billiger der nächste Krieg.
- Sie schaltet Aktionen frei, ideologieabhängig: **Demokratien dürfen Kriegsziele erst ab 100 % Weltspannung rechtfertigen** (`generate_wargoal_tension` 1,0; Blockfreie 0,5; Faschisten/Kommunisten ohne Schwelle); Bündnisbeitritt für Demokratien +80 % (gedeckelt auf 50 % im Verteidigungskrieg), Waffenlieferungen +50 %, Freiwilligenentsendung +50 %, Unabhängigkeitsgarantien +25 %. Intervention in fremde Bürgerkriege ab 50 % Weltspannung.
- KI-Verhalten koppelt an die von einem Land *erzeugte* Spannung: weniger bedingte Kapitulationen, kein Fraktionsbeitritt mit Spannungserzeugern, mehr Embargos.

**Rechtfertigung als Zeit-Beschaffung.** Ein Kriegsziel kostet **200 PP Basis + 50 PP je beanspruchter Provinz** (Conquer), mit Claim 100 + 10, Rückeroberung von Kerngebiet 125 PP; während der Rechtfertigung laufen **0,2 PP/Tag** weiter (`BASE_GENERATE_WARGOAL_DAILY_PP`), PP-Mangel pausiert den Vorgang. Dauer **typisch 6–9 Monate** (Community: ~180 Tage als Referenzwert), modifiziert durch Weltspannung (bis −50 %) und weitere Faktoren; gegen einen bereits kriegführenden Major −75 % (`WARGOAL_VERSUS_MAJOR_AT_WAR_REDUCTION`). Das fertige Kriegsziel **verfällt nach 60 Tagen** (Fokus-Ziele 730 Tage). Am Friedenstisch gibt das gerechtfertigte Ziel Rabatt: −20 % Eroberung, −50 % bei Claims, −80 % bei Kerngebieten.

**Kosten.** PP über Monate (Zeit ist die eigentliche Währung), plus die erzeugte Weltspannung selbst als bleibender globaler Schaden.

**Nutzen.** Kurzfristig: legaler Kriegseintritt mit Rabatt am Friedenstisch. Langfristig: Rechtfertigung ist *sichtbar* — das Zielland und die Welt sehen den Countdown und rüsten/reagieren.

**Wer gewinnt / verliert.** Gewinner: Geduldige mit Claims. Verlierer: Überraschungs-Angreifer (doppelte Kosten, keine Rabatte), Demokratien (100-%-Schwelle = de-facto-Verbot von Angriffskriegen, bis die Welt brennt).

**Versteckte/Zweitrunden-Effekte.** (a) Rechtfertigung als **öffentlicher Countdown** erzeugt eine Drohkulisse mit eingebautem Abortfenster — diplomatisch die spannendste Phase des ganzen Spiels. (b) Der 60-Tage-Verfall bestraft „auf Halde rechtfertigen" und zwingt, Rechtfertigung und Kriegsbereitschaft zu synchronisieren. (c) Die AI-Embargo-Kopplung an eigene Spannungserzeugung ist eine primitive, aber wirksame Weltöffentlichkeit.

**Übernahme für Staatsräson.** Kernübernahme: **Kriegsvorbereitung ist ein mehrmonatiger, sichtbarer Vorgang, kein Knopf.** Konkret als Vorgangstyp „Kriegsziel-Erhebung": Ziel wählen (Kerngebiet-Analogon wie Hatay-Narrative = billig; fremdes Gebiet = teuer), monatliche Kosten Politisches Kapital + Beziehungs-Sicherheitsdimension sinkt täglich, das Zielland und Dritte reagieren (Rote Linien des Ziellands triggern, Bündnispartner werden alarmiert, Märkte preisen CDS-Aufschlag ein). Abort jederzeit möglich, Restprestige-Verlust; fertiges Kriegsziel verfällt nach ~2 Monaten Nichtnutzung. Unsere „Weltspannung" existiert als Außenwelt-Index schon (Weltzins, EU-Nachfrage) — ein **„Regionale Spannung"-Index** für unser Einzugsgebiet (Ostmed, Kaukasus, Naher Osten) erfüllt dieselbe Funktion: Er verteuert/verbilligt Eskalation für alle Anrainer gleichzeitig.

### 2.5 Kapitulation und Besatzung

**Funktionsweise (Kapitulation).** Ein Land kapituliert, wenn sein Kapitulationsfortschritt (im Kern: Anteil verlorener Siegpunkte/Victory Points, modifiziert) die **Kapitulationsgrenze** überschreitet. Niedriger War Support senkt diese Grenze um bis zu 30 % — die Heimatfront entscheidet mit. In Fraktionen kämpfen Nicht-Majors weiter, bis **alle Majors der Fraktion kapituliert** haben; dann werden alle beteiligten Nebenmitglieder automatisch mitkapituliert. Es gibt **bedingte Kapitulation** als Diplomatie-Option; der erreichte Fortschritt fließt als Faktor *c* in die Friedenskonferenz ein.

**Funktionsweise (Besatzung).** Zwei gegenläufige Werte pro Gebiet: **Compliance** (Zusammenarbeit, wächst langsam, u. a. über Berater wie „Compassionate Gentleman" +2 % Wachstum) und **Resistance** (Widerstand, Zielwert u. a. durch feindliche Stabilität gesenkt/erhöht; Hitler-Trait: +5 % Resistance Target). Verfügbare Fabriken des besetzten Gebiets: **`25 % + 65 % × Compliance`**; Resistance-Schwellen bei 25/50/75/90 % mit eskalierenden Sabotage-/Garnisons-Effekten. Am Friedenstisch senkt Compliance die Annexionskosten (Stufen: 0 % → Faktor 1,0; 30 % → 0,9; 70 % → 0,8).

**Kosten.** Garnisonen binden Manpower und Ausrüstung dauerhaft; Widerstand beschädigt sie; Compliance braucht Jahre und Milde (Berater, Besatzungsgesetze) — Härte ist schneller, aber teurer im Unterhalt.

**Nutzen.** Kurzfristig: Rohstoffe/Fabriken zu 25 % sofort. Langfristig: bis 90 % bei voller Compliance — Besatzung ist eine Investition mit jahrelanger Amortisation, keine Beute.

**Wer gewinnt / verliert.** Wer Compliance wählt, tauscht Zeit gegen Ertrag und entlastet die Heimatfront (weniger gebundene Truppen); wer drangsaliert, finanziert den Widerstand der Gegenseite. Politisch: Besetztes Gebiet ohne Anerkennung ist ein Dauerdefizit — siehe EU4 Overextension (10.2) für dieselbe Lektion in anderer Form.

**Versteckte/Zweitrunden-Effekte.** Die 25 %-Basis garantiert, dass *jede* Eroberung sofort etwas bringt — aber die Differenz zu 90 % ist der Anreiz, der aus Siegern Verwalter macht. Und: Stabilität zu Hause wirkt auf den Widerstand im besetzten Gebiet (0,2 je Stabilitätsverlust) — innere Schwäche exportiert sich.

**Übernahme für Staatsräson.** Für uns skalierbar auf **Kontrollstatus von Konflikt-/Krisenprovinzen** (auch ohne Annexion: Pufferzonen, Sicherheitskorridore, Ausnahmezustand-Provinzen): zwei Werte „Kooperation" und „Widerstand" je betroffener Provinz, Ertrag/Steuern/Sicherheit = `Basis + Faktor × Kooperation`, Widerstand treibt Ereignisse (Anschläge, EGMR-Beschwerden, internationale Presse) und bindet Polizei-/Militärkapazität. Das deckt sich mit MIL-6 (Innere Sicherheit) und nutzt die Provinz-Infrastruktur, die wir bereits haben.

### 2.6 Friedenskonferenz — die dokumentierte Designschwäche

**Funktionsweise.** Nach der Kapitulation bekommt jeder Sieger **War Score** nach der Formel `w = s × v × p × c` (s = 1,35 Skalierfaktor; v = Summe der State Values des Verlierers; p = eigener Anteil an der Kriegsbeteiligung; c = Faktor für bedingte Kapitulation = deren Kapitulationsfortschritt). Verteilung über **fünf Runden à 20 %** (Alleinsieger sofort alles; Mindestquote 5 %/Runde für Kleinstbeteiligte). Alle Sieger reichen pro Runde gleichzeitig Forderungen ein (Gebiet nehmen, Satellitenstaat, Regierungswechsel, Befreiung, Flotte; seit „By Blood Alone" zusätzlich entmilitarisierte Zone, Reparationen — 1825 Tage, 50 %-Zivfabrik-Quote —, Ressourcenrechte, Industriedemontage; je 0,25 Stacking-Faktor). Konkurrierende Forderungen erzeugen **Contests**: Wer weiter mitbietet, zahlt steigende Kosten; Ausstieg erstattet 100 % in Runde 1, danach −8 %/Runde bis zum Floor von 76 %.

**Warum sie als schwach gilt.** Community und Presse sind eindeutig: Die KI macht „unlogische" Gebietswahl, die Auktion ist „unrealistisch, unfair, unvorhersehbar", und der Dauer-Mod „Player-Led Peace Conferences" (Spieler übernimmt die Konferenz komplett) existiert seit Jahren als Beleg, dass Spieler Kontrolle statt Auktion wollen. Kernfehler: (a) Kriegsbeteiligung ist schlecht messbar und verzerrt (Farmen über Lend-Lease/Bomben), (b) der Auktionsmechanismus kennt keine Geographie, Geschichte oder Legitimität, (c) der Verlierer hat keinerlei Handlung — kein Verhandeln, nur Auktatismus unter Siegern.

**Übernahme für Staatsräson.** **Explizit nicht übernehmen** (steht schon in der Negativliste). Die Lehre positiv gewendet: Unser Frieden gehört an den vorhandenen **Verhandlungstisch** — Klauseln mit Preisen, Rote Linien auf *beiden* Seiten, Gegenangebote, Laufzeiten, jährliche Prüfung, Vertragsbruch mit Erinnerung. Der Kriegsende-Vorgang liefert dem Tisch nur die *Verhandlungsmasse*: kontrollierte Gebiete als Klausel-Optionen, Erschöpfungsstand beider Seiten als Annahme-Modifikator, Kriegsziele als fixe Forderungskategorien. Damit lösen wir exakt das, was HOI4 verfehlt: Der Verlierer verhandelt mit, Geographie/Legitimität zählt über Klauselpreise, und niemand ersteigert fremde Hauptstädte in Runde 3.

### 2.7 Nachschub und Generäle (knapp, bewusst an der Oberfläche)

**Nachschub** (Details in RECHERCHE_MECHANIKEN): Hub-basiert mit Reichweitenabfall, Eisenbahn und Motorisierung als Verstärker, Treibstoff aus Öl mit gesetzesabhängigem Wirkungsgrad (−40 % bis ±0), Mangel bestraft Produktion und Truppe gestaffelt. Für uns nur als **„Logistikstatus"** relevant: ein Provinz-/Frontwert, der aus Infrastruktur (Autobahn/Schiene/Hafen der Reich-Baukataloge!) und Kriegswirtschaft gespeist wird. Das ist die Stelle, wo unsere Infrastruktur-Beschlüsse militärische Wirkung bekommen, ohne Taktik zu bauen — Suzerain macht mit der H-3-Highway exakt das vor (siehe 5.1).

**Generäle/Generalstab.** HOI4 trennt sauber: Der Spieler auf Politikebene ernennt Stabschefs/Berater (PP-Kosten), wählt Doktrin-Forschung (Heeres-/Marine-/Luft-Erfahrung als Währungen), setzt Kommandokraft ein (Zuwachs ±50/−95 % über War Support) und gibt grobe Schlachtpläne vor — die Ausführung liegt bei Generälen mit eigenen Traits, Kommandokapazität (24 Divisionen, darüber Bonusverfall) und Eigenlogik. **Das ist strukturell genau unsere Ebene**: Personalie + Doktrin + Budget + grobe Direktive, niemals Pixelbefehle.

**Quellen (Abschnitt 2):** hoi4.paradoxwikis.com/Ideas · /Government · /World_tension · /War_goal · /Peace_conference · /Occupation (via Wayback-Snapshot in RECHERCHE_MECHANIKEN) · /Module:Defines/List · hoi4.paradoxwikis.com/Recruitable_population · hoi4.paradoxwikis.com/American_national_focus_tree · Steam-Diskussion 797841122761131860 (Peace Conference) · top-mods.com Player-Led Peace Conferences · forum.paradoxplaza.com Thread 1611553.

---

## 3. Victoria 3 — die nächste Verwandte unseres „Krieg als Vorgang"

Victoria 3 ist die Referenz, die unserem Ansatz strukturell am nächsten kommt: **Krieg ist ein aus der Diplomatie erwachsender Vorgang mit getrennten Phasen, Marktpreisen als Kriegskosten und einer Erschöpfungsuhr statt einer Schlachtenkarte.** Fronten existieren, aber sie werden abstrakt auto-gelöst; die Entscheidungen liegen bei Forderungen, Mobilisierungsgütern und Bündnis-Käufen.

### 3.1 Diplomatische Spielchen (Diplomatic Plays)

**Funktionsweise.** Jeder zwischenstaatliche Konflikt beginnt als Play: Der Initiator stellt eine Forderung (Gebiet, Unterwerfung, Gesetzeszwang, Reparationen). Dann läuft eine **Eskalationsuhr** (0→100) über drei Phasen: **Opening Moves (20 Tage) → Diplomatic Maneuvering (60 Tage) → Countdown to War (20 Tage)**. Jede Forderung oder Sway-Aktion pausiert die Uhr 5 Tage (max. 20 Tage bei > 4 Aktionen) — wer verhandelt, gewinnt Zeit.

- **Forderungen** sind primär (werden bei Aufgabe vor dem Krieg durchgesetzt) oder sekundär (nur nach Krieg über Friedensdeal erzwingbar). Hochstufen einer Forderung kostet **+50 % Manöverpunkte und +50 % Infamie**.
- **Manöverpunkte** hängen am Rang: nicht-anerkannte Großmacht 75, Regionalmacht 60, nicht-anerkannte Macht 50, dezentrale Macht 30; Groß-/Mittelmächte-Werte im Wiki-Tabellenabruf verdeckt **[unverifiziert]**; vier Philosophie-Techs geben je +25 %, Behaviorismus +50 %.
- **Backdown (Initiator) / Give in (Ziel)**: Der nachgebende Teil akzeptiert *alle Primärforderungen* der Gegenseite — ohne Schuss. In der Opening-Phase kann noch niemand aufgeben (die Forderungen sollen erst stehen), in der Countdown-Phase ist Aufgabe die einzige verbleibende Handlung.
- **Infamie-Rückerstattung**: Gibt der Verteidiger nach, bekommt der Angreifer **75 % der Infamie zurück** — unblutiges Durchsetzen ist diplomatisch billiger als Erobern. Nicht durchgesetzte Forderungen erstatten Infamie teilweise, der Beziehungsschaden bleibt.

**Kosten.** Manöverpunkte (knapp, ranggebunden), Infamie (siehe 3.5), Zeit — und der Preis des Nachgebens: alle Primärforderungen plus Prestige.

**Nutzen.** Kurzfristig: Die meisten Plays enden ohne Krieg — das System ist eine **Verhandlungsmaschine mit Pistole auf dem Tisch**. Langfristig: Es erzeugt eine dokumentierte Vorgeschichte (wer forderte was, wer kaufte wen), die Kriegsfolgen legitimiert oder diskreditiert.

**Wer gewinnt / verliert.** Gewinner: starke Mächte mit vielen Manövern, die Drohkulissen billig spielen können. Verlierer: kleine Mächte, die sich verkaufen lassen müssen (Sway als Objekt); Spieler ohne Geduld — wer in der Opening-Phase überfordert, zahlt doppelt.

**Versteckte/Zweitrunden-Effekte.** (a) Die Pausen-Mechanik macht diplomatische Aktivität wörtlich zu *Zeit* — unsere Entscheidung „Tempo über Delegation" kann das spiegeln. (b) Primär/sekundär erzeugt einen eleganten Anreiz für den Schwächeren, vor dem Krieg nachzugeben: Im Krieg verliert er mehr. (c) Locked-in-Phase (Countdown) modelliert die Julikrisen-Logik: Ab einem Punkt können nur noch die beiden Hauptakteure bremsen, Dritte sind Zuschauer.

**Übernahme für Staatsräson.** Das Play ist die **direkte Blaupause für unseren Kriegs-Vorgang** (Toolkit, Kapitel 13): Eskalationsuhr mit drei Phasen, Forderungen am vorhandenen Verhandlungstisch, Manöverpunkte als „Diplomatische Initiative" (aus Rang/Ansehen-Dimension), Sway-Mechanik als „Dritte einbinden" (Bündnispartner mit Versprechen kaufen — kostet Zusagen-Konto oder Verhandlungsklauseln), Backdown mit vollem Forderungspreis. Unser Vorteil gegenüber Vic3: Wir haben Roten Linien und Ausstrahlung auf Drittländer schon.

### 3.2 Sway — Dritte kaufen

**Funktionsweise.** Während der Maneuvering-Phase können die Hauptakteure Dritte kaufen. Preise in Manöverpunkten: **Verpflichtung (Obligation) anbieten oder einfordern 10, Verbündeten rufen 20, Subjekt werden 5, Subjekt/Provinz übertragen 10, Kriegsziel versprechen = Kosten des Ziels**. Dritte können sich auch selbst anbieten (**Reverse Sway** — sie nennen ihren Preis). Wer eine Seite verlässt: **−50 Beziehung** zu dieser Seite, versprochene Forderungen verfallen.

**Kosten/Nutzen.** Sways machen Bündnispolitik zur **Preisliste**: Jede Eskalation hat einen Käufermarkt. Kurzfristig kauft man Battaillone; langfristig verkauft man die Zukunft (Obligations sind später einlösbar; ein Territorialversprechen ist ein Staatsschuldschein).

**Wer gewinnt / verliert.** Gewinner: Hedging-Mächte, die sich teuer verkaufen. Verlierer: der Käufer von morgen — Obligations sind der Mechanismus, der aus einem Krieg zwei macht.

**Übernahme für Staatsräson.** In unserem Rahmen: Während der Drohkulisse-Phase können beide Seiten **Unterstützungspakete** schnüren (Kredite, Waffenlieferung, Basisrechte, Klausel-Versprechen am Verhandlungstisch). Wir haben dafür schon alles: Zusagen-System mit Kipppunkten, Abkommen mit Laufzeiten, Abhängigkeitsdimension. Neu wäre nur die explizite **Preisliste pro Eskalationsphase** und die Möglichkeit des Gegen-Sways durch den Konfliktgegner (das Land bietet unserem Partner ein Gegenangebot — lebendige Welt, AUS-1).

### 3.3 Mobilisierung — Krieg als Güterrechnung

**Funktionsweise.** Armeen werden manuell mobilisiert (vor oder während des Plays); Mobilisierung dauert und **kostet Güter aus dem eigenen Markt**, nicht abstraktes Geld. Pflicht: „Basic Supplies" (**0,75 Getreide + 50 % Mehrverbrauch an Waffen/Munition/Öl je Bataillon**). Optionen (Auswahl, teils exklusiv):

| Option | Kosten je Bataillon | Wirkung | Haken |
|---|---|---|---|
| Extra-Verpflegung | 1,5 Lebensmittel | −5 % Moralverlust, +10 % Angriff/Verteidigung | Aktivierung −50 % Moral |
| Luxus-Verpflegung | 1,5 Fleisch + 1,5 Wein | wie Extra | braucht Tech, Aktivierung −50 % Moral |
| Supplements (Zucker/Tabak/Schnaps/Opium) | je 0,5–1 | +10 % Moral-Regeneration | Deaktivierung −50 % Moral |
| Gewaltsamer Marsch | — | +10 % Tempo, +25 % Mobilisierungstempo | +10 % Moralverlust, Aktivierung −50 % Moral |
| Lkw-/Bahn-Transport | 0,5 Automobile/Motoren | +20–40 % Tempo | −50 % Organisation bei (De)Aktivierung |
| Maschinengewehre | 1 Waffen + 1 Munition | +5/+10 | −50 % Organisation bei Aktivierung |
| Chemiewaffen | 2 Düngemittel | +20 Angriff, **+50 % Todesrate**, −20 % Genesung | Verwüstung, Völkerrecht-Thema |
| Flammenwerfer | 1 Öl | +15 Angriff, **+50 % Verwüstung**, +10 % Moralschaden | verwüstet den Schlachtstaat |
| Feldlazarette | 2 Opium + 1 Werkzeug | +40 % Genesungsrate | −50 % Moral bei Deaktivierung |

**Demobilisierung** kostet 90 Tage lang auslaufend die vollen Mobilisierungskosten und sperrt die Wieder-Mobilisierung für 90 Tage — Hoch- und Runterfahren sind beide teuer. **Verschleiß (Attrition)**: Basis 10 %, wöchentliche Verluste 4–12 %, −50 % am Heimat-HQ; das Wiki merkt an, dass Verschleißverluste die Schlachtenverluste **übersteigen können** — Krieg kostet auch im Stillstand.

**Kosten/Nutzen.** Krieg ist eine **Fortsetzung der Marktwirtschaft mit anderen Mitteln**: Wer mobilisiert, treibt Getreide-, Waffen-, Öl-, Luxuspreise — sichtbar für jeden Bürger über das Preisband (25–175 %, siehe alte Recherche). Der Krieg schreibt sich in die Inflation ein, bevor der erste Schuss fällt.

**Wer gewinnt / verliert.** Gewinner: Rüstungs- und Agrarsektor, Händler. Verlierer: Konsumenten (Preise), Staatskasse (Demobilisierungs-Rechnung), und jeder, der Chemiewaffen einsetzt (Verwüstung des eigenen Zielgebiets — man erobert Asche).

**Versteckte/Zweitrunden-Effekte.** (a) Die (De)Aktivierungs-Moral-Kosten bestrafen Hinz-und-Rück — Commitment wird belohnt. (b) Luxus-Verpflegung mit *Wein und Fleisch* ist die eleganteste Art, Krieg als Distributionsspiel zu zeigen: Die Armee frisst den Wohlstand. (c) Opium als Lazarett-Input — Krieg verändert Drogenmärkte.

**Übernahme für Staatsräson.** Unsere Bereitschaftsgrößen bekommen einen **„Einsatzlast"-Modus**: Bei Mobilisierung/Einsatz steigen monatliche Kosten als Mischung aus Budget (Haushaltsregler Militär), Güterpreisen (Treibstoff/Öl-Index existiert als Außenwelt-Index), und Lebenshaltungsdruck (Konsumgüter-Analog). Mobilisierungs-**Optionen** als Paketwahl beim Einsatzbeschluss (Basis/Verstärkt/Maximal), mit dem Vic3-Prinzip: Aktivierung kostet sofort (Moral-Analog: Offiziersvertrauen oder Truppenmoral), Deaktivierung kostet später (Demobilisierungs-Rechnung als eigenes Finanz-Event, 90-Tage-Auslauf, Wiedermobilisierungs-Sperre). Chemiewaffen-Analog: Einsatz bestimmter Waffensysteme (Streumunition o. ä.) als eigene Klausel mit Völkerrecht-/EGMR- und Pressefolgen.

### 3.4 Kriegsunterstützung, Erschöpfung, Kapitulation

**Funktionsweise.** Jeder Kriegsteilnehmer startet mit **+100 War Support**. Wöchentliche Erschöpfung (additiv):

| Erschöpfung/Woche | Ursache |
|---|---|
| +0,2 | Basis |
| +1,0 | Feind kontrolliert alle eigenen Kriegsziele (skaliert) |
| +0,015 | je 1 % Radikale in der Bevölkerung |
| +0,1 / +0,4 | je 10 % Verluste (relativ zur max. Manpower), ohne / mit verlorenen Schlachten |
| +0,1 | je 10 % Kultur-Verluste beider Seiten (Akzeptanz-gewichtet) |
| ±0,01 | je % Einfluss kriegsgegnerischer / -befürwortender Lobbys |
| +0,1 / +0,5 / +1,0 / +2,0 / +3,0 / +10 | Besatzung: > 0 / > 10 / > 25 / > 50 / > 75 / > 90 % |

Bei **−100 automatische Kapitulation** (alle gegnerischen Kriegsziele werden durchgesetzt). Kernregel: **War Support kann nicht unter 0 fallen, solange der Gegner seine Kriegsziele nicht kontrolliert (≥ 50 % des Zielgebiets) oder die Hauptstadt nicht besetzt hat** — reines Aushungern per Warten funktioniert nicht. Friedensverhandlung jederzeit: Teilmenge der Kriegsziele drücken oder weißer Frieden; Annahmewahrscheinlichkeit steigt mit Erschöpfung; **alle verhandelnden Teilnehmer müssen zustimmen** (Bündnispartner können nicht über den Tisch gezogen werden). **Verwüstung** (Devastation) schädigt Infrastruktur, Mortalität und Durchsatz des Schlachtstaats und heilt nach dem Krieg nur langsam.

**Kosten/Nutzen.** Die Uhr macht Krieg zu einem **Wettlauf der politischen Willensbildung**: Wer zuerst erschöpft, verliert die Verhandlungsposition — nicht zwingend das Schlachtfeld. Lobbys pro/gegen Krieg sind eine eigene Variable: Innenpolitik schreibt direkt in die Front.

**Wer gewinnt / verliert.** Gewinner: Defensive mit intakter Heimat (niedrige Besatzung, niedrige Erschöpfung) und Regierungen ohne kriegsmüde Lobbys. Verlierer: Angreifer, die das Kriegsziel nicht greifen können (0-%-Floor schützt den Verteidiger vorm Verhungern), multiethnische Staaten mit Radikalen (Doppelbeitrag über Radikale + Kultur-Verluste).

**Versteckte/Zweitrunden-Effekte.** (a) Der 0-%-Floor ist die wichtigste Anti-Frust-Regel: Er verhindert asymmetrisches Aussitzen und erzwingt echte Operationen für echte Ziele. (b) Kultur-gewichtete Verluste: Verluste an der „falschen" Bevölkerungsgruppe erschöpfen weniger — ein zynischer, aber historisch belegter Mechanismus; für uns heikel, aber als *Wahrnehmungs*-Mechanik über Wählergruppen abbildbar (Verluste aus bestimmten Provinzen/Milieus schlagen unterschiedlich durch). (c) Verwüstung bleibt nach dem Sieg — man gewinnt geschädigte Provinzen.

**Übernahme für Staatsräson.** Das ist **die** Verlaufs-Maschine für unseren Kriegs-Vorgang: eine **Erschöpfungsuhr pro Seite** (Start 100, Ziel −100 bzw. bei uns skaliert), gespeist aus: kontrollierte Zielräume (zählt der Gegner?), Verluste relativ zur Wehrstruktur, Radikale/Unzufriedene (Wählergruppen), Lobbys (Wirtschaft vs. Falken), Besatzungsgrad, Kriegsdauer-Basis. Floor-Regel übernehmen (kein Fall unter 0 ohne Zielkontrolle). Ergebnis der Uhr steuert: Annahme von Waffenruhe/Friedensangeboten (Verhandlungstisch), Offiziersvertrauen (Schnellerfolg stützt, Stagnation untergräbt), Märkte (CDS reagiert auf *Trend*, nicht nur auf Kriegsflag). Verwüstung als Provinz-Zustand mit mehrjähriger Heilung (Katastrophen-Modul-Logik: Sanierungsvorgänge).

**Quellen (Abschnitt 3):** vic3.paradoxwikis.com/Diplomatic_play · /Land_warfare · /Warfare_overview · /Vickypedia · forum.paradoxplaza.com Dev Diary #21 (Diplomatic Plays) · pcgamesn.com/victoria-3/diplomatic-plays · thegamer.com Victoria-3-War-Guide · altchar.com (Capitulation) · grokipedia.com/page/Victoria_3 **[C-Quelle]**.

---

## 4. Civilization VI — das Preisschild am Angriff

Civ 6 ist taktisch, aber seine **diplomatische Preisbildung** ist die am besten dokumentierte des Genres: dieselbe Kriegshandlung kostet je nach Rahmung, Ära und Ziel einen exakt anderen Preis.

### 4.1 Kriegstypen, Casus Belli, Grievances

**Funktionsweise.** Kriegserklärung ist ein Menü mit Preisen:

- **Surprise War**: sofort, ohne Voraussetzung — aber **+50 % auf alle Strafen** (150 Grievances Basis post-Antike). Einzige Option gegen Stadtstaaten.
- **Formal War**: erst nach **Denunziation + 5 Runden Wartezeit** (oder wenn der Gegner denunziert hat / ein Versprechen gebrochen wurde) — Standardpreis (100 Grievances).
- **Casus Belli** (per Civics freigeschaltet): Holy War, Liberation War, Reconquest, Protectorate War, Colonial War, Territorial Expansion, Golden Age War — mit eigenen Preismodifikatoren.

Warmonger-Basiswerte wachsen pro Ära (Kriegserklärung = 2× Basis, Stadteroberung = 1×, Schleifung = 3×; Auslöschung einer Zivilisation extra: Klassik 16, Mittelalter 25):

| Ära | Basis | | Casus Belli | Erklärung | Eroberung | Schleifung |
|---|---|---|---|---|---|---|
| Antike | 0 | | Surprise | 300 % | 150 % | 450 % |
| Klassik | 3 | | Formal | 200 % | 100 % | 300 % |
| Mittelalter | 6 | | Holy War | 100 % | 50 % | 50 % |
| Renaissance | 9 | | Liberation | 0 % | 100 % | 600 % |
| Industrie+ | 12 | | Colonial | 100 % | 50 % | 300 % |
| | | | Territorial Expansion | 150 % | 75 % | 150 % |
| | | | Golden Age | 50 % | 25 % | 300 % |

(Gathering Storm ersetzt Warmonger durch **Grievances**: bilaterales Konto je Länderpaar, Verfall `10 − x` pro Runde, Antike 10 → Future Era 2 — siehe RECHERCHE_MECHANIKEN.)

**Kosten.** Diplomatische Sichtbarkeit aller anderen Nationen; Grievances vergiften Beziehungen über Jahrzehnte Spielzeit; Liberation-War-Logik zeigt: **Der Eroberungspreis und der Zerstörungspreis sind entkoppelt** — wer im „Befreiungskrieg" schleift, zahlt das Sechsfache.

**Nutzen.** Kurzfristig: Surprise = Tempo; Formal = Normalpreis; Casus Belli = Rabatt bis Legalität. Langfristig: Das System bestraft nicht Krieg, sondern **ungerahmten** Krieg — Erzählung als Währung.

**Wer gewinnt / verliert.** Gewinner: Spieler, die Provokationen erzeugen und *reagieren* (Denunziation abwarten, Versprechen brechen lassen). Verlierer: Ungeduldige, Schleifer (450 %), Zivilisations-Auslöscher.

**Versteckte/Zweitrunden-Effekte.** (a) Die 5-Runden-Wartezeit nach eigener Denunziation ist ein eingebautes Drohfenster: Der Gegner weiß, was kommt — Überraschung und Legalität schließen sich aus. (b) Kanada kann nicht überrascht werden und kann selbst nie überraschen — Verfassungs-Analogie als Spieleigenschaft. (c) Grievance-Verfall `10 − x` macht die frühe Neuzeit zur Verzeihungsepoche und die Gegenwart zur Erinnerungsepoche: **Späte Verbrechen vergammeln langsamer.**

**Übernahme für Staatsräson.** Unser Verhandlungstisch + Beziehungsmatrix bekommt eine **Kriegs-Rahmungs-Ebene**: Jeder Einsatzbeschluss hat eine deklarierte Begründung (Selbstverteidigung nach Zwischenfall / Schutz von Minderheiten / Vertragliche Beistandspflicht / offene Revision). Die Begründung setzt die Preismultiplikatoren auf allen vier Beziehungsdimensionen, bei der Weltöffentlichkeit (Ausstrahlung) und bei den Wählergruppen. Falsche Rahmung (Begründung ohne Beleg, Zielüberschreitung über die deklarierte Begründung hinaus) = Grievance-Analog mit langsamem Verfall. Civs „Liberation 0 % Erklärung / 600 % Schleifung" als Leitplanke: Die Rahmung deckelt, welche Folgehandlungen billig bleiben.

### 4.2 Kriegserschöpfung (War Weariness)

**Funktionsweise.** Jede Kampfhandlung addiert War-Weariness-Punkte (WWP); Kämpfe nahe an eigenen Städten zählen mehr; Surprise Wars akkumulieren deutlich schneller als Casus-Belli-Kriege; **Nukleareinsatz: 480 WWP (Formal) bis 624 WWP (Surprise)**. WWP senken die Amenities der Städte → Produktivitäts- und Wachstumsverluste, bei frisch eroberten Städten bis zu rebellischen Barbaren-Spawns. Frieden stoppt die Akkumulation sofort und löscht einen Teil; im Frieden −200 WWP/Runde; Policy-Karten (Martial Law, Propaganda) −25 %; kommunistische Regierung kann sie per Karte komplett neutralisieren.

**Kosten/Nutzen/Wer gewinnt.** Erschöpfung ist eine **Haushaltssteuer auf Kriegsdauer**, die über Wohnzufriedenheit läuft — nicht über „Stabilität" abstrakt. Gewinner: kurze, saubere Kriege mit klarer Begründung. Verlierer: Abnutzungskriege und dauer-bombende Luftkriegs-Strategien.

**Versteckte/Zweitrunden-Effekte.** (a) Frontnähe bestraft: Kämpfe im eigenen Gebiet kosten doppelt — Verteidigung ist psychologisch teurer als der Feldzug im Ausland, kontraintuitiv und lehrreich. (b) Der Friedens-Reset (−200/Runde) macht auch kurze Waffenruhen strategisch wertvoll. (c) Regierungsform als Erschöpfungsmodifikator (Karte zum Nullen) — Repression als Müdigkeitsantwort.

**Übernahme für Staatsräson.** **Kriegsmüdigkeit als eigenes Politiknetz-Problem** (mit Hysterese, wie unsere anderen Probleme): Treiber = Verlustmeldungen (wöchentliche Rate aus Verlauf), zivile Belastung (Konsumgüter-Abzug, Preise), Kriegsdauer, Frontnähe (Grenzprovinzen doppelt), Rahmungs-Bruch (siehe 4.1). Wirkt auf: Wählergruppen (unterschiedlich gewichtet — Familien in Grenzprovinzen stärker), Kriegsbereitschaft (Gate aus 2.3 fällt mit), Presse/TV (Ereignisquelle). Gegenmittel mit Preis: Informationspolitik (−25 %-Analog, kostet Pressefreiheit/RSF-Wert), Waffenruhe als Erholungsfenster, Veteranen-/Versorgungspakete (Budget). Sieg beendet sie schneller als Stagnation — Erfolg ist die beste Medizin, was Siegprämie und Risiko zugleich erhöht.

### 4.3 Loyalität eroberter Städte

**Funktionsweise.** Jede Stadt hat Loyalität 0–100 mit Veränderung ±20/Runde. Haupttreiber **Bürgerdruck**: jeder Bürger 1 Druckpunkt (Hauptstadt +1, Goldenes Zeitalter +0,5, Dunkles −0,5), Reichweite 9 Felder mit −10 % Abfall je Feld. Eroberte Städte bekommen einen Malus (milderbar durch **Garnison**), starten bei ~75 mit erhöhtem Druck des Vorbesitzers für 10 Runden **[Grokipedia, C-Quelle]**; Gouverneur, Religion (±3), Zufriedenheit wirken. Bei < 75: −25 % Erträge; bei < 25: −50 % Erträge, −75 % Wachstum; bei 0: **Revolte → Freie Stadt** (unabhängig, wehrt sich, drückt selbst; schließt sich später der Ziv mit dem stärksten Druck an).

**Kosten/Nutzen.** Eroberung erzeugt eine **Halte-Rechnung**: Garnison bindet Einheiten, Gouverneur ist anderswo entbehrlich, Zufriedenheit muss her. Die Stadt zahlt sich erst nach Stabilisierung aus.

**Übernahme für Staatsräson.** Für uns nicht als Städte-, sondern als **Provinz-Loyalität nach Kontrollwechsel oder im Ausnahmezustand**: Wert 0–100 je Provinz, Treiber Bevölkerungsdruck der Nachbarschaft (haben wir: Provinz-Echtdaten + Beziehungsdimensionen), Garnison-Analog (Sicherheitspräsenz kostet Personal und Legitimität), Schwellen 75/25/0 mit Ertrags-Malus, Ereignis-Kaskade und „Freie Stadt"-Analog = faktischer Kontrollverlust (De-facto-Regime, internationale Anerkennungsfrage als eigener Vorgang am Verhandlungstisch). Verbindung zu 2.5 (Compliance/Resistance): Civ6 liefert die Treiber-Liste, HOI4 die Ertragsformel.

**Quellen (Abschnitt 4):** civilization.fandom.com/wiki/Casus_Belli_(Civ6) · /Warmongering_(Civ6) · /War_weariness_(Civ6) · /Loyalty_(Civ6) · civilopedia.net Loyalty · exputer.com Civ-6-War-Weariness-Guide · Steam-Diskussionen (Loyalty-Rechner, Warmonger) · grokipedia.com Rise-and-Fall **[C-Quelle]**.

---

## 5. Suzerain — der Präsidenten-Krieg (wichtigste Einzelreferenz)

Suzerain beweist, dass ein Krieg als **Aneinanderreihung von ~15–20 irreversiblen Präsidenten-Entscheidungen** funktioniert — ohne ein einziges Schlachtfeld. Der Rumburg-Krieg der Basiskampagne (Sordland) und der Pales-Krieg des Rizia-DLC sind die zwei Varianten desselben Musters.

### 5.1 Der Rumburg-Krieg (Sordland-Kampagne)

**Funktionsweise — der Krieg als Flag-Netz.** Ob und wie der Krieg kommt und ausgeht, entscheidet sich über das ganze Spiel verteilt:

- **Militärbudget** (erhöhen / halten / kürzen — Kürzung triggert die Turn-5-Entscheidung „Grenzbefestigungen an der Rumburg-Front", **−1 Budget** als Kompensation).
- **Wehrpflicht** beibehalten oder abschaffen (Doktrin-Verzweigung, siehe unten).
- **Gendarmerie**: Verteidigungsministerium (Iosef) oder Innenministerium — innere Sicherheit vs. Frontkraft.
- **Militärindustrie investieren** (Guides: „MANDATORY" für Solo-Sieg), **Luftwaffe modernisieren**, Truppenvergrößerung.
- **Wirtschaftslage**: Sordish Depression schadet Abnutzungsstrategien; **Handelsvolumen ist Versorgung** — zu wenig Handel führt zur Versorgungswarnung („barely enough for ourselves"), die Verbündeten-Anfragen (Agnolien will Nachschub für Dome) scheitern lässt. Infrastruktur zählt wörtlich: die **H-3-Highway**-Entscheidung erscheint in den Kriegs-Guides als Versorgungs-Faktor.
- **Bündnisse**: mindestens ein starker Regionalverbündeter (Lespia oder Valgsland) oder kompatible Kombinationen (Wehlen/Agnolien mit Bedingungen — Operation Bear Trap voll durchziehen, Bergia zentralisieren für Wehlen-Durchmarsch, Insel-Frage anerkennen).
- **Internationale Bühne**: Whistleblower-Asyl gewähren → Rumburgs Atomprogramm im AN (UNO-Analog) entlarven → Sanktionsresolution; Rumburgs verdeckte Militarisierung anklagen; Rumburg aus OMEC drängen (Wirtschaftsdruck).
- **Friedensausgänge vor dem Krieg**: Turn 9 **Reparationsangebot** Rumburgs (**−2 Budget, +1 Wirtschaft, −3 Public Opinion**, Beziehung auf Neutral) — Frieden kaufen ist möglich und hat einen Innenpreis. Turn 10 ruft Königin Beatrice an: Geld oder die Städte **Estord und Narbel**; **Nachgeben beim Gebietsverlangen triggert direkt einen Putsch**.
- **Kriegsraum**: Generalstabs-Streit **Valken vs. Iosef** — Valkens Verteidigungs-/Zermürbungsplan braucht Wehrpflicht, vergrößerte Armee, starke Wirtschaft und geschwächtes Rumburg; Iosefs Zangenangriff braucht Modernisierung, abgeschaffte Wehrpflicht (Berufsarmee) und einen starken Verbündeten, der die Flanke deckt. **Doktrinen mischen scheitert** („follow one doctrine consistently"). Der Präsident kann den **Generalstab säubern** — das entfernt Valken und seinen Plan aus dem Kriegsraum (Personalie = Strategie-Wahl). Altar-Kanzler **Soll** erscheint konditional als Kommentator/Stütze. Der eigene Sohn **Franc an der Front** hält die Moral; Zurückberufung kostet sie.
- **Verlauf**: Phase 1 Abwehrschlacht (Estord fällt/wird gehalten je nach Setup), Phase-2-Lagemespräch mit den Generälen (Stimmungs-Feedback: „leave the meeting happy and confident"), Zielwahl (Thornbourgh bei Iosef-Route mit gedeckter Flanke; Dome bei Valken-Langroute), Verbündeten-Rollen (Flanke, Rückendeckung Tzarbourgh, Angriff Dome).
- **Ausgang**: Sieg → Friedensvertrag, Rumburg geschwächt, ggf. Gebietsgewinn; **ein begonnener Krieg löscht ein ausstehendes Putsch-Ende** — der Sieg rettet die Präsidentschaft. Niederlage → Putsch/Amtsenthebung. Und selbst der Sieg: Spielerbericht — „it left my economy tanked and in tatters, with a revolution brewing" (Wirtschaft ruiniert, Revolution im Anmarsch).

**Kosten.** Budgetpunkte über Jahre (Budget −1 hier, −2 dort — in Suzerain-Logik jeweils ~5–10 % des Jahresspielraums), Public Opinion (−3 für Frieden!), innenpolitische Verpflichtungen gegenüber Verbündeten, Opportunität (jeder Militärpunkt fehlt in Gesundheit/Bildung — der Guide-Verlierer konnte das „State of the Art Hospital" nicht mehr bauen).

**Nutzen.** Kurzfristig: Existenzsicherung gegen Rumburgs Expansionskurs, Prestige. Langfristig: Sieg neutralisiert das Putsch-Szenario und Rumburg als Bedrohung; aber der Krieg produziert die nächste Krise (Wirtschaft, Revolution).

**Wer gewinnt / verliert.** Gewinner: Generalstab (Einfluss), Rüstungssektor, Verbündete (die ihre Preise einlösen), Nationalisten. Verlierer: Sozialbudget, Oligarchen (Kriegswirtschaft), Pazifisten-Wähler, und bei Niederlage: der Präsident persönlich.

**Versteckte/Zweitrunden-Effekte.** (a) **Konsistenz-Zwang**: Nicht die Summe der Investitionen entscheidet, sondern ihre Passung zur gewählten Doktrin — halbe Modernisierung + halbe Wehrpflicht = sichere Niederlage. (b) Krieg als Putsch-Löscher: Eskalation nach außen löst Eskalation nach innen *auf* — zynisch, historisch plausibel. (c) Der Versorgungs-Mechanismus über **Handelsvolumen** ist unsichtbar bis zur Warnung — der Spieler lernt Logistik als Politik (Autobahn, Häfen, Handelsverträge) erst, wenn sie fehlt. (d) Der Krieg hat keine Schlachten-UI, aber **Versammlungs-Dramaturgie**: Lagebesprechungen mit Stimmungsfeedback sind das „Schlachtfeld" des Präsidenten.

### 5.2 Der Pales-Krieg (Rizia-DLC) — Krieg als Ressourcenhaushalt

**Funktionsweise.** Rizia macht den Krieg buchhalterischer: Der König **trainiert Einheiten pro Turn** (Militärschiffe, Panzer, Support, U-Boote — je eigene Kosten und Bauplätze), verwaltet **Aktionspunkte** (bestimmte Einheitenbauten geben zusätzliche AP), Marinegebäude produzieren U-Boote/Schiffe und steigern Handel → Budget; **Provinz-Heeresabgaben (Levies)** der Adelshäuser sind eine eigene Ressource mit politischem Preis (Häuser-Zufriedenheit); eskalierende Leiter: Blockade → Schiedsverfahren (AN-Arbitration, kann verloren werden) → Provokation → Kriegserklärung *nach* gegnerischem Angriff. Nebenkanäle: Lespias Beteiligung aufdecken (Su Omina) → Erpressung zum Blockieren globaler Sanktionen; Rumburg-Handelsdeal → Militärhilfe für „Operation Tranquility".

**Kosten/Nutzen.** Import vs. Eigenbau als Grundwahl: Eigenbau kostet Budget + Zeit, gibt Autarkie; Import kostet Budget, gibt diplomatischen Spielraum. Der Krieg ist selbst mit Sieg ein Wirtschafts-Schock („economy tanked... revolution brewing" gilt auch hier).

**Übernahme für Staatsräson (5.1 + 5.2 gemeinsam).** Das ist unsere Blaupause für den **Einsatzbeschluss und die Verlaufsphase**:

1. **Doktrin-Konsistenz als Gewinnbedingung**: Unsere 3 Doktrin-Äste bekommen je ein „Kriegsprofil" (welche Bereitschaftsgrößen, welche Bündnistiefe, welche Logistik sie brauchen). Der Generalstab (Offiziersvertrauen als Währung) schlägt 2–3 Pläne vor; **Planwechsel mitten im Krieg ist teuer** (Offiziersvertrauen −, Zeitverlust, sichtbar als „Strategiestreit im Generalstab"-Ereignis). Ein **Generalstab-Purge** ist möglich und löscht Optionen — Suzerains bitterste Lektion.
2. **Versorgung = Handel + Infrastruktur**: Kriegs-Vorgang liest Handelsvolumen (Abkommen), Grenzprovinz-Infrastruktur (Autobahn/Schiene/Hafen aus dem Reich-Baukatalog) und Öl-Index; Unterschreiten erzeugt Versorgungswarnung mit Folgeverlusten — *bevor* es zu Verlusten kommt (Vorwarnung statt Überraschung, HOI4-Tooltip-Prinzip).
3. **Kriegsraum-Termine**: Alle 2–4 Wochen Spielzeit ein Lagegespräch (Generalstab + Geheimdienst + Außenminister) mit 2–3 Optionen und ehrlichen Unsicherheitsbändern („bekannt/vermutet/unsicher" — SPIELDESIGN Abs. 13 verlangt genau das).
4. **Persönliche Ebene**: Ein Familienmitglied/Protegé an der Front als Moral-Flag mit Risiko-Event (Suzerain Franc) — optionaler Pfad, hohe emotionale Wirksamkeit.
5. **Frieden hat einen Innenpreis**: Reparations-/Nachgiebigkeits-Angebote des Gegners als Entscheidung mit sichtbarer Kostenklammer — und die harte Regel: **Gebietsabtretung ohne Niederlage = Putsch-/Legitimitäts-Kaskade** (unsere Warnzeichen-Logik greift hier).

**Quellen (Abschnitt 5):** suzerain.wiki.gg/wiki/Decision (Turn 5/9) · neoseeker.com Suzerain-Geopolitics-Guide (Rumburg) · neoseeker.com Rizian-War-Guide · reddit.com/r/suzerain (Rumburg-Guides, Valken/Iosef-Diskussionen) · Steam-Diskussion 6760518612022769157 (Wehlen/Agnolien-Run mit Versorgungsproblem) · Steam-Guide 3609293821 (Arcasian-Route).

---

## 6. Rebel Inc. — Counterinsurgency als Kosten-Nutzen-Maschine

Rebel Inc. (Ndemic) ist die engste Kosten/Nutzen-Referenz überhaupt: ein COIN-Szenario, in dem **Militär eine von drei Säulen ist und die falsche Truppenart mehr schadet als nützt**.

### 6.1 Koalitionstruppen vs. nationale Soldaten

**Funktionsweise.** Zwei Truppentypen mit spiegelbildlichem Profil:

- **Coalition Soldiers**: fast sofort verfügbar, stark, schnell — aber: sie **antagonisieren die lokale Bevölkerung** (Support-Level-Verlust in Einsatzzonen), und sie haben eine **Tour of Duty**: Nach Ablauf droht Abzug; **Verlängerung kostet Reputation, mit steigenden Sätzen**; irgendwann endgültiger Abzug (per Event; „Coalition Surge" bei niedriger Reputation: 2 Gratis-Einheiten, dafür **Abzug aller Koalitionstruppen nach 2 Jahren + dramatischer Aufständischen-Boost** danach).
- **National Soldiers**: **lange Ausbildungszeit**, je Einheit **+10 % Korruptionsrisiko** beim Kauf (Wiki-Bestätigung), anfangs schwächer — aber dauerhaft, legitim, mit Upgrades schließbarer Feuerkraft-Lücke. Spieler-Ökonomie: früh Koalition als Überbrückung, parallel nationale Truppen aufbauen, Koalition ausphasen, bevor die Reputationsrechnung explodiert.

**Kosten.** Koalition: Reputation pro Verlängerung + Support-Verlust im Einsatzgebiet (die Bevölkerung, die man gewinnen will, rückt weg). National: Zeit (Opportunität — die Aufständischen wachsen derweil) + Korruption (die Währung, die alles andere vergiftet).

**Nutzen.** Kurzfristig: nur Koalitionstruppen können ein frühes Übergreifen stoppen. Langfristig: nur nationale Truppen können Stabilität *halten* — Fremdtruppen erzeugen die Instabilität, die sie bekämpfen, sobald sie bleiben.

**Wer gewinnt / verliert.** Gewinner: wer den Übergang zeitig schafft; der internationale Geldgeber (Koalition) entlastet die Kasse. Verlierer: die Zivilbevölkerung der Einsatzprovinzen (Support-Verlust unabhängig vom militärischen Erfolg); der Staat, der die Fremdtruppen zur Dauerlösung macht.

**Versteckte/Zweitrunden-Effekte.** (a) Der **Surge mit Verfallsdatum** ist die eleganteste „Rettungsanker mit Todesfallenklausel"-Mechanik des Genres. (b) Warlord-Gouverneur-Variante: nationale Einheiten werden „restless" (~alle 150 Turns oder nach Niederlagen) — Optionen: Bonus zahlen (**$6, +$1 je Wiederholung**), auflösen (Aufständischen-Rekrutierungsbonus!), ignorieren (**Korruption 70–100 %** je nach Anti-Korruptions-Ausbau, Proteste). Militär als wiederkehrender Rechnungssteller, nicht als Einmalinvestition. (c) Söldner-Pfad (Smuggler): nationale Soldaten als Privatarmee, die **Geld generiert** — gegen Korruption. Der hässliche Pfad als echte Option.

### 6.2 Reputation, Inflation, Korruption — die drei Giftkanäle

**Funktionsweise.**

- **Reputation** ist die Überlebenswährung (Geldgeber-Budget hängt daran; unter ~40 wird es kritisch; Coalition-Surge-Event als Notanker). Verlustquellen: Korruption, Instabilität, Koalitions-Verlängerungen, Ereignisse.
- **Inflation**: **jeder** gekaufte Initiativ-Punkt erhöht sie; Käufe im selben Reiter erhöhen stärker; sie sinkt von selbst wieder — Timing-Mechanik. Koalitionssoldaten sind inflationsresistent (+$1 auch bei hoher Inflation), Straßenbau extrem anfällig.
- **Korruption**: Risiko steigt mit jeder geförderten Initiative und vielen Ereignissen; über ~45 % Risiko frisst sie Support und Reputation; **Todesspirale dokumentiert**: Reputation ↓ → Budget-Kürzung → Anti-Korruptions-Maßnahmen unbezahlbar → Korruption ↑ → Reputation ↓↓.
- **Stabilitätszonen**: Ziel ist „Zonen stabilisieren + Aufständische eindämmen", **nicht** Auslöschen (Truppen sind überall dünn; Auslöschungsversuche zerren die Kräfte auseinander — „Never, ever try to completely wipe out the insurgents"). **Friedensdeal mit den Aufständischen** ist ein regulärer Endpunkt.
- Entscheidungs-Popups mit 3-Monats-Frist pausieren das Spiel — der Gouverneur *muss* entscheiden (Berater „Trained Monkey" würfelt sonst).

**Übernahme für Staatsräson.** Direkt anschlussfähig an MIL-6 (Innere Sicherheit) und den Geheimdienst-Block D:

1. **Fremdkräfte vs. eigene Kräfte als Zweigleisigkeit**: Bei internationalen Einsätzen/Pufferzonen — Koalitions-/Verbündeten-Truppen (schnell, stark, reputations- und support-belastend, Abzugs-Uhr) vs. eigene Aufstellung (langsam, Autarkie +, Korruptions-/Klientel-Risiko beim Schnellaufbau). Die **Abzugs-Rechnung** (Reputation mit steigenden Sätzen) ist eine perfekte Vorgangs-Mechanik: „Verlängerung des Mandats" als jährlich teurer werdender Beschluss — realhistorisch sofort erkennbar (Bundeswehr-Mandate).
2. **Drei-Kanäle-Bepreisung** auch für Inneneinsätze: Budget + Legitimität + Pressefreiheit/Wahrnehmung, statt nur Geld.
3. **Eindämmen statt Auslöschen als Design-Maxime** für Terror-/Aufstands-Probleme (GTI-Knoten existiert): Total-Sieg-Optionen absichtlich teuer und destabilisierend machen; **Verhandeln mit Aufständischen** als Vorgang am Verhandlungstisch (Klauseln: Amnestie, Autonomie, Entwicklungspaket) mit Blut-und-Prestige-Bilanz auf beiden Wegen.
4. **Todesspirale warnen statt überraschen**: Unser „Warum"-Tooltip-Prinzip muss die Spiral-Logik (Reputation→Budget→Korruption) als lesbare Kette zeigen — Rebel Inc. zeigt sie nie und wird dafür als unfair erlebt.

**Quellen (Abschnitt 6):** rebelinc.wiki.gg/wiki/Decisions · /Advanced_Tips · tvtropes.org VideoGame/RebelInc · Steam-Guide 1895957927 · touchtapplay.com Rebel-Inc-Guide.

---

## 7. Shadow President (1993) / CyberJudas (1996) — die Urahnen der Präsidenten-Simulation

### 7.1 Shadow President (D.C. True, 1993)

**Funktionsweise.** Start 1. Juni 1990 (Iraks Kuwait-Invasion liegt zwei Monate voraus — die Welt *drängt* zur Krise); Datenbasis: freigegebene CIA-World-Factbook-Werte, praktisch alle Länder der Erde. Der Präsident handelt über **fünf Aktionsmenüs pro Land**: **Diplomatisch, Wirtschaftlich, Geheim (Covert), Militärisch, Nuklear** — mit Unteraktionen („Economic > Change Trade Status", „Diplomatic > Initiate Cultural Exchange", Militärhilfe erhöhen/senken, Friedensgesandter, Menschenrechts-Druck, Sanktionen). Dazu **Auslandsbudgets je Kategorie** (Militärhilfe, Wirtschaftshilfe …). Ereignisse (Streiks, Putsche, Attentate in Drittländern) verlangen Reaktion; Erfolgslogik der Community: Verbündeten nach Putschversuchen **sofort** Covert- und Militärhilfe erhöhen; Gegnern Friedensgesandte; MFN-Status sparsam verteilen (der Wirtschaftsalgorithmus kompensiert Sprünge im Durchschnittseinkommen — Inflations-Dämpfer eingebaut).

**Kosten/Nutzen.** Jede Aktion hat Effekte „unabhängig vom Erfolg" (Geekometry) — selbst gescheiterte Einmischung verändert Beziehungen. Es gibt **keinen Eroberungs-Sieg**: Krieg ist Einfluss-Instrument (Hilfe, Druck, Intervention), kein Territorialspiel.

**Übernahme für Staatsräson.** Die **Fünf-Menü-Struktur pro Land** ist die Urform unserer Länderakte: Wir haben Verhandlungstisch (Diplomatie), Abkommen (Wirtschaft) — ergänzt durch den noch zu bauenden Block D (Geheim) und den Kriegs-Vorgang (Militärisch). Shadow President zeigt die Minimalform: Ein Land = ein Panel, fünf Aktionsschubladen, Budgets oben drüber. Lehre: **Auch erfolglose Aktionen müssen Spuren hinterlassen** (Beziehungsmatrix bewegt sich bei Scheitern anders als bei Erfolg).

### 7.2 CyberJudas (1996) — der Verräter im Kabinett

**Funktionsweise.** Sequel mit drei Modi: **Presidential Simulator** (Ziel: im Amt bleiben — Popularität gegen Wahlniederlage, Impeachment, **Attentat**), **Cabinet Wars** (jeder Berater hat eigene Agenda und **manipuliert die Empfehlungen**), **CyberJudas Gambit** (ein Kabinettsmitglied ist ein aktiver Verräter, der Katastrophen erzeugt, für die der Präsident verantwortlich gemacht wird — bis hin zum Start einer eigenen Atomrakete). Kabinett: Chief of Staff, National Security Advisor, Außenminister, Verteidigungsminister, Wirtschaftsberater, CIA-Direktor; das **TRACE-System** liefert Hinweise zum Enttarnen. Eroberung existiert nicht: Invasion endet in **Marionettenregierung** mit eingeschränkter Steuerung.

**Kosten/Nutzen.** Die Kosten des Regierens sind hier *Information*: Beratung ist gefärbt, Lagebilder lügen, und der Preis der Delegation ist Sabotage.

**Übernahme für Staatsräson.** Direkte Blaupause für PER-2 (Verdeckte Gunst) und die dunklen Wege (MIL-5): Unsere Figuren haben schon Ziel/Schwäche/Lager — CyberJudas fügt die Spielschleife hinzu: **Widersprüche zwischen Lagebildern** (Geheimdienst vs. Generalstab vs. Außenministerium zeigen dieselbe Krise verschieden), **Berater-Agenden** (Militärs empfehlen Eskalation auch dann, wenn ihre Fähigkeitsdaten dagegen sprechen), und als seltene Endstufe **Aktive Sabotage** (ein Vorgang „läuft" in den Akten korrekt, produziert aber Blowback-Ereignisse). Für den Kriegs-Vorgang: Das Lagebild mit „bekannt/vermutet/unsicher" (SPIELDESIGN Abs. 13) wird zur Spielwiese für gefärbte Beratung — die Mentorin kann Diskrepanzen markieren.

**Quellen (Abschnitt 7):** geekometry.com This-Old-Game-Shadow-President · store.steampowered.com/app/3955050 (Shadow President) · en.wikipedia.org/wiki/CyberJudas · mobygames.com/game/9621/cyberjudas (inkl. Spieler-Review).

---

## 8. Supreme Ruler (BattleGoat) — wie viel Delegation verträgt Krieg?

**Funktionsweise.** Echtzeit-Großstrategie (seit 1982/TRS-80; aktuell Supreme Ruler 2030) mit dem radikalsten Delegationsmodell des Genres: **Kabinettsminister mit Prioritäten und Locks**. Der Spieler setzt pro Ressort „Priorities" (z. B. State: Isolationismus — Minister unterdrückt diplomatische Angebote; Trade Focus — Minister kauft Einheiten ein) und **sperrt** Bereiche per Lock (Finanzminister: Steuern/Soziales/Schulden sperrbar; Verteidigungsminister hat die meisten Overrides). **Military Initiative pro Teilstreitkraft** (Land/Luft/See): niedrig = Spielerbefehle, hoch = Generäle handeln autonom („Units will constantly be moving to where they are most needed"). Kriegsführung über **Theater → Battle Zones** mit Offensive/Defensive-Priorität Low→Very High; der Verteidigungsminister markiert Hotspots. Der Slider-Mittelpunkt bei Steuern/Sozialausgaben ist immer die **Minister-Empfehlung**. Schuldenmanagement: Minister emittiert/tilgt Anleihen auf Priority. Regeln-of-Engagement und **WMD-Einsatz sind Policies**, keine Taktik.

**Kriegs-Kostenlogik laut Handbuch**: „If war with another nation is inevitable, you may want to be the one to declare war first and get in the first shot. **But you need to weigh this benefit against the possible consequences of sanctions from the international community and a hit to your popularity among your own people.**" — Erstschlag-Vorteil vs. Sanktionen + Popularität: eine Zeile, die unser gesamtes Drei-Kanäle-Prinzip zusammenfasst. Strukturschäden senken Produktion proportional; Reparatur kostet Güter+Geld und ist standardmäßig **abgeschaltet** („Facility Repairs Not Authorized") — ein Bewusstmachen von Kriegsfolgen auf die Infrastruktur.

**Wer gewinnt / verliert.** Gewinner: Spieler, die Prioritäten sauber setzen (Delegation skaliert die Aufmerksamkeit). Verlierer: Mikromanager ohne Locks (Minister „optimieren" gegen die Spielerabsicht — das Handbuch warnt: Wer nicht schnell eigene Forschung wählt, hat der Minister schon ausgegeben).

**Übernahme für Staatsräson.** Unsere Minister existieren (10 Ämter, Leistung = 60 % Fähigkeit + 40 % Loyalität). Supreme Ruler liefert das fehlende **Delegation-Protokoll für den Verteidigungsfall**: (a) **Teilautonomie-Regler für den Generalstab** im Kriegs-Vorgang: „Eigeninitiative der Truppenführung" niedrig/mittel/hoch — hoch reagiert schneller auf Lageänderungen, kann aber eigenmächtig eskalieren (Zwischenfall-Ereignisse, die die Rote Linie des Gegners streifen); niedrig verlangt Beschlüsse für jede Verlaufs-Option und kostet Zeit. (b) **Minister-Empfehlung als sichtbare Slider-Mitte** in der Militär-Haushaltslogik — Delegation wird fühlbar, ohne Kontrolle zu nehmen. (c) **Reparatur ist ein Beschluss, kein Automatismus**: Kriegs-/Katastrophenschäden an Infrastruktur (Reich-System: Zustand 0–100 existiert!) heilen nur per Auftrag — mit Budget, Verwaltungskraft und Queue-Platz. Das schließt direkt an unseren Bausektor an und macht Kriegsfolgen haushaltspolitisch konkret.

**Quellen (Abschnitt 8):** Supreme-Ruler-Ultimate-Handbuch (PDF, steamstatic.com) · supremeruler.fandom.com/wiki/Cabinet_Ministers · combatsim.com Supreme-Ruler-2030-Ankündigung.

---

## 9. Balance of Power (1985/1990) — das Eskalationsspiel par excellence

**Funktionsweise.** Chris Crawford, Mindscape 1985 (Edition 1990 mit Beratern). Der Spieler ist US-Präsident oder sowjetischer Generalsekretär, **8 Jahre à 1 Jahresrunde**, Ziel: mehr **Prestige** als der Gegner — bei gleichzeitiger Vermeidung des Atomkriegs. Pro Jahr: Krisen/Vorfälle in ~80 Drittländern; Antwortskala: **nichts tun → diplomatische Note → wirtschaftliche/militärische Hilfe → Militärmanöver**; der Gegner reagiert (Backdown oder Gegenprobe). Kernstück ist die **Krisen-Eskalationsleiter** (Crawford: „the most important single feature of the game... never mentioned in any of my planning documents" — ein Glückstreffer): Backchannel-Sonde → öffentliche diplomatische Herausforderung → militärische Krise → **DEFCON 4 → 3 → 2 → 1** → Atomkrieg. Auf jeder Stufe wählen beide: eskalieren oder nachgeben. **Nachgeben kostet Prestige — und der Verlust wächst mit der Eskalationsstufe** (spätes Nachgeben = „crushing humiliation", halbiert faktisch die diplomatische Schlagkraft). Atomkrieg endet das Spiel sofort für beide: *„You have ignited a nuclear war. And no, there is no animated display of a mushroom cloud with parts of bodies flying through the air. **We do not reward failure.**"* Die KI bewertet Aktionen über eine „Outrage"-Berechnung; ihre Depeschen enthalten Hinweise („categorically refuses" = letzte Warnung); die 1990er-Edition gab dem Spieler **Berater mit eigenen Einschätzungen**, die sich widersprechen können.

**Kosten.** Prestige beim Nachgeben (steigend mit Stufe); alles beim Durchziehen. Nichts kostet Geld — die Währung ist Gesicht.

**Nutzen.** Kurzfristig: Durchgesetzte Probe stärkt Prestige und Beziehungen (Nachgeben des Gegners = eigener Gewinn). Langfristig: Das Spiel *lehrt* Zurückhaltung — Jimmy Carters stellvertretender Sicherheitsberater David Aaron (NYT-Review): „The more I played Balance of Power, the more my self-destruction stemmed from an unwillingness to back down in a crisis. Every conflict was a Cuban Missile Crisis."

**Wer gewinnt / verliert.** Gewinner: wer Krisen wählt statt erleidet, und wer früh (billig) nachgibt statt spät (teuer). Verlierer: der Sture; und das System kennt **keinen** Kriegsgewinn — Eskalation bis zum Ende ist immer doppelt verloren.

**Versteckte/Zweitrunden-Effekte.** (a) Prestige ist **relativ und global**: Der Backdown-Verlust halbiert die eigene Schlagkraft überall — ein verlorenes Duell in Sudan verändert die Verhandlungslage in Iran. (b) Drittländer haben fast keine Agency (Crawford lobotomisierte sie im Lauf der Entwicklung auf eine einzige Option: Krieg gegen andere Nicht-Supermächte) — die Welt als Bühne der zwei; für uns eine Warnung: Ohne Eigenleben der Nachbarn (AUS-1!) wird Eskalation sterile. (c) Der KI-Tonfall *ist* die Schwierigkeit: Textuelle Hinweise („categorically refuses") ersetzen Wahrscheinlichkeitsanzeigen — Sprache als Spielmechanik.

**Übernahme für Staatsräson.** Balance of Power ist die Referenz für unsere **Eskalations-Duelle mit Großmächten** (USA, Russland, EU): Ein bilateral statt globaler Prestige-Wert pro Beziehung (passt in die Beziehungsmatrix, Dimension „Ansehen"); Krisen-Ereignisse mit der Antwortskala (ignorieren / Note / Maßnahme / Muskelspiel); **Backdown-Preis wächst mit der Stufe** — frühes Nachgeben ist billig, spätes Nachgeben ist die Krise des Monats (Presse, Opposition, Offiziersvertrauen); Endstufe nie „automatischer Weltkrieg", sondern Übergabe an den Kriegs-Vorgang. Crawfords Berater-Mechanik verbindet sich mit CyberJudas (7.2): Der Spieler sieht **keine Wahrscheinlichkeit**, sondern widersprechende Berater-Einschätzungen mit Tonfall-Hinweisen.

**Quellen (Abschnitt 9):** en.wikipedia.org/wiki/Balance_of_Power_(video_game) · erasmatazz.com (Crawford, Kapitel 8: Entstehung) · hpjansson.org Balance-of-Power-Retrospektive (DEFCON-Verlauf, GImpt) · Auerbach-PDF (Aaron-NYT-Zitat) · rpi.edu Nuclear-Deterrence-Paper · eprints.staffs.ac.uk Rerolling-Boardgames (Twilight-Struggle-Vergleich).

---

## 10. Europa Universalis IV — der politische Preis der Eroberung

EU4 beantwortet unsere Leitfrage „was kostet Eroberung politisch?" mit drei getrennten Zählwerken — alle ohne Schlachtenbezug.

### 10.1 Aggressive Expansion (AE) — die Weltöffentlichkeit als Konto

**Funktionsweise.** Jede eroberte Provinz erzeugt AE **getrennt je betroffenem Land** (≈ 0,75 × Development mit Claim; mehr ohne; HRE-Gebiete stark erhöht; Vasallisierung statt Annexion nur 75 % der AE). AE verfällt über Zeit, gekoppelt an die Improve-Relations-Geschwindigkeit (Diplo-Ideen +25 %, Berater +20 % usw. — man kann *Verfallsgeschwindigkeit* ausbauen). Schwellen: Bei **−50 AE-Meinung und negativem Gesamtverhältnis** flippt ein Land auf „outraged".

**Kosten/Nutzen/Wer gewinnt.** Gewinner: wer in unterschiedliche Richtungen expandiert (AE verteilt sich), wer Claims pflegt, wer nach Eroberungen „Charmeoffensiven" fährt. Verlierer: wer dieselbe Region zweimal hintereinander frisst. Lehre: **Dieselbe Eroberung hat je nach Adressatenkreis einen anderen Preis** — Weltöffentlichkeit ist segmentiert, nicht global.

### 10.2 Koalitionen — wann sich die Welt verbündet

**Funktionsweise.** Gegen einen Aggressor bildet sich eine Koalition nur, wenn **mindestens 4 Nationen** gleichzeitig: keine Waffenruhe mit ihm haben, nicht verbündet sind, Haltung „outraged" oder „rival", **AE ≥ 50**, Gesamtmeinung negativ, nicht in einer anderen Koalition. Gegenmittel sind mechanisch exakt: **Truce Juggling** (wer Waffenruhe hat, kann nicht beitreten), Beziehungspflege über 0 halten (AE ohne negative Gesamtmeinung flippt nicht), Mitglieder einzeln herauskriegen (Waffenruhe erzwingen, Koalition unter 4 drücken), Koalition schwächer halten als sich selbst (dann löst sie sich auf). „You can easily rack up to 100 AE without them joining a coalition, if relations stay positive" (Saluzzo-Guide) — **der nominelle Feind muss nicht der koalitionsfähige sein**.

**Übernahme für Staatsräson.** Unsere Ausstrahlungs-Mechanik (Drittländer-Effekte existieren) bekommt eine **Koalitions-Logik**: Zählwerk „Empörung" je Land (aus unseren Aktionen: Einsätze, einseitige Vertragsbrüche, Rote-Linie-Verletzungen), Beitrittsschwelle = Empörung > X **und** Gesamtbeziehung < 0 **und** ≥ 3–4 gleichgesinnte Länder; Waffenruhe-/Abkommens-Schutz; gezielte Einzel-Beschwichtigung möglich (Visite, Kredit, Klausel). Der EU4-Satz „≥ 4 Nationen" verhindert eleganterweise Koalitions-Inflation: zwei verärgerte Länder sind Politik, vier sind eine Front.

### 10.3 Overextension & War Exhaustion — Sieg als Verdauungsproblem

**Funktionsweise.** **Overextension**: jede nicht zum Kern gemachte Provinz = **80 % ihres Development** als OE-Wert. Bei 100 % OE: Handelsmacht im Ausland −100 %, Stabilitätskosten +50 %, Söldnerkosten +50 %, Diplomatie-Ruf −2, Beziehungsverbesserung −50 %, nationale Unruhe +5, Korruption +0,5/Jahr; **über 100 %: Aufstands-Fortschritt ×3+ und üble Events ~1×/Jahr**, AI bewertet das Land als Fressen (Kriegserklärungen, Koalitionen wahrscheinlicher). Heilung: Kerne bilden (Zeit + Punkte), Autonomie, an Vasallen abgeben. **War Exhaustion**: wächst im Krieg (Blockaden, Verluste, Besatzung), senkbar gegen Diplomatiepunkte; Waffenbruch ohne Casus Belli: laut Wiki „−7 Stabilität, +7 Kriegserschöpfung" und hohe AE **[Vorzeichen der AE-Angabe im Abruf vermutlich verstümmelt, exakter Wert unverifiziert]**. Der Spieler-Zyklus (Tobold): *Krieg → Eroberung → Jahre des Kernbildens/Beruhigens → nächster Krieg* — Eroberungstempo wird durch Verdauung begrenzt, nicht durch Schlachten.

**Übernahme für Staatsräson.** Für Kontrollgewinne im Kriegs-Vorgang: **„Integrationslast"** je neuer/besetzter Provinz (80 %-Analog: Anteil am Aufwand relativ zur Provinzgröße), Schwellen bei 50/100 % mit Stufen (Verwaltungskraft-Abzug, Unruhe-Ereignisse, internationale Ruf-Mali, Radikalisierungs-Boost), Heilungspfad über Jahre (Referendum, Entwicklungspaket, Autonomie-Klausel am Verhandlungstisch). Und die Meta-Regel: **Nach jedem Krieg folgt eine Verdauungsphase mit eingebauter Eskalations-Sperre** (unsere Rückstellungs-Rechnung aus MIL-2: Demobilisierung, Veteranen, Schulden) — EU4s Zyklus ist das Gegenmittel gegen Eroberungs-Spiralen.

**Quellen (Abschnitt 10):** eu4.paradoxwikis.com/Overextension · /Alliance (Coalition) · /Relations · /Warfare · reddit.com/r/eu4 (AE-Berechnung, AE-Management) · fandomspot.com EU4-Coalition-Guide · Steam-Guide 656356645 · gaming.stackexchange.com 334641 · tobolds.blogspot.com (EU4-Abschlussbericht).

---

## 11. Frostpunk — Militär als Ordnungsmechanik (die Grenze zur inneren Sicherheit)

**Funktionsweise.** Der Ordnungs-Pfad (Gesetzbuch) baut eine Militarisierung der Zivilgesellschaft in Stufen, bezahlt in **Hoffnung/Unzufriedenheit** statt Geld:

- **Wachtürme**: passive Hoffnungs-Aura für Anwohner („Nachbarn wachen über sie").
- **Wachstationen**: + Patrouille als aktive Fähigkeit — **10 Essensrationen, 1 Tag Abklingzeit**: senkt Unzufriedenheit deutlich, leichter Hoffnungs-Boost.
- **Gefängnisse**: Razzia — „Unruhestifter" 4 Tage weggesperrt, Unzufriedenheit sinkt, 1 Tag Abklingzeit.
- **Loyalitätsgelöbnis**: Bürger werden zu **Geheiminformanten** — permanenter Hoffnungs-Bonus, kleiner Dauer-Unzufriedenheits-Anstieg.
- **Propagandazentrum**: Nachrichten-Bulletins steigern Hoffnung; **Agitatoren**: +20 % Arbeitsplatz-Effizienz in Reichweite.
- **Neuer Orden** (Endpunkt): Hoffnung ist kein Problem mehr — Wachtürme können abgerissen werden, weil die Gesellschaft selbst überwacht.

**Kosten.** Essen (Patrouillen), Arbeitskraft (Wachen), und der narrative Preis: Jede Stufe verschiebt die Legitimationsbasis von Zustimmung zu Kontrolle. Der letzte Schritt macht die Kontrollinfrastruktur überflüssig — **total internalisierte Ordnung braucht keine Türme mehr**; das Spiel sagt das als kalte Mechanik, nicht als Zwischentext.

**Wer gewinnt / verliert.** Gewinner: die Stadt als Überlebensmaschine (Produktivität, kein Aufstand). Verlierer: Freiheit als Wert — messbar daran, dass der Ordnungspfad mit dem Glaubenspfad um dieselbe Ressource (Legitimation) konkurriert.

**Übernahme für Staatsräson.** Frostpunk ist unsere Referenz für die **Stufenleiter Innere Sicherheit** (MIL-6): Präsenz (sichtbare Polizei/Nationalgarde in Provinzen — Provinz-Unzufriedenheit ↓, Legitimität leicht ↓), aktive Maßnahmen (Razzien — kurzfristig Problem-Druck ↓, Kosten Budget + Presse + EGMR), Informanten/Überwachung (Dauerbonus auf Kontrolle, schleichender Preis auf Pressefreiheit/RSF und Wählergruppen-Vertrauen), Endstufe **„Neuer Orden"-Analog** (Regime-Wert-Verschiebung: ab einer Schwelle braucht das System keine sichtbare Kontrolle mehr — und Wiederherstellung der Offenheit wird zum eigenen mehrjährigen Vorgang mit Abgewöhnungspreis, wie bei HOI4s Mobilisierungs-Rückbau). Die Grenzziehung Militär/Polizei wird spielbar: Dieselbe Provinz kann durch Gendarmerie (innen) oder Armee (außen) „beruhigt" werden — mit verschiedenen Preislisten (Suzerains Gendarmerie-Entscheidung ist genau diese Weiche).

**Quellen (Abschnitt 11):** frostpunk.fandom.com/wiki/Order · thegamer.com Frostpunk-Raising-Hope · lonerstrategygames.com Frostpunk-Faith-or-Order · reddit.com/r/Frostpunk (Order-vs-Faith).

---

## 12. Kurzreferenzen: DEFCON, Realpolitiks, Power & Revolution

### 12.1 DEFCON (Introversion, 2006)

**Funktionsweise.** Globale Thermonuklearkriegs-Uhr: **DEFCON 5 → 1** als Pflicht-Countdown. 5: Einheiten platzieren, Radar aus; 4: Gegner sichtbar; 3: konventionelle Luft-/See-Angriffe frei; 2: Fortsetzung; 1: Atomwaffen frei. Ziel: nicht gewinnen, sondern **am wenigsten verlieren** — Score = Todesopfer-Verhältnis, Einschläge als nüchterne Popups („1.6 million dead"). Vergleich Twilight Struggle: dort *begrenzt* der DEFCON-Status Aktionen (Coups verboten), bei DEFCON 1 verliert der am Zug — Eskalationsuhr als **Eingriffs-Regulator**.

**Übernahme.** Unsere **Abschreckungs-Größe** (existiert als Politiknetz-Knoten) bekommt die DEFCON-Logik als **gegenseitige Sperrstufen**: Eskalationsstufen eines Konflikts schalten Optionen frei *und* sperren Ausstiege (je höher die Stufe, desto teurer der Rückzug — Balance of Power), und Atom-Analoga (Falls Türkei-Kernwaffen-Programm als dunkler Pfad) funktionieren nur als Schwelle, nie als Waffe: Überschreiten = Szenario-Ende, nicht Siegpunkte. „We do not reward failure."

### 12.2 Realpolitiks (Jujubee, 2017 / II 2020)

**Funktionsweise.** Teil 1: moderne Staaten, **Aktionspunkte (AP)** als Tageswährung, Krieg als **Aktionswahl ohne Einheitenkontrolle** („war button"), „Warmonger Points" als Fehlverhaltens-Konto (100 Punkte = Achievement „Nice Guys Always Finish Last"), Friedensverhandlungen (Provinz erwerben, Land befreien), Systemwechsel Demokratie → Totalitarismus, Atomwaffen-Projekte (M.A.D.). Teil II wechselte zu **voller Schlachtfeld-Kontrolle** — die Abstraktion wurde aufgegeben. Community-Urteil zu Teil 1: vernichtend bei den Kriegsmechaniken („Chile greift die Schweiz frontal an" — keine Geographie, keine Logistik, keine Plausibilität).

**Übernahme.** Doppelte Warnung: (a) **Eine Kriegs-Schaltfläche ohne Weltkontext ist schlimmer als kein Krieg** — unser Vorgang muss an Geographie (Nachbarschaft, Provinzen), Logistik (Infrastruktur) und Verhältnismäßigkeit hängen, sonst entsteht der Realpolitiks-Effekt. (b) Teil II zeigt die Genre-Schwerkraft Richtung Taktik — unser bewusstes „Nein" muss im Design verankert bleiben (ist es: ENTSCHEIDUNGEN Block C). AP als knappe Tageswährung entspricht unserem Politischen Kapital.

### 12.3 Power & Revolution (Eversim, GPS4)

**Funktionsweise.** Staatschef **oder Oppositionsführer**; 100.000+ Datenpunkte; Geheimdienst-Arsenal (Spionage, Sabotage, **Attentat**, Drohnenüberwachung) — **Entdeckung = Skandal** mit Folgekaskade; **UN-Mechanik: eine Nation anklagen, um ein Interventions-Mandat zu erhalten** — internationale Legalität als freispielbare Ressource; Parlament stimmt über Gesetze; Figuren-/Lobby-KI reagiert eskalierend (Interviews → Rücktritte → Proteste → Streiks → Unruhen); Ukraine-Szenario als Kriegs-Update: Schützengräben, Minenfelder, **Moral → Desertion**, **Teilmobilisierung**, Budgetierung von Ausbildung/Ausrüstung, Söldner-Truppen anheuern, internationale Militärbasen, Atomrisiko.

**Übernahme.** (a) **UN-Mandat als Legitimations-Klausel**: Vor einem Einsatzbeschluss kann am Verhandlungstisch/UN-Analog eine Resolution angestrebt werden — Erfolg halbiert die außenpolitischen Kosten (Civ-Rahmung mit echter Institution), Scheitern erhöht sie (öffentlich zurückgewiesen). (b) Geheimdienst mit **Entdeckungs-Blowback** passt exakt zu MIL-5/Block D: jede Operation mit Entdeckungswahrscheinlichkeit, Entdeckung = Vorgang mit Skandal-Kaskade (Presse, Beziehungsdimensionen, Parlament). (c) Moral→Desertion als Verlaufs-Kanal für unsere Verlaufsphase: nicht nur „Frontlage", sondern Truppenzusammenhalt als eigener Wert (Moralknoten existiert).

**Quellen (Abschnitt 12):** defcon.fandom.com/wiki/DEFCON · ign.com DEFCON-Review · nbcnews.com „No winner in Defcon" · tvtropes.org Defcon5 (Twilight-Struggle-Vergleich) · gamespot.com Realpolitiks-Cheats/Achievements · moddb.com Realpolitiks-II · game-solver.com Realpolitiks-Mobile-Reviews · blacknutlemag.com Realpolitiks-2 · power-and-revolution.com/presentation.php + Homepage-News (Ukraine-Szenario).

---

## 13. „Krieg ohne Schlachten" — ein Design-Toolkit

### 13.1 Typologie: sieben Muster, wie Spiele Krieg auf Führungsebene abbilden

| # | Muster | Kernfrage | Beispiele | Stärke | Schwäche |
|---|---|---|---|---|---|
| 1 | **Gesetzleiter + Schwellen** | „Wie weit darf der Staat die Gesellschaft umstellen?" | HOI4 Wirtschafts-/Wehrpflichtgesetze, Frostpunk Ordnung | Macht Vorbereitung politisch; Gates = Zeitpunkt-Entscheidungen | Kein Konflikt-Gegenüber, reine Innenperspektive |
| 2 | **Ultimatum-Konveyor** | „Kann man den Krieg noch aufhalten — und zu welchem Preis?" | Vic3 Diplomatic Play | Krieg als Verhandlung mit Countdown; beidseitige Ausstiegsrampen; Dritte käuflich | Braucht saubere Forderungs-Liste; ohne gute KI statisch |
| 3 | **Preisschild am Angriff** | „Was kostet dieselbe Handlung unter welcher Rahmung?" | Civ6 Casus Belli/Grievances, EU4 AE/Koalition | Weltöffentlichkeit als segmentiertes Konto; belohnt Legalismus | Abstrakt; kann zu „Preislisten-Gaming" verkommen |
| 4 | **Eskalations-Poker** | „Wer blinzelt zuerst — und was kostet Blinzeln?" | Balance of Power, DEFCON-Uhr | Dramaturgie pur; minimaler Mechanik-Aufwand | Zweierlogik; ohne lebendige Dritte steril |
| 5 | **Erschöpfungsuhr** | „Wessen politischer Wille bricht zuerst?" | Vic3 War Support, Civ6 War Weariness, Rebel Inc Reputation | Krieg = Zeit-Kosten-Kurve; Verhandlungsmacht messbar | Floor-Regeln nötig (sonst Aussitzen) |
| 6 | **Sieg als Verdauungsproblem** | „Was kostet das Gewonnene im Nachhinein?" | HOI4 Compliance/Resistance, Civ6 Loyalität, EU4 Overextension | Anti-Snowball; Besatzung als Investition statt Beute | Zahlenpflege je Provinz nötig |
| 7 | **Delegations-Dilemma** | „Wem vertraust du die Ausführung — und was tut er damit?" | Suzerain Valken/Iosef + Purge, Supreme Ruler Minister, CyberJudas | Personalie = Strategie; Berater als Unsicherheit | Braucht Figuren-System (haben wir) |

**Für Staatsräson empfohlene Kombination: 2 als Rahmen + 5 als Verlaufsmotor + 3 als Weltreaktion + 7 als Entscheidungsinhalt + 6 als Nachkrieg.** 1 liefert die Vorbereitung (unsere Mobilisierungsleiter, MIL-2), 4 ist der Großmacht-Nebenschauplatz (Eskalations-Duelle mit USA/Russland/EU im Krisen-Ereignisformat). Das ist exakt die Architektur, die MIL-1 skizziert — jetzt mit Zahlen-Unterbau.

### 13.2 Konkreter Ablaufvorschlag: Spannung → Frieden

**Phase 0 — Spannung (Wochen bis Jahre).** Auslöser: Beziehungsmatrix-Sicherheitsdimension sinkt unter Schwelle, Rote-Linie-Berührung, Grenzzwischenfall-Ereignis, Drittstaat-Krise mit Ausstrahlung. Spieler-Handlungen: keine Pflicht — Beobachtung, Aufklärung verstärken (Geheimdienst), Beschwichtigen oder Muskeln zeigen (Antwortskala nach Balance of Power). Märkte reagieren sofort (CDS-Aufschlag +, Lira −, Rüstungswerte +). **Kosten bisher: fast keine — genau das ist die Falle, die das Design zeigen muss.**

**Phase 1 — Drohkulisse (Vic3-Play als Vorgang).** Ultimatum/Forderungen am Verhandlungstisch (54 Klauseln sind die Forderungssprache); Eskalationsuhr in drei Abschnitten (Eröffnung / Manövrieren / Countdown); **Manöverpunkte** aus Rang (Ansehen-Dimension + Bündnistiefe); Dritte kaufen über Sway-Analog (Unterstützungspakete: Kredite, Basisrechte, Waffenlieferung, Klauselversprechen); **Teilmobilisierung sichtbar für beide Seiten** — kostet Budget/Woche und treibt den regionalen Spannungs-Index (2.4). Ausstiege: Nachgeben (alle Hauptforderungen des Gegners + Innenpreis: Öffentlichkeit, Offiziersvertrauen; **der Preis wächst mit der Eskalationsstufe**) oder Annahme (teurer Frieden, siehe Suzerain Reparationen). Märkte: CDS steigen stufenweise, Aktien fallen, Öl reagiert.

**Phase 2 — Einsatzbeschluss (Parlament + Kriegsraum).** Zweistufig: (a) **Politischer Beschluss** — Gesetz im Parlament (Kriegskredit/Einsatzmandat; Gate: Kriegsbereitschaft der Bevölkerung über Schwelle, sonst doppelte Kosten und Legitimitätsabzug; Verteidigungsfall = automatische Deutungshoheit mit Rabatt); Rahmung deklarieren (Selbstverteidigung/Schutz/Beistand/Revision — setzt die Preismultiplikatoren, 4.1); UN-Analog optional (12.3). (b) **Strategische Wahl** — Generalstab präsentiert 2–3 Pläne nach Doktrin-Ästen (jeder Plan: benötigte Bereitschaftsprofile, erwartete Dauerbandbreite, Logistik-Anforderungen, Verbündeten-Rollen); Lagebild mit bekannt/vermutet/unsicher; **Plan-Konsistenz-Regel**: Wechsel mitten im Krieg = Offiziersvertrauen-Einbruch + Zeitverlust (Suzerain).

**Phase 3 — Verlauf (Wochen-Ticks, Erschöpfungsuhr beidseitig).** Pro Tick: Frontlage-Delta aus `Bereitschaft×Doktrin-Passung×Logistikstatus×Moral` (Zufallsbandbreite, Mentorin erklärt die Treiber — unser „Warum"-Prinzip); Erschöpfung beider Seiten nach Vic3-Tabelle (Verluste, Besatzungsgrad, Radikale/Unzufriedene, Lobbys, Basisdrift); **0-%-Floor** (kein Fall unter 0 ohne Zielkontrolle); zivile Kanäle laufen weiter: Preise/CDS/Inflation monatlich, Wählergruppen (Kriegsmüdigkeit-Problem mit Hysterese), Offiziersvertrauen, Presse-Ereignisse, Verbündeten-Forderungen (Sway-Einlösung), Geheimdienst-Funde (Blowback-Chance), Katastrophen-Kopplung (Erdbeben im Krieg = Super-Gau-Ereignis). Spieler-Beschlüsse im Verlauf: Mobilisierungsstufe ändern (Kosten nach 2.1/2.2), Kriegsziele ändern (**teuer**: Rahmungsbruch → Grievance-Analog, Offiziersvertrauen, Parlament erneut), Waffenruhe anbieten, Logistik-Priorität setzen (Verwaltungskraft), Sondermaßnahmen mit Völkerrechtspreis.

**Phase 4 — Waffenruhe und Frieden (schrittweise, Verhandlungstisch).** Waffenruhe als eigener Beschluss (beide Seiten; Erschöpfungsstand = Annahme-Modifikator; Civ6-Logik: Müdigkeit sinkt schon in der Waffenruhe); dann **Frieden in Schritten**: Kontrolle/Verifikation (Beobachter-Klausel), politischer Vertrag (Gebiets-/Sicherheits-/Reparations-/Amnestie-Klauseln, Laufzeiten, jährliche Prüfung, Vertragsbruch-Erinnerung — alles vorhanden). **Keine Score-Auktion** (HOI4-Negativlehre, 2.6): Der Verlierer verhandelt mit; die Verhandlungsmasse kommt aus Zielkontrolle + Erschöpfung + Rahmung.

**Phase 5 — Nachkrieg (die eigentliche Rechnung).** Integrationslast je kontrollierter/besetzter Provinz (EU4-OE-Analog, Schwellen 50/100 %); Kooperation/Widerstand als Provinz-Werte (HOI4-Formel: Ertrag = Basis + Faktor × Kooperation); Rückstellungen: Demobilisierungs-Rechnung (90-Tage-Auslauf, Wiedermobilisierungs-Sperre — Vic3), Veteranen/Versorgung (Dauerbudget), Schulden/CDS-Normalisierung langsam, Offiziersvertrauen je nach Ausgang (Sieg stützt, Stagnation untergräbt, Niederlage = Putsch-Risiko mit Warnzeichen), Gedenken/Presse als Chronik-Einträge; Rahmungs-Konto verfällt langsam (`10 − x`-Analog); Verdauungs-Sperre: neue Eskalation innerhalb von X Monaten mit Malus.

### 13.3 Folge-Tabellen (Kalibrierungs-Gerüst)

**Tabelle A: Kriegszustand → Märkte & Geld**

| Kanal | Drohkulisse | Kriegsbeginn | Stagnation | Sieg-Kurs | Niederlage |
|---|---|---|---|---|---|
| CDS-Spread | + moderat, stufenweise | + deutlich | + schleichend weiter | − langsam | + scharf, Rating-Review |
| Lira/Wechselkurs | − leicht | − mittel | − mit Inflation gekoppelt | Erholung teilweise | Abwertungsdruck groß |
| Börse | − Rüstung +, Rest − | − breiter | ± sektoral | + Erleichterung | − breiter, Kapitalflucht-Event |
| Haushalt | Mobilisierungskosten/Woche | Kriegskredit + Mob-Stufe | Verschleiß + Verluste | Demob-Rechnung folgt | Reparationen möglich |
| Inflation | gering | über Güterpreise (Öl, Getreide) | zunehmend | normalisiert langsam | Versorgungs-Inflation |

**Tabelle B: Kriegsverlauf → Innenpolitik**

| Größe | Treiber | Richtung bei Erfolg | Richtung bei Stagnation/Niederlage |
|---|---|---|---|
| Kriegsbereitschaft (Gate) | Verlustlisten, Dauer, Frontnähe, Rahmungsbruch | sinkt langsam | sinkt schnell; < Schwelle: Mobilisierungsstufen sperren sich |
| Regierungsstabilität/Legitimität | Krieg an sich −; Erfolg +; Müdigkeit − | stabilisierend | Unruhe-Ereignisse, Proteste, Putsch-Warnzeichen bei Niederlage |
| Wählergruppen | differenziert: Grenzprovinz-Familien, Pazifisten, Nationalisten, Arbeitgeber (Fachkräfte-Abzug) | Nationalisten +, Falken + | breite −, Grenzprovinzen doppelt |
| Offiziersvertrauen | Plan-Konsistenz, Versorgung, Erfolg | + | Strategiestreit-Event, Purge-Versuchung, Rücktritte |
| Presse/Medien | Verluste, zivile Opfer, Völkerrechts-Klauselverletzungen | Erfolgsmeldungen | kritische Berichterstattung, Zensur-Versuchung mit RSF-Preis |

**Tabelle C: Krieg → Außen & Völkerrecht**

| Kanal | Effekt |
|---|---|
| Beziehungsmatrix (4 Dimensionen) | Sicherheit ↓ mit Gegner & dessen Partnern; Vertrauen ↓ je nach Rahmung; Handel ↓ über Sanktions-/Embargo-Ereignisse; Ansehen ± nach Ausgang & Legitimität |
| Ausstrahlung Drittländer | Empörung-Konto je Land (EU4); ≥ 3–4 über Schwelle + negative Gesamtbeziehung → Koalitions-/Sanktions-Vorgang |
| Rote Linien | Berührung durch unsere Operationen triggert Eskalations-Duelle (Balance of Power) |
| UN/EGMR/Völkerrecht | Sondermaßnahmen (Streumunition-Analog, zivile Opfer, Besatzungspraxis) → Resolutionen, EGMR-Verfahren als eigene Vorgänge, Beobachter-Klauseln erschwert |
| Bündnisse (NATO-Analog) | Beistands- und Konsultations-Ereignisse; unser Vorgehen verändert Bündnis-Vertrauen dauerhaft (S-400-Präzedenzfall existiert im Code) |

**Tabelle D: Wer gewinnt, wer verliert (Synthese aller Referenzen)**

| Gewinner | Verlierer |
|---|---|
| Rüstungsindustrie & Baubranche (Aufträge, MIO-Analog) | Konsumenten (Konsumgüterquote, Preise) |
| Generalstab (Einfluss, Budget, Autonomie) | Sozialbudget & Großprojekte (Opportunität) |
| Nationalisten-/Falken-Wählergruppen | Grenzprovinzen (Verwüstung, Flucht, Frontnähe-Müdigkeit) |
| Verbündete, die sich teuer verkaufen (Sway) | Fachkräfte-Arbeitsmarkt (Wehrpflicht-Stufen) |
| Der Präsident bei *schnellem, legitimem* Sieg (Putsch-Löscher, Suzerain) | Der Präsident bei Stagnation/Niederlage (Amtsenthebung, Putsch) — und bei Pyrrhus-Sieg: die nächste Legislatur (Schulden, Veteranen, Revolution-Brodeln) |

---

## 14. Top-15-Übernahmen (sortiert nach Wert/Aufwand)

Bewertung: Wert = Beitrag zur Kernfrage (Krieg als politischer Vorgang mit vollem Preis); Aufwand S < 1 Woche, M = 1–4 Wochen, L > 4 Wochen Design+Code. Verknüpfung mit Plan-IDs aus VERBESSERUNGSPLAN_2026-09-30.

| # | Übernahme | Quelle | Was genau | Wert | Aufwand | Plan-Bezug |
|---|---|---|---|---|---|---|
| 1 | **Erschöpfungsuhr mit 0-%-Floor** | Vic3 | War Support 100 → −100, Treiber-Tabelle (Verluste, Besatzung, Unzufriedene, Lobbys), Floor ohne Zielkontrolle | Sehr hoch | M | MIL-1 (Verlaufsphase) |
| 2 | **Zwei-Werte-Trennung „Kriegsbereitschaft" vs. „Regierungsstabilität"** | HOI4 | War Support/Stability; Krieg −20 % Stabilität pauschal; Verteidigung +20 / Angriff −20 | Sehr hoch | S | MIL-1/2; SPIELDESIGN Abs. 13 wörtlich |
| 3 | **Mobilisierungs-Gates an Bedrohungslage + Krisen-Blocker** | HOI4 | Stufen nur bei War-Support-/Feindstärke-Schwellen; Türkei-Spirits sperren Leiter | Sehr hoch | S–M | MIL-2 + MIL-3 |
| 4 | **Doktrin-Konsistenz-Zwang mit Planwechsel-Preis** | Suzerain | Valken/Iosef: Mischen scheitert; Wechsel = Vertrauens-/Zeitverlust; Purge löscht Optionen | Sehr hoch | M | MIL-1 (Einsatzbeschluss) |
| 5 | **Kriegs-Rahmung als Preismultiplikator** | Civ6 | Deklarierte Begründung setzt Kosten aller Folgehandlungen; Zielüberschreitung = 600 %-Analog | Sehr hoch | M | MIL-1 + Beziehungsmatrix |
| 6 | **Ultimatum-Konveyor (3 Phasen, Manöver, Backdown-Preis steigt)** | Vic3 + BoP | Vorgangs-Objekt: Eröffnung/Manövrieren/Countdown; Nachgeben = alle Hauptforderungen, Innenpreis wächst mit Stufe | Hoch | M–L | MIL-1 (Phasen 0–1) |
| 7 | **Sway: Dritte kaufen mit Preisliste** | Vic3 | Obligationen/Versprechen als Währung in der Drohkulisse; Abbruch −50 Beziehung | Hoch | M | AUS-Systeme vorhanden |
| 8 | **Demobilisierungs-Rechnung (90-Tage-Auslauf + Sperre)** | Vic3 | Runterfahren kostet wie Hochfahren, Wieder-Mobilisierung gesperrt | Hoch | S | MIL-1 (Phase 5), MIL-2 |
| 9 | **Versorgung = Handel + Infrastruktur** | Suzerain + Vic3 | Logistikstatus aus Abkommen/Handelsvolumen/Grenzprovinz-Bauwerken; Vorwarnung statt Überraschung | Hoch | M | MIL-1; nutzt Reich-Bausystem |
| 10 | **Frieden am Verhandlungstisch, nie Score-Auktion** | HOI4 (negativ) | Verlierer verhandelt mit; Masse aus Zielkontrolle + Erschöpfung + Rahmung | Hoch | M | MIL-1 (Phase 4) |
| 11 | **Kriegsmüdigkeit als Problem-Knoten mit Hysterese** | Civ6 | Treiber Verluste/Dauer/Frontnähe; Gegenmittel mit Preis (Informationspolitik −25 %, Waffenruhe-Reset) | Hoch | M | Politiknetz-Problem #16 |
| 12 | **Integrationslast / Kooperation-Widerstand je Provinz** | EU4 + HOI4 + Civ6 | OE-Schwellen 50/100 %; Ertrag = Basis + Faktor × Kooperation; Loyalitäts-Treiberliste | Hoch | L | Phase 5; Provinz-System |
| 13 | **Empörung-Konto + Koalitions-Schwelle (≥ 3–4 Länder)** | EU4 | Segmentierte Weltöffentlichkeit; Beitritt nur bei Konto > 50 UND Beziehung < 0; Waffenruhe-Schutz | Mittel–hoch | M | Ausstrahlungs-Ausbau |
| 14 | **Delegations-/Eigeninitiative-Regler für den Generalstab** | Supreme Ruler | Autonomie-Stufen mit Eskalationsrisiko; Minister-Empfehlung als Slider-Mitte | Mittel | S–M | PERSONEN-System |
| 15 | **Berater-Lagebilder mit Tonfall statt Prozentzahlen** | BoP + CyberJudas | Widersprechende Einschätzungen; „categorically refuses" als Warnung; verdeckte Agenden | Mittel | M | PER-2, KI-Texte |

*Bewusst nicht übernommen (Negativliste bestätigt/erweitert):* Score-Auktions-Frieden (HOI4), Echtzeit-Taktik und Einheiten-Designer (HOI4/Civ6/Realpolitiks-II), „war button" ohne Weltkontext (Realpolitiks I), globale Warmonger-Einheitswährung (Civ6-Warmonger als Einzelkonto; übernehmen stattdessen segmentierte Konten), Auslöschungs-Siegbedingungen (Rebel Inc. warnt explizit davor).

---

## 15. Offene Punkte und Unsicherheiten

1. **HOI4 Stability-Maximalboni**: Die Wiki-Tabelle (Government) wurde im Abruf abgeschnitten; die Sättigungswerte über 50 % (Produktion/PP) sind aus älteren Ständen bekannt (~+20 %), aber für den aktuellen Patch **[unverifiziert]**.
2. **Vic3 Manöverpunkte für Groß-/Mittelmächte**: Die Wiki-Tabelle zeigte Platzhalter statt Zahlen (nur nicht-anerkannte Ränge: 75/60/50/30 verifiziert). Vermutlich 100/90, **[unverifiziert]**.
3. **HOI4 Rechtfertigungs-Basistage**: Wiki nennt „6–9 Monate", Community-Quellen ~180 Tage für Eroberung; die genaue Formel (Basis je Kriegszieltyp × Modifikatoren) liegt in den Defines nur teilweise (`WARGOAL_PER_JUSTIFY_AND_WAR_COST_FACTOR = 1.5` etc.) — Werteband statt Punktwert verwenden. Die im Auftrag genannte Spanne 85–250 Tage ist plausibel, aber nicht gegen die aktuelle Wiki verifiziert.
4. **EU4 Waffenbruch-Werte**: Wiki-Abruf zeigte „−7 Stabilität, +7 Kriegserschöpfung, −70 AE" — das AE-Vorzeichen ist mit hoher Wahrscheinlichkeit ein Rendering-Fehler (Truce-Break erhöht AE); als Größenordnung zitierbar, exakt **[unverifiziert]**.
5. **Vic3 Infamie-Stufen** („reputable < 25, Pariah 100 +", Verfall −5/Jahr; „Cut Down to Size" bei Pariah): aus Grokipedia (C-Autorität), gegen das Paradox-Wiki zu prüfen, sobald die Seite wieder erreichbar ist.
6. **Civ6 Loyalität bei Eroberung** (Start 75, +50 % Vorbesitzer-Druck für 10 Runden): aus Grokipedia (C-Autorität); die Civilopedia-Seite bestätigt die Mechanik, nicht die Punktwerte **[unverifiziert]**.
7. **Suzerain Zahlen**: Budget-/Opinion-Werte für Turn 5 (Befestigung −1) und Turn 9 (Reparationen −2/+1/−3) sind aus der offiziellen Wiki (Decision-Seite) verifiziert; die Kriegs-Setup-Matrix (welche Flags nötig) stammt aus Community-Guides (Neoseeker, Reddit) — Torpor dokumentiert sie nie vollständig; bei Umsetzung als Kalibrierungs-Referenz 1–2 eigene Playthroughs empfohlen.
8. **Shadow President Tiefe** (exakte Aktionslisten, Budgetgrößen): Quellenlage dünn (keine Wiki mit Datenblatt); die Fünf-Kategorien-Struktur und Ereignis-Reaktionslogik sind belegt, Zahlen nicht. Ggf. Retro-Analyse des DOS-Originals.
9. **HOI4 Besatzungsformel** (`25 % + 65 % × Compliance`, Schwellen 25/50/75/90): aus RECHERCHE_MECHANIKEN (Wayback-Wiki) übernommen und in dieser Runde nicht erneut gegen die Live-Wiki geprüft — Konsistenz mit den aktuellen Defines (PEACE_COST_FACTOR_COMPLIANCE_STEPS 0→1,0/30→0,9/70→0,8) spricht für Gültigkeit.
10. **Energieverbrauch-Fabriken (HOI4 neueres Kohle/Strom-System)**: Tabellenwerte (−30 % bis +50 %) aus der Live-Wiki abgerufen, aber die Wechselwirkung mit den Gesetzleitern wurde nicht vertieft; für uns ohnehin nur als „Mobilisierung treibt Energiepreise" relevant.

**Methodischer Hinweis:** Paradox-Wikis sind Community-gepflegt und patch-empfindlich; bei der Kalibrierung (WIR-1-Lernfälle) sollten die hier zitierten Zahlen als *Größenordnungen und Strukturen*, nicht als zu kopierende Konstanten gelesen werden. Die Struktur (Leitern, Schwellen, Uhren, Konten) ist stabil über Patches; die Punktwerte wandern.
