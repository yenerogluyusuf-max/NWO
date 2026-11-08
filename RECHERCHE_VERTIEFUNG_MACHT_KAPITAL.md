# RECHERCHE-VERTIEFUNG: Macht- und Kapital-Systeme im Strategiegenre

**Stand: 30. September 2026. Vertiefung zu [RECHERCHE_MECHANIKEN.md](RECHERCHE_MECHANIKEN.md) und [VERBESSERUNGSPLAN_2026-09-30.md](VERBESSERUNGSPLAN_2026-09-30.md) — dupliziert deren Inhalte nicht, sondern beantwortet die Meta-Frage: _Welche Währungen regiert ein Machthaber, wie verdient und verliert er sie, und was passiert bei Überschuldung?_**

Ausgangsfrage des Auftraggebers (sinngemäß): „Wie funktioniert Kapital in diesen Spielen? Wie kann man das System ändern? Was kostet es, was bringt es? Machtspiele — wie wird Macht als Ressource modelliert?"

**Methodik und Verlässlichkeit**: Primärquellen sind die offiziellen Paradox-Wikis (eu4/hoi4/ck3/vic3/stellaris.paradoxwikis.com), das offizielle Old-World-Wiki (hoodedhorse.com), das offizielle Rebel-Inc-Wiki (wiki.gg), Cliff Harris' eigene Spielanleitung zu Democracy 4 (Steam), Soren Johnsons Designer Notes zu Old World, Entwicklerinterviews (PCGamer, Polygon, PAXsims) und das Suzerain-Wiki. Alles, was aus Spielerwissen oder Sekundärquellen ohne Gegenprobe stammt, ist als **[unverifiziert]** markiert. Bezug zu unseren Systemen: Politisches Kapital (Start 60, Einkommen ~3,5 + Vertrauen/Mehrheit/Legitimität, Max 150, Überziehung bis −20), Gesetz 301/600 vs. Erlass (Doppelpreis), Fraktionsverhandlung, Stimmenkauf 0,5/Stimme, Verwaltungskraft, Baukapazität, 11 Wählergruppen.

---

## Inhaltsverzeichnis

1. [Democracy 4 — die Kernreferenz](#1-democracy-4)
2. [Europa Universalis IV](#2-europa-universalis-iv)
3. [Hearts of Iron IV](#3-hearts-of-iron-iv)
4. [Crusader Kings III](#4-crusader-kings-iii)
5. [Victoria 3](#5-victoria-3)
6. [Civilization VI](#6-civilization-vi)
7. [Stellaris](#7-stellaris)
8. [Suzerain (Sordland & Rizia)](#8-suzerain)
9. [Old World](#9-old-world)
10. [Frostpunk](#10-frostpunk)
11. [Tropico 6](#11-tropico-6)
12. [Rebel Inc.](#12-rebel-inc)
13. [Kurzporträts: Realpolitiks, Power & Revolution, „Der Corruptor", Hidden Agenda (1988)](#13-kurzporträts)
14. [HERZSTÜCK: Die Währungen des Präsidenten](#14-die-währungen-des-präsidenten)
    - (a) [Master-Tabelle aller Währungen](#14a-master-tabelle)
    - (b) [Taxonomie](#14b-taxonomie)
    - (c) [Währungs-Architektur für Staatsräson + Konversions-Matrix](#14c-architektur-empfehlung)
    - (d) [Systemwechsel als Mechanik](#14d-systemwechsel)
15. [Top-15-Übernahmen (Wert/Aufwand)](#15-top-15-übernahmen)
16. [Unsicherheiten und offene Prüfpunkte](#16-unsicherheiten)

---

## 1. Democracy 4

Die direkteste Referenz: Democracy 4 hat genau eine explizite Machtwährung — **Political Capital (PC)** — und baut das gesamte Spieltempo um sie herum. Die folgenden Angaben stammen aus Cliff Harris' („cliffski") eigener offizieller Spielanleitung, ergänzt um die von ihm persönlich beantworteten Fragen im Steam-Guide-Kommentarbereich und die PC-Deckel-Regel aus der Community.

**Währungen**
- **Political Capital** (hart, sichtbar, institutionell): die einzige ausgebbare Machtressource.
- **Minister-Loyalität** und **Minister-Effektivität** (weich, personengebunden): indirekte Währungen — Loyalität bestimmt die PC-Produktion, Effektivität die Kosten und Umsetzungsgeschwindigkeit von Policies.
- **Wählergruppen-Zufriedenheit** inkl. **Zynismus** (U-Turns und Wahltermin-taktische Änderungen erzeugen gruppenbezogenen Zynismus) und **Complacency** („Was hast du zuletzt für mich getan?" — Zufriedenheit verfällt über Legislaturperioden) als weiche, verfallende Legitimitätskonten.
- **Parteimitglieder/Aktivisten** und **Spendengeld** (Wahlkampf-Währung, getrennt vom Staatshaushalt), **Staatsanleihen-Rating** (Kreditwürdigkeit als Preis für Verschuldung).

**Verdienen** (Quelle: cliffskis Guide, Abschnitt „Political Capital")
- PC wird **jede Runde (Quartal)** generiert aus vier Faktoren: **Popularität**, **Wahlmehrheit**, **Minister-Loyalität**, und **ob Emergency Powers in einer Krise aktiv sind**; dazu ein **Bonus zu Beginn einer neuen Amtszeit**.
- Minister erzeugen individuell PC; „mächtigere" Minister erzeugen mehr; die Produktion hängt direkt an ihrer Loyalität, die über die Zeit natürlich erodiert (Verjüngung durch Reshuffles nötig).
- **Koalitionsdeals**: In Drei-Parteien-Ländern reduziert eine Koalition das PC-Einkommen; der Koalitionspartner bietet aber Deals an — „führ unsere Policy ein, erhalte PC". (Das ist eine explizite **Konversion Politik→Kapital**.)

**Ausgeben**
- Preis steigt mit der Kontroversität der Aktion: „Non-controversial policy changes … may use very little political capital, whereas introducing conscription or the death penalty will require vast amounts." (Guide, wörtlich)
- Drei Preisklassen sind direkt an der UI ablesbar: die Segment-Anzeige am Policy-Icon zeigt, ob eine Slider-Änderung um **+10 %, +25 % oder mehr** mit dem vorhandenen Kapital bezahlbar ist — der Preis skaliert also mit der **Änderungsamplitude**, nicht nur mit dem Policy-Typ.
- Streichen und Einführen kosten beide; einige Grundgesetz-Policies (z. B. Abtreibung) können nicht gestrichen, nur positioniert werden.
- **Reshuffles** sind kostenlos (kein PR-Schaden wie bei Entlassungen); **Entlassungen** senken die Loyalität aller übrigen Minister — indirekte PC-Kosten über die Einkommensseite.

**Deckel und Überschuss**
- Der PC-Maximalwert beträgt **das Doppelte des Quartalseinkommens** (Community-Konsens, von cliffski im Guide-Kommentar implizit bestätigt: „let some capital roll-over to the next turn" — Horten ist also möglich, aber hart gedeckelt). [Quelle: Reddit r/Democracy4 „Political capital maximum", Autorität A]
- Überschuss über den Deckel verfällt schlicht — der Deckel erzwingt „use it or lose it" und macht die **Steigerung des Einkommens** (loyale, erfahrene Minister; hohe Mehrheit) zur eigentlichen Langzeitstrategie.
- **Emergency Powers**: In Krisen (Situations wie z. B. Pandemie) kann der PC-Output zeitweise erhöht sein („whether or not emergency powers are in effect in a crisis") — Krise als Kapital-Multiplikator. Details zur Auslösung: [unverifiziert], im Guide nur erwähnt.

**Überschuldung/Verfall**
- Es gibt **keine negative PC-Bilanz**: Nicht bezahlbare Aktionen sind schlicht nicht ausführbar. Mangel äußert sich als **Handlungsunfähigkeit** — das Spiel „läuft weiter" (Quartale vergehen, Statistiken driften), aber der Präsident kann nichts ändern. Verlieren tut man über Wahl oder Attentat, nie über PC.
- Minister-Loyalität verfällt natürlich; Zynismus/Complacency der Wählergruppen wachsen natürlich. Das ist D4s eigentlicher „Verfall": **Kapital-Einkommen ist an erodierende Beziehungen gekoppelt.**

**Allokations-Dilemma**
- PC ist knapp und deckelbeschränkt → jede Legislatur erzwingt eine Priorisierung: „Was sind die 2–3 wirklich wichtigen Änderungen?" Der Deckel (2× Einkommen) verhindert Horten für eine einzige „Mega-Reform" und bestraft Verschleiß von Kapital für Nebensächliches.

**Warum PC das Spieltempo steuert**: Rundenlänge (Quartal) × PC-Einkommen definiert den „Reformdurchsatz" pro Legislatur. Wer das Spiel „gewinnen" will, muss nicht Geld, sondern **Kapitalfluss** optimieren: Minister-Pflege, Mehrheitsgröße, Krisenfenster. Das ist die sauberste Umsetzung des Prinzips „Macht = Durchsatz, nicht Bestand".

**Übernahme für Staatsräson**: Bereits umgesetzt (PC mit Einkommensformel). Neu aus dieser Vertiefung: (a) der **Deckel als 2×-Einkommen-Regel** statt fixer 150 — koppelt Kapazität direkt an politische Stärke und macht „loyales Kabinett" zur Infrastrukturinvestition; (b) **Emergency-Powers-Multiplikator** als legitimer, sichtbarer Krisenbonus (passt zum geplanten Notstands-System REC-2); (c) **Zynismus/Complacency als eigene Konten pro Wählergruppe** — U-Turns bei Gesetzen (Erlass→Rücknahme→Erlass) müssen spürbar werden, sonst ist der Erlass-Weg ohne Selbstkosten.

Quellen: [Steam-Guide cliffski, „Basic Gameplay Guide"](https://steamcommunity.com/sharedfiles/filedetails/?id=2242836711), [Reddit r/Democracy4 „Political capital maximum"](https://www.reddit.com/r/Democracy4/comments/18jfg5v/political_capital_maximum/), [Cliffskis Blog (Einkommens-Rewrite, Kontext)](https://www.positech.co.uk/cliffsblog/2020/06/23/democracy-4-the-fixed-income-rewrite/)

---

## 2. Europa Universalis IV

EU4 ist das reichste Labor für „Macht als Währung": drei gleichberechtigte Machtpunkte-Töpfe plus ein halbes Dutzend Legitimitäts-Anzeigen.

**Währungen**
- **Monarch Power** in drei Sorten: **ADM** (Verwaltung), **DIP** (Diplomatie), **MIL** (Militär) — hart, sichtbar, institutionell-personalistisch gemischt.
- **Legitimacy** (0–100, Monarchien), **Republican Tradition** (0–100, Republiken), **Devotion/Meritocracy/Horde Unity** (Regierungsform-Varianten) — weiche Legitimitätswährungen.
- **Prestige** (−100 bis +100), **Stability** (−3 bis +3), **Power Projection** (0–100), **Corruption** (0–100, Schuld-Währung!), **Dukaten**, **Manpower/Sailors**.

**Verdienen** (Quelle: EU4-Wiki „Monarch power")
- Basis **+3/Monat je Typ**; Herrscher-Skill **+0 bis +6** je Typ; Berater **+1 bis +5** je Typ (Berater kosten Dukaten, quadratisch steigend mit Skill — **Konversion Geld→Macht**); **National Focus**: +2 auf einen Typ, −1 auf die beiden anderen (Nullsummen-Umverteilung); **Power Projection ≥ 50**: +1 auf alle drei.
- Speicher-Deckel: **999** je Typ (erhöht durch nicht übernommene Institutionen — Deckel als Balance-Werkzeug).

**Ausgeben** (Auswahl aus der Wiki-Preisliste)
- **Technologie**: 600 | **Idee**: 400 | **Provinz entwickeln**: 50 (steigend) | **Core**: 10 ADM je Development | **Stabilität +1**: 100 ADM, **+50 % Aufpreis von +1→+2, +100 % von +2→+3** (progressive Preiskurve!).
- **Inflation senken** (−2 %): 75 ADM | **Kriegsermüdung senken** (−2): 75 DIP | **Harsh Treatment** (Rebellenfortschritt −30 %): 2 MIL je Development (min. 50, max. 200) | **General/Admiral**: 50 MIL/DIP | **„Strengthen Government"**: 100 MIL für +10 Legitimacy bzw. +3 Republican Tradition — **explizite Konversion Machtpunkte→Legitimität**.
- Laufende Abflüsse: überzählige Diplomatie-Relationen −1 DIP/Monat je Relation über dem Limit; überzählige Heerführer analog −1 MIL/Monat (**Führungsdeckel als Abfluss**).

**Überschuldung/Verfall**
- Kein negativer Bestand möglich; stattdessen **Schulden in Nebenwährungen**: **Corruption** (0–100) wirkt als **+1 % „All Power Costs" je Punkt** — Korruption ist buchstäblich eine Hypothek auf alle Machtpreise, abbezahlbar gegen **Dukaten über Jahre** (Root-out-Schieberegler; exakter Satz: [unverifiziert], ~0,05 Dukaten/Entwicklung/Jahr je Abbaurate).
- **Niedrige Stabilität** (−1..−3): Unruhe, Aufstände; Republiken zahlen **Republican Tradition** für Wiederwahl desselben Herrschers — RT unter ~50 droht Monarchie-Umwandlung [Detailwerte unverifiziert]. **Legitimacy < 50** erhöht Unruhe und Ausländer-Einmischung [unverifiziert].
- **Prestige** driftet mit ~5 %/Jahr gegen 0 — eine **verfallende Reputationswährung**, die dauerhaft gepflegt werden muss.

**Allokations-Dilemma**
- Das klassische **Trilemma**: Dieselbe ADM-Punktzahl finanziert Tech ODER Cores ODER Entwicklung; MIL finanziert Tech ODER Generäle ODER Rebellen-Niederschlagung. Der National Focus (Nullsumme) macht die Entscheidung explizit: Stärke in einem Feld = Schwäche in zwei anderen.
- **Power Projection** belohnt Feindschaft (Rivalen erniedrigen) mit +1 auf alle Töpfe — Konversion „geopolitisches Theater→Verwaltungsdurchsatz".

**Übernahme für Staatsräson**: (a) **Progressive Preiskurve für Stabilitätskäufe** (Vorbild für „Legitimität kaufen wird exponentiell teurer"); (b) **„Strengthen Government"-Konversion**: MIL-Punkte → Legitimität entspricht bei uns: Baukapazität/Etat → Legitimität über Prestigeprojekte; (c) **Corruption als %-Hypothek auf alle Kapitalpreise** — eleganter als ein eigenes Korruptions-Minus: Korruption verteuert schlicht alles (passt zu unserem 4-Affären-System); (d) **Führungsdeckel mit Abfluss**: zu viele aktive Verträge/Vorhaben = monatlicher Kapitalabfluss (verwandt mit unserer Ressort-Stauanzeige REC-5).

Quellen: [EU4-Wiki „Monarch power"](https://eu4.paradoxwikis.com/Monarch_power), [EU4-Wiki „Modifier list"](https://eu4.paradoxwikis.com/index.php?title=Modifier_list)

---

## 3. Hearts of Iron IV

HOI4 trennt sauber zwischen **politischer** und **militärischer** Machtwährung — genau die Trennung, die ein Präsidentenspiel braucht.

**Währungen**
- **Political Power (PP)** — hart, sichtbar, Spannweite **−500 bis +2000** (Defines: `POLITICAL_POWER_LOWER_CAP = -500`, `UPPER_CAP = 2000`).
- **Command Power (CP)** — „die Fähigkeit der Regierung, die Befehlskette zu umgehen und direkt ins Militär einzugreifen" (Wiki); Deckel **80** (Basis).
- **Army/Navy/Air XP** — zweite Macht-Währung: Erfahrung als Investitionsgut (Doktrinen, Templates, Varianten).
- **Stability** und **War Support** (0–100 %) — Legitimitäts-Doppelskala (innen/außen).

**Verdienen** (Quelle: HOI4-Wiki „Political power", mit Defines-Zitaten)
- Basis **+2/Tag** (Regular); Schwierigkeitsmodifikatoren −15 % bis +50 %; **Stabilität moduliert**: −50 % bei 0 % Stab, +20 % bei 100 % Stab (linear um 50 % neutral).
- Führer-Traits: Hitler +10 % PP, Stalin +5 %, Edward VIII **−30 %** — Person des Führers als Einkommensmodifikator.
- **Achtung Kosten-Seite**: National Focus kostet **1 PP/Tag für ~70 Tage** — der Fokusbaum ist ein Dauer-Abfluss, keine Einmalzahlung.

**Ausgeben** (Wiki-Preise)
- **Gesetze, Minister, Firmen**: „adding an idea usually costing **150**" | Kommandeure: **5 + 5 je bereits vorhandenem** (max. 80) — eskalierende Personalpreise | Kriegsbegründung: **50** (Eroberung) / 25 (Kernrückholung) | Garantie: **25, jeweils +25 je weiterer** | Beziehung verbessern: 10 + 0,2–0,4/Tag laufend.
- **CP-Preise**: Trait-Zuweisung 15 | Beförderung zum Feldmarschall 40 | Attaché: 100 PP + 50 CP **dauerhaft gebunden** (blockierte Kapazität statt Kauf!) | Luftversorgung: 0,05 CP je Transportflugzeug (laufend).
- **XP-Preise** [teilw. unverifiziert]: Doktrin-Stufe ~100 XP, Divisions-Template ändern 5 XP, Schiffs-/Flugzeug-Varianten XP je Modul.

**Überschuldung/Verfall**
- PP kann bis **−500** sinken — das Spiel erlaubt explizite **Machtverschuldung** (z. B. durch Event-Effekte); bei negativem Stand sind die meisten Aktionen gesperrt, bis das Konto wieder positiv ist.
- **Stabilität unter 50 %** bei Krieg → Krisen bis **Bürgerkrieg**; **War Support < 50 %**: −50 % Mobilisierungstempo, −95 % CP-Zuwachs, −30 % Kapitulationsgrenze — das zweite Legitimitätsbein bricht weg.
- XP verfällt nicht, ist aber opportunitätsgebunden (wer keine Konflikte/Attachés hat, hat keine XP — **Krieg als XP-Quelle**).

**Allokations-Dilemma**
- PP: Gesetz vs. Minister vs. Diplomatie vs. Fokus-Dauerabfluss — vier konkurrierende Senken auf einen Fluss. CP: harter Deckel 80 erzwingt Auswahl (Attaché hier = keine Operation dort). XP: Doktrin (Langfrist) vs. Template-Anpassung (Sofort).

**Übernahme für Staatsräson**: (a) **Dauer-Abfluss statt Einmalpreis** für große Reformvorhaben (unser Vorgangs-Objekt könnte Kapital „über X Tage" abbuchen — macht Reformen widerrufbar-teuer und erzeugt Rhythmus); (b) **gebundene Kapazität** (Attaché-Modell) für Dauerhaftes wie Botschafter-Einsätze oder Präsidialkommissionen: nicht „kaufen", sondern „blockieren"; (c) **Führer-Trait als Einkommensmodifikator** — bei uns: Präsidenten-Herkunft/Stil modifiziert PC-Einkommen; (d) die Doppelskala **Stabilität (innen) / War Support (außen)** als Vorbild für „Vertrauen (innen) / internationales Ansehen (außen)".

Quellen: [HOI4-Wiki „Political power"](https://hoi4.paradoxwikis.com/Political_power)

---

## 4. Crusader Kings III

CK3 ist das Lehrstück für **persönliche** Machtwährungen und für Schulden-Ökonomien in Nicht-Geld.

**Währungen** (Quelle: CK3-Wiki „Resources")
- **Gold** (hart), **Prestige** (ausdrücklich als „political capital, social influence and goodwill" definiert!), **Piety** (religiöses Konto), **Renown** (Dynastie-Konto), **Influence** (nur administrative Regierungsformen), plus die **Machthaber-Währungen Dread, Hooks, Stress, Tyranny**.
- **Treasury vs. Gold**: administrative Reiche haben zwei Geldtöpfe (Staatsschatz vs. Privatvermögen) mit Konversions-Interaktionen und Stress-Kopplung (Geizhals zahlt Stress beim Überweisen!) — **Haushalts-Parallelität als Mechanik**.

**Verdienen/Ausgeben (Kernzahlen)**
- Prestige: laufend aus Titelrang + Diplomatie-Skill; ausgegeben für Kriege (nicht-heilige), Vasallen-Interaktionen, Entscheidungen; Tribal-Regierungen bezahlen **Soldtruppen in Prestige** (Machtwährung ersetzt Geld!).
- Piety: aus Learning-Skill, Tugend-Traits (+1/Tugend), Kircheninteraktionen; ausgegeben für heilige Kriege, Klerus-Deals, Gründung von Glaubensvarianten.
- **Fame/Devotion-Level**: Beim Erwerb von Prestige/Piety wächst parallel ein **unausgebbarer Level-Zähler** (Disgraced→The Living Legend; Sinner→Divine) mit Stufenboni — **doppelte Buchführung: ausgebbarer Fluss + dauerhafter Ruf**.

**Dread (Angst als Machthaber-Währung)**
- Skala **0–100**; driftet mit ~**0,5/Jahr** zum **natürlichen Dread** (Traits: Sadistic +35, Compassionate −15; Perks: Serve the Crown +15). Quelle: TheGamer/GameRant-Guides, CK3-Wiki Traits [Detailwerte zum Teil unverifiziert].
- **Quellen**: Hinrichtungen/Folter von Gefangenen (Menge ∝ Rang des Opfers); **Senken**: Gefangene freilassen ohne Forderung −10, Ultimaten von Fraktionen akzeptieren.
- **Wirkung**: versteckter **Boldness**-Wert je NPC; Dread ≥ Boldness+20 = **Intimidated** (z. B. +50 Erpressungs-Akzeptanz), ≥ Boldness+45 = **Terrified** (+100, **verweigern Fraktionsbeitritt und Schemes gegen den Herrscher komplett**) — Angst als Fraktions-Blocker.

**Hooks (Gefallen als Schulden!)**
- Drei Stärken: **weak** (Einmal-Gebrauch), **strong** (wiederverwendbar mit Abklingzeit, blockiert feindliche Aktionen des Betroffenen, erzwingt Scheme-Beitritt), **perpetual** (permanent, nicht ablegbar).
- Quellen: Erpressung über Geheimnisse (Dauer „bis Geheimnis enthüllt"), „Fabricate Hook"-Scheme (10 Jahre), Zufalls-Events, Haus-Oberhaupt automatisch bei Geburten; **Treasury-Schuldentilgung für einen Vasallen = Strong Hook für 20 Jahre** (Schuldübernahme→Haken!).
- Verwendung: Vertragsänderung ohne Tyrannei, erzwungene Heiraten/Ratsämter, Rücktritte.

**Stress (Selbstkosten der Figur!)**
- Aktionen, die gegen die Persönlichkeit der Figur gehen, kosten **Stress** (z. B. Mitfühlend-Figur zahlt Stress für Hinrichtungen, Erpressung, Titelentzug; Sadistische Figur **gewinnt** Stressabbau durch Hinrichtungen). Stress-Stufen lösen **Mental Breaks** aus (Zwangsevents mit dauerhaften Folgen); Bewältigungs-Traits geben +20 % Stressabbau mit 3-Jahres-Abklingzeit-Entscheidungen. → **Die Figur selbst ist ein Verbrauchsgut**: Machtausübung gegen die eigene Natur hat einen Gesundheitspreis.

**Tyranny**: Rechtswidrige Aktionen (grundlose Inhaftierung, Titelentzug) erzeugen Tyrannei-Opinion-Mali bei allen Vasallen, abklingend über Jahre; Weak Hook macht Vertragsänderung tyranniefrei — **Haken als Tyrannei-Vermeidungswährung**.

**Schulden (Gold < 0)**: gestaffelte Tabelle nach **Jahren Einkommen, die zur Tilgung nötig wären**: ab 0 Jahren −10 % Heergröße/Verstärkung, −10 % Entwicklung, −5/−10 Meinung … bis 100 Jahren −95 % auf fast alles; dazu: **Kriegserklärung verboten**, keine Verstärkung, Negativ-Events. → Das eleganteste Defizit-Modell des Genres: **Strafe skaliert mit der Tilgungsdauer**, nicht mit dem absoluten Betrag.

**Übernahme für Staatsräson**: (a) **Hooks = unser Gefallen-System** (REC-3, schon geplant — hier die Feinheiten: Stärkestufen, Abklingzeit, Blocker-Wirkung); (b) **Dread-Analogon**: „Härte"-Ruf des Präsidenten, der mächtige Akteure (Generäle, Oligarchen-Äquivalente, Parteiführer) vom Fraktionsbeitritt abhält — mit Abdrift zu einem Persönlichkeits-Naturalwert; (c) **Stress-Analogon**: Präsidenten-Person mit Überzeugungs-Profil; Aktionen gegen das eigene Profil kosten „Belastung" mit Stufenfolgen (körperlich/politisch); (d) **Schulden-Tabelle nach Tilgungsjahren** als Vorbild für unsere PC-Überziehung (siehe Kapitel 14c — Kritik an der jetzigen −20-Mechanik); (e) **Fame/Devotion-Doppelkonto**: ausgebbares Kapital + unausgebbare, dauerhafte „Statur" (Level mit Schwellenboni) — trennt „was ich habe" von „wer ich bin".

Quellen: [CK3-Wiki „Resources"](https://ck3.paradoxwikis.com/Resources), [CK3-Wiki „Hooks"](https://ck3.paradoxwikis.com/Hooks), [FandomSpot „CK3 Hooks"](https://www.fandomspot.com/ck3-hooks/), [GameRant „How (and Why) to Gain Dread"](https://gamerant.com/ck3-crusader-kings-3-how-why-gain-dread/), [TheGamer „Dreadful Ruler"](https://www.thegamer.com/crusader-kings-3-how-get-dreadful-ruler-achievement/), [CK3-Wiki „Traits"](https://ck3.paradoxwikis.com/Traits), [CK3-Wiki „Attributes"](https://ck3.paradoxwikis.com/Attributes)

---

## 5. Victoria 3

V3 liefert das präziseste Defizit-Modell des Genres: Kapazitäten sind **Fluss-Bilanzen**, keine Konten.

**Währungen** (Quelle: V3-Wiki „Capacity")
- **Bürokratie** (Steuern eintreiben, Institutionen betreiben), **Autorität** (persönliche Macht des Staatsoberhaupts: Dekrete!), **Influence** (Diplomatie), plus Geld als vierte Hauptwährung.
- **Keine Lagerhaltung**: „Capacities are not pooled resources, instead having a constant generation and usage." Basis **+100 je Kapazität**; Überschuss/Defizit wirken **proportional zur Erzeugung** — voller Bonus bei Nutzung ≤ 50 % der Erzeugung, volle Strafe bei Nutzung ≥ 200 %.

**Verdienen**
- Bürokratie: Verwaltungsgebäude (+10/20 % über Petite-Bourgeoisie-Trait). Autorität: **fast ausschließlich aus Gesetzen** — je repressiver, desto mehr: Monarchie/Theokratie +200, Einparteienstaat/Neoabsolutismus +250, Autokratie +200, **Allgemeines Wahlrecht 0**, Anarchie **−50 %**; dazu **+50 % über Technologien** (Massenpropaganda etc.) und — Schlüsseldetail — **der Herrscher erzeugt Autorität in Höhe seiner Popularität** (Beliebtheit 50 = +50 Autorität). Influence: aus Rang (Großmacht 1000 … unbedeutende Macht 500), Rivalitäten.
- → **Systemwahl ist die Einkommensentscheidung**: Demokratisierung kostet Autorität-Einkommen, gibt aber Legitimität (s. u.). Das ist die eleganteste „Demokratie↔Autokratie"-Preisgleichung des Genres.

**Ausgeben**
- **Dekrete: 100 Autorität** | **Politisch unterstützen/unterdrücken: 200 Autorität** | Konsumsteuern 100–500 | Institutionen: 1 Bürokratie/Level je 100.000 Einwohner | Generäle: 10 + 5 je Beförderungsstufe (max. 30) | Diplomatische Pakte: laufender Influence-Abfluss (Kosten modifiziert durch Rang).

**Defizitfolgen (voll ausdifferenziert!)**
- **Bürokratie-Defizit = „Administrative Overburden"**: bis zu **+100 % Steuerverlust, +100 % Verschwendung staatlicher Dividenden** (Skala nach Defizitgröße).
- **Autorität-Defizit = „Political Dysfunction"**: bis zu **−10 Approval der Oppositionsgruppen, +20 % Radikale aus politischen Bewegungen** — Defizit in der Machtwährung erzeugt direkt Opposition.
- **Influence-Defizit = „Diplomatic Overreach"**: bis zu **−50 % Prestige**.
- Überschüsse spiegeln das: „Legislative Efficiency" bis **+25 % Gesetzgebungstempo**, „Diplomatic Mitigation" +25 % Infamy-Abbau. Aktionen sind bei Defizit nicht gesperrt, aber der Staat **blutet aus** — V3s Prinzip: **Überziehen erlaubt, aber progressiv bestraft**.

**Legitimacy der Regierung** (Quelle: V3-Wiki „Government", „Power structure laws")
- Skala 0–100 mit Schwellen: **Illegitimate (<25), Unacceptable (25–49), Contested (50–74), Legitimate (75–89), Righteous (90+)**; Effekte: Gesetzgebungstempo, Oppositions-Approval aus Bewegungen (+50 % bei Unacceptable, −25 % bei Righteous), monatliche Radikale/Loyalisten (−3 bei Illegitimate …).
- Quellen: Regierungszusammensetzung (Clout-Verhältnisse), Wahlrecht (**Allgemeines Wahlrecht: +110 Legitimität aus Stimmen, +25 aus Clout**) — Wahlen sind eine Legitimitätsdruckmaschine.

**Interest Groups**: Approval −20…+20 (Gesetzes-Stances ±2 je Position, gedeckelt ±5; Gesetzesänderungen ±5/±10/±20 je Schrittzahl; je ~6 % Loyalisten +1, je ~6 % Radikale −1). Schwellen: **Angry ≤ −10** (nicht in Regierung aufnehmbar, radikalisieren Bewegungen), Unhappy −9…−5 (negativer Trait aktiv), Happy +5…+9, **Loyal ≥ +10** (zweiter positiver Trait). **Clout** = politisches Gewicht aus Pop-Stärke. → V3 trennt: **Approval (Stimmung, kippt Traits) × Clout (Macht, zählt für Legitimität)** — genau unsere Unterscheidung Wählergruppe (Stimmung) vs. Fraktion (Stimmen).

**Übernahme für Staatsräson**: (a) **Verwaltungskraft/Baukapazität als Fluss-Bilanz mit V3-Defizitformel** (Strafe ∝ Überlast/Erzeugung, volle Strafe bei 200 %) — statt harter Sperre „max. 8 Vorhaben"; (b) **Autoritäts-Prinzip**: repressive Maßnahmen erhöhen den Machtfluss, demokratische die Legitimität — der Kern-Zielkonflikt der Türkei-Bühne, direkt übernehmbar als Wirkpaarung im Politiknetz; (c) **Herrscher-Popularität erzeugt Macht-Einkommen** (unser PC-Einkommen aus Vertrauen — schon so, jetzt referenzbelegt); (d) Legitimitäts-Schwellen mit diskreten Stufen-Namen („umstritten", „gefestigt") statt nackter Zahl.

Quellen: [V3-Wiki „Capacity"](https://vic3.paradoxwikis.com/Capacity), [V3-Wiki „Interest group"](https://vic3.paradoxwikis.com/Interest_group), [V3-Wiki „Government"](https://vic3.paradoxwikis.com/Government), [V3-Wiki „Power structure laws"](https://vic3.paradoxwikis.com/Power_structure_laws)

---

## 6. Civilization VI

Civ 6 zeigt drei verschiedene Machtwährungs-Designs auf einmal: eine internationale Stimm-Währung, ein Personal-Investitions-System und ein Era-Karma.

**Währungen**
- **Diplomatic Favor (DF)** — Weltkongress-Währung (hart, handelbar!). **Governor-Titel** — Personal-Kapital (dauerhaft investiert). **Era Score** — Zeitalter-Konto (Schwellen-basiert: Golden/Dark Age). Dazu **Grievances** (bilaterale Beschwerde-Konten) und **Allianz-Level**.

**Verdienen/Ausgeben DF**
- Quellen: Regierungsform (laufend/Runde), Suzeränität über Stadtstaaten, Allianzen, Wunder (z. B. Statue of Liberty), das Zurückgeben von eroberten Städten, Weltkongress-Resolutionen (z. B. „Policy Treaty": +1 DF/Runde für alle mit dieser Policy; „Governance Doctrine": **+15 DF je Ernennung/Beförderung eines Gouverneurs des gewählten Typs** — Resolution als Subventionsinstrument!). Quelle: Civ-Fandom „World Congress (Civ6)".
- Ausgeben: **Stimmen kaufen** — die Erststimme ist frei, jede weitere Stimme in derselben Abstimmung kostet DF (Eskalationspreis; exakte Stufung 10/20/40…: [unverifiziert], Community-Guides empfehlen „0 oder 10 DF je Abstimmung" als Sparstrategie); DF ist **mit Gold handelbar** (Konversion Reichtum↔Diplomatie) und für Diplomatic-Victory-Punkte nötig.
- → **Diplomatie als Auktionswirtschaft**: Wer hortet, diktiert späte Abstimmungen; wer verkauft, finanziert das Reich. DF ist die einzige Machtwährung im Vergleichsfeld, die einen **echten Marktpreis** hat.

**Governors**: Titel kommen aus dem Civics-Baum (begrenzt!); jeder Titel = neuer Gouverneur ODER Beförderung eines bestehenden (Skillbaum); Beförderungen sind **permanent und exklusiv** — Titel als knappes, unausgebbares Investitionsgut mit irreversibler Allokation. [Detailwerte unverifiziert]

**Era Score**: Punkte aus „historischen Momenten" (Erstkontakte, Wunder, Siege); Schwellen bestimmen Golden Age (Boni, Dedication-Effekte) vs. Dark Age (Mali, aber stärkere Dedications beim Aufstieg) — **Karma-Konto mit Schwellen, nicht mit Kauf**. Dark Age ist kein Game Over, sondern ein Modus mit eigenem Chance-Profil (Heroic Age bei direktem Aufstieg).

**Grievances/Grievance-Decay**: bilaterale Konten, die Handlungen „rechtfertigen" (vergeltete Grievances = keine Warmonger-Strafe) und natürlich auslaufen — schon übernommen (bilaterale Grievance-Konten).

**Übernahme für Staatsräson**: (a) **DF-Prinzip für internationale Bühne**: eine ausgebbare, handelbare „Diplomatische Gunst" der Türkei gegenüber EU/UN/Rat-Abstimmungen — Stimmen im Europarat/UNHRC kosten Gunst mit Eskalationspreis je Zusatzstimme; (b) **Governor-Logik für Minister/Bürokraten**: Beförderungspunkte knapp und irreversibel (unser Kabinett könnte „Karrierepunkte" je Minister erhalten); (c) **Era-Score-Analogon**: „Amtsbilanz" mit Schwellen — keine ausgebbare Währung, aber Modus-Wechsler (z. B. „Historischer Moment" schaltet Dedication-artige Agenda-Boni frei); (d) Resolution als Subventionshebel (Weltkongress bufft Gouverneurs-Ernennungen) → EU-Förderprogramme, die unsere Bauvorhaben-Typen temporär verbilligen.

Quellen: [Civ-Fandom „World Congress (Civ6)"](https://civilization.fandom.com/wiki/World_Congress_(Civ6)), [MyGURPS „Civ 6 Diplomatic Victory"](https://www.mygurps.com/index.php?n=Main.Civ6DiplomaticVictory)

---

## 7. Stellaris

Stellaris zeigt die konsequenteste **Engpass-Ökonomie**: Influence ist so konstruiert, dass man nie genug hat.

**Währungen** (Quelle: Stellaris-Wiki „Resources"/„Influence")
- **Influence** (hart, **einzige abstrakte Ressource mit Lagerdeckel: 1000**) — „political clout" für Expansion und Diplomatie.
- **Unity** (hart, unbegrenzt lagerbar) — „collective resolve" für Innenpolitik.
- **Research** (3 Fächer), **Energy/Minerals/Food/Trade/Alloys/CG** (materiell), **Envoys/Naval Capacity/Station Capacity** (Deckel-Währungen).

**Verdienen/Ausgeben Influence**
- Einkommen „remains fairly stable" (flach, ~+3–5/Monat, modifiziert durch Rivalen-Erklärungen und Flotten-Power-Projection) — bewusst schwer skalierbar.
- Senken: **Claims**, **Außenposten bauen**, diplomatische Pakte (**laufender Unterhalt**), Subjekt-Integration, Habitat/Megastruktur-Entscheidungen. → Influence ist der **Expansionspreis**: Wer schneller wachsen will, als das Machtkonto hergibt, muss Rivalitäten inszenieren (Konversion Feindschaft→Einfluss).

**Verdienen/Ausgeben Unity**
- Quellen: Jobs (Priester, Verwalter), Factions-Approval; Senken: **Traditions freischalten, Anführer rekrutieren/entlohnen, Edicts (Kosten + laufender Unterhalt), Wahlen beeinflussen, Regierung reformieren, Planeten-Entscheidungen**.
- **Edict-Fund-Mechanik**: Edicts kosten Unity-Unterhalt gegen einen Edict-Fund/Deckel — Daueraktivierungen als gebundene Kapazität.

**Defizitfolgen (beachtlich scharf)**
- **Influence-Mangel (Lager 0 bei negativem Fluss)**: **−20 % Happiness** imperiumsweit.
- **Unity-Mangel**: **−20 Stabilität, −100 % Governing Ethics Attraction** — der Staat verliert ideologische Kohärenz, wenn das „Wir-Gefühl"-Konto überzogen ist.
- Materielle Ressourcen bei 0 + negativem Fluss: **Shortage-Situationen** (eskalierende Strafen).

**Allokations-Dilemma**: Influence erzwingt die Grundentscheidung „Breite (Expansion) vs. Bindungen (Pakte)"; Unity „Traditionen (Identität) vs. Edicts (aktuelle Boni) vs. Regierungsumbau".

**Übernahme für Staatsräson**: (a) **Unity-Mangel-Folge** als Vorlage für unsere Legitimitäts-Untergrenze: Legitimität < Schwelle → Polarisierung/Unzufriedenheit steigt, Partei-Attraktion bröckelt; (b) **Edict-Fund**: unsere Erlasse könnten einen „Erlass-Haushalt" haben (max. N aktive Erlasse, Unterhalt in Verwaltungskraft) — verhindert Erlass-Spam ohne hartes Verbot; (c) **Rivalen-Ökonomie**: inszenierte Konfrontation (z. B. mit EU oder Nachbarn) als bewusster Einkommens-Kanal für Kapital — „Krise nützt dem Präsidenten", wie D4s Emergency Powers.

Quelle: [Stellaris-Wiki „Resources"](https://stellaris.paradoxwikis.com/Influence)

---

## 8. Suzerain

Suzerain ist der Gegenbeweis: **Macht OHNE explizite Machtwährung** — und (im Rizia-DLC) die nachträgliche Einführung expliziter Währungen. Beide Varianten sind für uns lehrreich.

### 8.1 Sordland (Basisspiel): Knappheit durch Zeit, Züge und Gefallen

- **Struktur**: ~10 Kapitel („Turns") à mehrere Monate; jede Szene bietet endlich viele Entscheidungspunkte; **die eigentliche Währung ist die Zugfolge**: Wer in der Budget-Sitzung dem Verteidigungsressort gibt, kann nicht gleichzeitig Gesundheit bedienen. Quelle: Design allgemein, u. a. PAXsims-Kontext und Patchnotes [Detail unverifiziert].
- **Budget**: Der Staatshaushalt wird in **wenigen, großen, irreversiblen Allokationssitzungen** verteilt (Plus/Minus in abstrakten Punkten); spätere Sitzungen referenzieren frühere Entscheidungen — **Irreversibilität ersetzt den Preis**. Im 3.0-Patch: „Increased starting government budget by 1", „Extra budget detraction in trade deal" — die Einheit heißt schlicht „budget".
- **Gefallen-Netzwerk**: Zusagen an Oligarchen (Tusk/Koronti), Parteifreunde (Gus), Justiz (Edmonds/Garaci), Gewerkschaften und Minderheiten sind **Flags mit Buchhaltungslogik**: gebrochene Zusagen feuern später (Impeachment-Achse über Gericht und Assembly). Macht = **Summe gehaltener Versprechen**.
- **Persönliches Vermögen** ist vom Staatshaushalt getrennt (Anlagen wie Gasom-Aktien; Vetting-Option) — Haushalts-Parallelität als moralisches Spannungsfeld, nicht als Ressourcentausch.
- **Verfassungsreform als Endgegner**: neuer Verfassungstext braucht die Assembly (**2/3-Hürde** für die große Reformlinie) und passiert den **Supreme Court**; Richter lassen sich über Einzeldeals und Impeachment-Optionen ersetzen — mit Rachepotential („successfully replaced every last judge … screwing over those I had allied with" — Spielerbericht, rpgcodex). → **Systemwechsel ist das Boss-Level**: der härteste Preis ist nicht Geld, sondern die **Summe aller Allianzen gleichzeitig**.
- **Warum das funktioniert**: Narrative Dichte (450k+ Wörter) macht jede Knappheit sichtbar; die Abwesenheit einer Zahl verhindert Optimierungs-Flucht — der Spieler kann nicht „farmen", sondern nur **tauschen**: Zeit gegen Vertrauen, Vertrauen gegen Zusagen, Zusagen gegen Durchsetzung.

### 8.2 Kingdom of Rizia (3.0-DLC): explizite Drei-Währungen-Ökonomie

Das DLC führt genau die Währungen ein, die Sordland vermied — ein kontrolliertes Experiment desselben Studios:
- **Authority** (Macht), **Budget** (Geld), **Energy** (Rohstoff-Sicherheit) — mit **Kapazitäten** und **Per-Turn-Flüssen**, Dekrete mit kombinierten Preisen.
- Preisbeispiele aus dem offiziellen Wiki („Royal decrees"): „Expansion of Crown Administrative Authorities": **−2 Authority, −1 Energy, −5 Budget, ~2 Turns Implementierung → +4 Authority-Kapazität, +2 Authority/Turn, +5 Budget-Kapazität** (Man kauft Einkommensinfrastruktur mit Bestand); „Welfare Privatization": −3 Authority, **+3 Budget**, +1 Energy/Turn, −2 Public Opinion (Konversion Macht+Stimmung→Geld); Energiekäufe: −5/−6 Budget für +3 Energy; „Privatize Crown Lands": −3 Authority, +6 Budget, −3 Public Opinion, +1 „Broke Tradition".
- Militär als **passiver Machtmodifikator**: aufgestellte Divisionen erhöhen den Authority-Modifikator (Machtprojektion), senken aber den Budget-Modifikator.
- Community-Urteil (GOG-Review): Das additive Budget/Authority/Energy-System ist **„easier to get a handle on than the opaque economy recovery metrics in base Suzerain"** — explizite Währungen sind zugänglicher, aber weniger dicht.

**Übernahme für Staatsräson**: (a) Die **Kombinationspreise** der Rizia-Dekrete (jede Aktion zieht 2–4 Konten gleichzeitig) sind das direkteste Vorbild für unsere Gesetz/Erlass-Preisgestaltung — keine Aktion kostet nur Kapital; (b) **Kapazitäts-Upgrades als Aktionen** („Verwaltung ausbauen" kostet jetzt Kapital+Geld, bringt dauerhaft Einkommen) — unsere Verwaltungskraft-Leiter existiert, sollte aber auch **Einkommen erhöhen**, nicht nur Slots; (c) Sordlands Lektion für unsere Dialog-/Verhandlungsebene: **Zusagen als Schuldbuch**, gebrochene Zusagen mit verzögerter Rache; (d) Rizias Lektion für die UI: drei sichtbare Konten mit +X/Turn-Anzeige schlagen jede verdeckte Formel in Zugänglichkeit.

Quellen: [Suzerain-Wiki „Royal decrees"](https://suzerain.wiki.gg/wiki/Royal_decrees), [Reddit r/suzerain 3.0.0 Changelog](https://www.reddit.com/r/suzerain/comments/1bnjaim/suzerain_300_kingdom_of_rizia_dlc_launch_changelog/), [GOG-Review „Suzerain: Kingdom of Rizia"](https://www.gog.com/en/game/suzerain_kingdom_of_rizia), [rpgcodex Suzerain-Thread (Spielerberichte)](https://mail.rpgcodex.net/forums/threads/suzerain-political-simulator-rpg-hybrid-by-torpor-games-now-with-kingdom-of-rizia-dlc.132719/), [Catholic Game Reviews „Suzerain + Rizia"](https://catholicgamereviews.com/suzerain-rizia/)

---

## 9. Old World

Old Worlds **Orders** gelten als die eleganteste Ressource des Genres — weil sie die unausgesprochene Grundwährung aller Strategiespiele sichtbar machen: **Aufmerksamkeit/Handlungsfähigkeit pro Zeitscheibe**.

**Währungen** (Quellen: Old-World-Wiki hoodedhorse.com, Designer Notes #1)
- **Orders** (pro Jahr/Runde): geteilter Pool für **alles** — Einheitenbewegung, Charakteraktionen (Council-Ernennung: 100 Civics + **2 Orders**; „Influence"-Aktion: 200 Geld + 2 Orders), Diplomatie, Gesetzeswechsel.
- **Legitimacy**: passives Herrscher-Konto; **jeder Punkt = +0,1 Orders/Runde und +1 Familien-Meinung** (direkte Konversion Legitimität→Handlungsfähigkeit!); Quellen: Ambitions (+10 erfüllt / −5 gescheitert; als Legacy nur +5), Cognomen-Titel (100.000 Punkte für „The Great"), Events. **Verfällt NICHT bei Herrscherwechsel** (Ruf ist institutionell geworden).
- Civics/Training/Science/Growth/Money als Produktionswährungen; **Cognomen-System** (positiv wie „The Victorious" bis „The Great" +100 Legitimität; negativ bis „The Bloody" −100).

**Die Kernregeln der Eleganz**
1. **Ungenutzte Orders verfallen** („automatically sold for gold and will not carry over") — kein Horten: Knappheit ist pro Zeitscheibe, nicht kumulativ.
2. **Fatigue-Deckel pro Einheit** (3–5 Züge) verhindert, dass ein einzelner Akteur den ganzen Pool frisst — Knappheit + Verteilungsregel.
3. **Dauerhafte Bindung**: Gebäude wie Shrines/Garrisons kosten „a permanent slice of your overall order production" (PCGamer-Preview) — Infrastruktur als laufender Abfluss.
4. Ursprung laut Soren Johnson: Facebook-Energy-Systeme („Actions become a resource"); das System wurde **~99-mal iteriert**; die interne Debatte (unbegrenzte Moves vs. Fatigue) ist in den Designer Notes dokumentiert.

**Warum sie gelobt wird**: Sie bestraft Mikromanagement nicht durch Verbote, sondern durch **Opportunitätskosten-Sichtbarkeit**: „You don't make those choices because you want to. You make them because you have to" (Johnson über EUM-Spiele). Orders zwingen die Frage „Was ist mir diese Runde wirklich wichtig?" — die exakte Frage, die ein Präsidentenspiel stellen muss. Und: Legitimität ernährt direkt den Order-Fluss (0,1/Punkt) — **Ruf ist Durchsatz**.

**Übernahme für Staatsräson**: (a) **Aufmerksamkeit als eigene Währung** („Präsidiale Aufmerksamkeit" pro Woche/Monat): Gespräche, Verhandlungstisch-Sitzungen, Krisen-Interventionen und Erlass-Signaturen ziehen aus einem nicht-hortharen Pool — löst unser implizites „alles gleichzeitig"-Problem ohne neue Verbote; (b) **Verfall statt Deckel**: nicht genutzte Aufmerksamkeit verfällt (oder wird in schwachen Presse-/Vertrauens-Output konvertiert, Old-World-„sold for gold"-Analogie); (c) **Dauerhafte Bindung**: laufende Vorgänge (Kommissionen, Sonderermittler, Großbaustellen-Aufsicht) belegen Aufmerksamkeit, bis sie enden; (d) **Legitimität→Durchsatz-Konversion**: unsere Legitimität könnte direkt das Aufmerksamkeits-/PC-Einkommen modulieren (0,1-Modell).

Quellen: [Old-World-Wiki „Legitimacy"](https://wiki.hoodedhorse.com/Old_World/Legitimacy), [Old-World-Wiki „Characters"](https://wiki.hoodedhorse.com/Old_World/Characters), [Soren Johnson: „Old World Designer Notes #1: Orders"](http://www.designer-notes.com/old-world-designer-notes-1-orders/), [PCGamer-Preview](https://www.pcgamer.com/old-world-4x-preview/), [Polygon-Preview](https://www.polygon.com/2020/4/14/21219937/old-world-soren-johnson-civilization-preview-impressions-mohawk-epic-game-store-windows-pc/), [Cultured Vultures „Orders Guide"](https://culturedvultures.com/old-world-commands-guide-legitimacy-orders-forced-march/)

---

## 10. Frostpunk

Frostpunk modelliert Legitimität als **Doppelwaage mit Ultimaten** und Zeit als Gesetzespreis.

**Währungen**
- **Hope** (Vertrauen in den Anführer) und **Discontent** (Unzufriedenheit mit den Umständen) — zwei getrennte Skalen, keine einzige „Zufriedenheit"; dazu harte Ressourcen (Kohle, Holz, Stahl, Essen), **Wärme** als Versorgungswährung und **Gesetzes-Abklingzeit** als Zeitwährung.

**Verdienen/Ausgeben**
- Gesetze und Gebäude verschieben Hope/Discontent **sofort** beim Unterschreiben (Signing-Effekt) plus laufend; Gesetze sind **irreversibel** („Once signed, a law can never be revoked") und paarweise exklusiv (Suppe ODER Lebensmittelzusatz …).
- **Law Cooldown**: nach jeder Unterschrift Sperre von **18 h**, später **36 h** bzw. **45 h** (Quelle: vigaroe-Analysen; Szenario-Trick: Cooldown-Skip über Winterhome-Entdeckung dokumentiert) → **der Preis eines Gesetzes ist Wartezeit aufs nächste**, nicht Kapital.

**Defizitfolgen (die schärfste Legitimitäts-Mechanik des Feldes)**
- **Hope am Boden** → **Ultimatum: Hope binnen 2 Tagen auf 15 % heben**, sonst Absetzung. **Discontent am Maximum** → Ultimatum: **binnen 2 Tagen auf 75 % senken**.
- Nach „New Order"/„New Faith" (Endstufen der Zweige Order/Faith) wird **Hope durch Obedience/Devotion ersetzt** — der Regimewechsel **löscht die alte Währung** und ersetzt sie durch eine Gehorsams-Währung mit eigenen Senken (Watchtowers, Agitators, Foreman-Fähigkeit +40 % Effizienz für 24 h, Kosten 10 Rationen, 2 Tage Abklingzeit je Arbeitsplatz). Scheitern danach = Hinrichtung des Spielers auf der eigenen Dampfplattform (TV-Tropes „You Lose at Zero Trust").
- Londoner-Bogen: Teile der Bevölkerung kündigen Auswanderung an; Order/Faith-Gesetze sind das Instrumentarium, sie ohne Blutvergießen aufzulösen — **Legitimitätskrise als mehrwöchiger Countdown**.

**Übernahme für Staatsräson**: (a) **Ultimatum-Mechanik**: Legitimität/Vertrauen unter Schwelle → Parlament/Partei stellt **die Vertrauensfrage mit Frist** (X Wochen, sonst Neuwahl/Putsch-Event) — besser als passives Abgleiten; (b) **Cooldown als Preis**: gesetzgeberische Takt (z. B. 1 Gesetz je Parlamentssitzungsperiode) zusätzlich zum Kapitalpreis — Zeit als zweite Senke; (c) **Währungs-Ersatz beim Regimewechsel**: „Ausnahmezustand/Präsidialdekret-Republik" ersetzt Vertrauen durch „Gehorsam" mit anderem Einkommensprofil (siehe 14d); (d) **Signing-Effekt**: Gesetze haben sofortige Stimmungs-Effekte plus träge Struktur-Effekte (haben wir im Netz teils schon; der **Sofort-Effekt** sollte explizit modelliert werden).

Quellen: [TV Tropes „Frostpunk"](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/Frostpunk), [vigaroe „Laws: Adaptation"](https://vigaroe.com/Analyses/Frostpunk/LawsAdaptation), [vigaroe „A New Home"](https://vigaroe.com/Analyses/Frostpunk/NewHome), [lonerstrategygames „Faith or Order?"](https://lonerstrategygames.com/frostpunk-faith-or-order/), [Neoseeker „Fall of Winterhome"](https://www.neoseeker.com/frostpunk/walkthrough/The_Fall_of_Winterhome), [ResearchGate „Autocracy for the People"](https://www.researchgate.net/publication/348151004_Autocracy_for_the_People_Modes_of_response-able_Action_and_the_Management_of_Demise_in_Frostpunk)

---

## 11. Tropico 6

Tropico 6 ist das einzige Spiel im Feld, das **private Bereicherung als zweite Machtwährung** voll durchspielt — direkt relevant für unseren Korruptions-/Affärenstrang.

**Währungen**
- **Staatskasse** vs. **Schweizer Konto** (privat!) — zwei getrennte Geldtöpfe mit **Ablenkung als Konversion** (Siphon: Treasury→Privat).
- **Fraktions-Standing** (Militaristen, Konservative, Kapitalisten, Kommunisten, Religiöse, Umweltschützer, Intellektuelle) und **Supermacht-Beziehungen** — weiche Währungen; **Wahlen** mit Rede-/Schmutz-Optionen; **Broker-Gefallen** als Meta-Währung.

**Der Broker (Alles-käuflich-Mechanik)**
- Schweizer Geld kauft beim Broker: **Image-Kampagne vor Wahlen** („It won't help you in the long run but at least it can get you past an election" — Designer Mussler im PCGamer/Steam-Interview), **Streichung von Fraktions-Forderungen ohne Reputationsverlust** („arguments" und „distractions"), **Forschung, Bargeld, Raid-Punkte, Migranten** — der Broker ist ein **Universalkonverter**: Privatvermögen → jede andere Ressource.
- Einzahlungswege: klassische Veruntreuung, **Broker-Missionen** (Gefallen gegen Einzahlung), **vom Broker empfohlene Minister** (Lobbyistico: korrupte Minister als Einkommenskanal).
- **Lobbyistico-DLC**: Korruption als sichtbarer Wert mit eigenem Club (Fraktionsführer-Mitglieder geben Boni, erzeugen monatlich Korruption), Anti-Korruptions-Agentur als Gegeninstrument; die Mission „Corruptionnomics" zeigt das Designziel explizit: Korruption frisst die Staatskasse.

**Übernahme für Staatsräson**: (a) **Privat-/Staatstrennung mit Konverter**: unser PARTEI-/Privatbereich (Schwarzgeld, Stiftungen) könnte einen „Vermittler" haben — der Stimmenkauf (0,5/Stimme) ist bereits der Anfang; der Broker zeigt die Oberstufe: **Alles ist käuflich, aber nur mit der DUNKLEN Währung**; (b) **Broker-Missionen als Einkommenskanal mit Preis in Legitimität/Entdeckungsrisiko** — verbindet Block D (dunkle Wege) mit der Währungsarchitektur; (c) **Fraktions-Forderungen streichen gegen Schmutzgeld** — direkte Übernahme für den Verhandlungstisch; (d) Wahlkampf-„Imagekampagne" als kurzfristige Umfrage-Spritze mit abnehmendem Grenznutzen.

Quellen: [PCGamer „Tropico 6"](https://www.pcgamer.com/tropico-6-feels-like-a-definitive-edition-of-the-series-not-a-reinvention/), [Steam-News (Entwicklerzitate Mussler)](https://store.steampowered.com/news/posts/?appids=492720&enddate=1546946438), [Tropico-Fandom „The Broker"](https://tropico.fandom.com/wiki/The_Broker), [NamuWiki Tropico 6 (Lobbyistico/Corruptionnomics)](https://en.namu.wiki/w/%ED%8A%B8%EB%A1%9C%ED%94%BC%EC%BD%94%206), [New Game Network Review](https://www.newgamenetwork.com/article/2099/tropico-6-review/)

---

## 12. Rebel Inc.

Rebel Inc. reduziert auf die Essenz: **Reputation ist die einzige echte Verlierbedingung** — Geld ist Munition, Reputation ist Leben.

**Währungen** (Quellen: offizielles Wiki rebelinc.wiki.gg)
- **Reputation** (0–100; Start 90/80/73/70 je Schwierigkeit): „reflects the confidence held in you by The Coalition, the international community and the local population. **If it drops to zero, you lose.**"
- **Geld** (Jahresbudget! — Nachschub kommt jährlich, nicht kontinuierlich: „Annual Budget will help you plan"), **Inflation** (Ausgaben-Übertreibung verteuert alles Weitere), **Corruption** vs. **Corruption Risk** (Kappe), **Support Level** je Zone, **Stability** je Zone.

**Verdienen/Verlieren**
- Gewinn: Zonen stabilisieren (∝ Bevölkerung), Initiativen (Universal Justice, Democratic Transition), Events, hartes Verhandeln im Friedensprozess.
- Verlust: aktive Aufständische je Zone (Dauerabfluss!), Zonenverluste (wiederholte Verluste derselben Zone = schwererer Schaden), **„Lack of Stability": exponentiell wachsende Verluste, wenn Stabilisierung zu lange dauert** (Timer resettet bei stabilen Zonen), Verlängerung von Koalitions-Truppen-Tourneen, Korruption.
- **Korruptions-Formel** (Wiki): Support-Schaden ≈ 1,15 × c², Reputationsverlust ≈ (c / 3,6) × 6 pro Monat [Darstellung im Wiki teilweise beschädigt, Größenordnung: quadratisch]; Anti-Korruptions-Initiativen senken das **Risk** (Kappe) um ~2,4 %/Monat auf Normal, asymptotisch gegen 0 unter ~10–16 %.
- **Inflation**: jede Initiative treibt Inflation; zu schnelles Geldausgeben = Preisspirale — **Tempo selbst ist eine Währung**.

**Übernahme für Staatsräson**: (a) **Reputation als nackte Verlierbedingung** prüfen: Unsere Verlierbedingungen sind Wahl/Putsch/EGMR-Achse — Rebel Inc. zeigt den Mut zur Einfachheit: **eine** über allem schwebende Zahl; (b) **Jahresbudget mit Restübertrag** (unser Haushalts-Zyklus WIR-3 profitiert: Oktober-Budget als einzige große Geldspritze); (c) **Inflation durch Aktionstempo**: zu viele Erlasse/Bauprojekte pro Zeiteinheit verteuern alle weiteren (Deckel durch Marktlogik statt Verbote); (d) **Risk-vs-Wert-Doppelung** für Korruption: Risiko als Kappe (durch Affären/Erkenntnisse bewegt), Wert driftet zur Kappe — unsere 4-Affären-Varianten könnten Risiko setzen statt Direktschaden; (e) **„Lack of Stability"-Uhr**: Probleme, die zu lange ungelöst bleiben, eskalieren exponentiell (passt zu unserer Problem-Hysterese — die Eskalationsseite fehlt noch).

Quellen: [Rebel-Inc-Wiki „Core Game Concepts"](https://rebelinc.wiki.gg/wiki/Core_Game_Concepts), [Rebel-Inc-Wiki „Reputation"](https://rebelinc.wiki.gg/wiki/Reputation), [PAXsims-Interview James Vaughan](https://paxsims.wordpress.com/2019/04/30/an-interview-with-rebel-inc-designer-james-vaughn-ndemic-creations/), [Steam-Guide „How Not to Fail"](https://steamcommunity.com/sharedfiles/filedetails/?id=1971611915)

---

## 13. Kurzporträts

### 13.1 Realpolitiks (2017, Jujubee)

- **Action Points** als Haupt-Machtwährung: Community-Bericht „I make about 300 a month but some actions require over 10,000" — stark inflationäre Preisstruktur, die Warten erzwingt; dazu **nur 2 gleichzeitig aktive Policies** (harter Slot-Deckel statt Kosten). Warnsignal: schlecht kalibrierte Machtwährung wird als „viel Warten" wahrgenommen (Metacritic-User-Reviews, Autorität A). **Lektion**: Preis-/Einkommensverhältnis ist die Balance; Slot-Deckel (2 Policies) ist ein akzeptabler Ersatz für Preise, erzeugt aber Frustration, wenn das Einkommen nicht skaliert.
- Realpolitiks 3 (EA seit 2024) führt Regierungsformenwahl und Kabinettsaufbau stärker in den Vordergrund [Details unverifiziert].

### 13.2 Power & Revolution (Eversim)

- Modelliert Macht über **persönliche Beliebtheit** (Popularität % des Staatschefs), Partei-/Parlamentsverhältnisse, und eine Vielzahl legaler/illegaler Aktionen (Bestechung, Einflussnahme) mit **Amtsenthebungs-/Sturz-Risiko** bei Übertreibung; Charakter-Ebene mit eigenem Vermögen und Beziehungen. [Mechanik-Details unverifiziert — keine belastbare Primärquelle in dieser Recherche gefunden; die Serie ist dokumentarisch schlecht erschlossen.] Lektion in der Breite: „persönliche Beliebtheit des Amtsinhabers" als eigene, vom Regime-Rating getrennte Skala ist im Genre Standard (vgl. V3 Herrscher-Popularität → Autorität).

### 13.3 „Der Corruptor"

- **Titel konnte in dieser Recherche nicht verifiziert werden.** Keine belastbare Quelle für ein Strategiespiel dieses Namens gefunden (mögliche Verwechslung mit „Corrupted" / „Rogue State Revolution" / der Tropico-Lobbyistico-Kampagne „Corruptionnomics"). **[unverifiziert — bitte Titel prüfen]**; die intendierte Referenz (Korruption als spielbare Machtwährung) ist über Tropico 6 (Broker), CK3 (Hooks/Erpressung) und Suzerain-Rizia ausreichend abgedeckt.

### 13.4 Hidden Agenda (1988) — das Ur-Modell

- Präsident des fiktiven „Chimerica" nach der Diktatur; Kernschleife: **Minister aus drei Parteien ernennen** (National Liberation, Christian Reform, Popular Stability [unverifiziert, dritte Partei]), deren Vorschläge annehmen/ablehnen, Pressekonferenzen geben. **Währung = Bündnisgewicht**: Jede Ernennung und Entscheidung verschiebt die Unterstützung der Fraktionen; zu einseitige Politik → **Putsch** (Ur-Form der Überschuldungsfolge: Schulden bei den Fraktionen werden mit dem Amt eingetrieben). Quelle: Wikipedia „Hidden Agenda (1988 video game)", ClassicReload-Beschreibung.
- **Lektion**: Bereits 1988 funktionierte die Suzerain-Formel — **Personalwahl als Machtallokation**, keine Zahlen nötig. Unser Ämter-/Personen-System (10 Ämter, Nachfolge) steht in dieser Tradition.

Quellen: [Wikipedia „Hidden Agenda (1988)"](https://en.wikipedia.org/wiki/Hidden_Agenda_(1988_video_game)), [ClassicReload „Hidden Agenda"](https://classicreload.com/hidden-agenda.html), [Metacritic „Realpolitiks" User Reviews](https://www.metacritic.com/game/realpolitiks/), [TGG-Pressemitteilung Realpolitiks 3](https://thegg.net/press-releases/realpolitiks-3-earth-and-beyond-is-now-available-for-pc-via-early-access/), [Sensor Tower/VGI Eversim-Übersicht](https://app.sensortower.com/vgi/developer/9018/eversim)

---

## 14. Die Währungen des Präsidenten

### 14a. Master-Tabelle

Vergleichende Übersicht aller recherchierten Macht- und Legitimitätswährungen. „Senke" = typische Ausgabe, „Verfall/Defizit" = was bei Mangel oder Nichtnutzung passiert.

| Spiel | Währung | Typ | Quelle (Einkommen) | Senke (Preisbeispiel) | Verfall / Defizitfolge |
|---|---|---|---|---|---|
| Democracy 4 | Political Capital | hart, institutionell | Popularität, Mehrheit, Minister-Loyalität, Krisen-Notstandsbefugnis; Quartalsfluss | Policy einführen/ändern/streichen; Preis ∝ Kontroversität + Amplitude | Deckel = 2× Einkommen; kein Negativ; Nichtnutzung = verlorener Durchsatz |
| Democracy 4 | Minister-Loyalität/-Effektivität | weich, personal | Zeit im Amt (Eff.), Zufriedenheit der Heimatgruppen (Loy.) | erodiert natürlich → PC-Einkommen sinkt | Rücktritte, unpopuläre Reshuffle-Folgen |
| EU4 | Monarch Power ADM/DIP/MIL | hart, personalistisch-institutionell | Basis 3 + Herrscher 0–6 + Berater 1–5 + Fokus ±2/∓1 + Power Projection +1 | Tech 600, Idee 400, Dev 50, Stab +1 = 100 (+50 %/+100 %), General 50 | Deckel 999; kein Negativ; Über-Relationen = Dauerabfluss |
| EU4 | Corruption | Schuld-Konto | Events, überdehnte Verwaltung | +1 % All-Power-Costs je Punkt | abbezahlbar in Dukaten über Jahre |
| EU4 | Legitimacy / Republican Tradition | weich, Regime | Strengthen Government 100 MIL (+10/+3), Events, Zeit | — (Indikator mit Schwellen) | < 50: Unruhe, Umwandlungs-Risiko [unverifiziert] |
| EU4 | Prestige / Power Projection | verfallend / Leistungskonto | Schlachten, Missionen / Rivalen-Demütigung | Modifikator-Bonus; PP ≥ 50 → +1 alle Töpfe | Prestige driftet ~5 %/Jahr gegen 0 |
| HOI4 | Political Power | hart | +2/Tag × (Stabilität −50 %…+20 %) × Führer-Trait | Gesetz/Minister 150, Fokus 1/Tag × 70, Kriegsbegründung 50 | Untergrenze **−500** (Schulden möglich!), Aktionen gesperrt |
| HOI4 | Command Power | hart, Deckel 80 | War Support, Doktrinen, Stäbe | FM-Beförderung 40, Attaché 50 (gebunden) | gebundene CP nicht verfügbar; WS < 50 % → −95 % Zuwachs |
| HOI4 | Army/Navy/Air XP | hart, Erfahrung | Kampf, Training, Attachés | Doktrine ~100 [unverifiziert], Template 5 | kein Verfall, aber opportunitätsgebunden |
| CK3 | Gold / Prestige / Piety / Renown | hart (vier Töpfe) | Titel, Skills, Krieg, Religion | Kriege, Vasallen-Deals, Entscheidungen | Gold < 0: Schuldtabelle nach Tilgungsjahren bis −95 % |
| CK3 | Dread | weich, personal | Hinrichtungen ∝ Opferrang; Natural Dread via Traits | Fraktions-/Scheme-Blocker (Intimidated/Terrified) | Drift ~0,5/Jahr zu Natural Dread; Freilassung −10 |
| CK3 | Hooks (weak/strong/perpetual) | Schuld-/Gefallen-Konto | Erpressung, Schemes, Schuldentilgung, Events | Erzwingen von Verträgen, Ämtern, Stimmen | weak einmalig; strong mit Abklingzeit; Ablauf 10 J. |
| CK3 | Stress | Selbstkosten | Aktionen gegen Persönlichkeit | Mental Breaks (Stufen 100/200/300 [unverifiziert]) | Bewältigungs-Mechaniken mit 3-J.-Cooldown |
| CK3 | Tyranny | weich, Regime | rechtswidrige Aktionen | Opinion-Mali aller Vasallen | klingt über Jahre ab; Hooks umgehen sie |
| Victoria 3 | Bürokratie / Autorität / Influence | Fluss-Bilanz | Gebäude / Gesetze+Herrscher-Popularität / Rang | Dekrete 100, Unterdrückung 200, Pakte laufend | Defizit ∝ Überlast: bis +100 % Steuerverlust / −10 Oppositions-Approval / −50 % Prestige; Überschuss: +25 % Gesetzgebungstempo |
| Victoria 3 | Legitimacy (0–100) | weich, Regierung | Wahlrecht (Allg. Wahlrecht +110 aus Stimmen), Regierungs-Clout | Schwellen-Boni/Mali | < 25 „Illegitimate": −3 Radikale/Monat, Gesetzgebung faktisch blockiert |
| Victoria 3 | IG Approval / Clout | weich, gruppen | Gesetzes-Stances, Loyalisten/Radikale | Traits ab ±5/±10; Angry ≤ −10 radikalisiert | gedeckelt ±20; ausgeglichene Regierung = Legitimität |
| Civ 6 | Diplomatic Favor | hart, **handelbar** | Regierungsform, Suzeränität, Resolutionen (+15/Gouverneur!) | Weltkongress-Stimmen (Eskalation je Zusatzstimme) | hortbar; Konversion zu Gold via Handel |
| Civ 6 | Governor-Titel / Era Score | dauerhaft / Karma | Civics-Baum / historische Momente | irreversible Beförderungen / Golden-Age-Schwellen | Titel knapp; Era: Dark Age statt Game Over |
| Stellaris | Influence | hart, Deckel 1000 | flach ~3–5/M, Rivalen, Flotten-PP | Claims, Außenposten, Pakt-Unterhalt | Lager 0 + negativer Fluss → −20 % Happiness |
| Stellaris | Unity | hart, unbegrenzt | Jobs, Factions | Traditions, Edicts (Unterhalt), Regierungsumbau | Mangel → −20 Stabilität, −100 % Ethik-Attraktion |
| Suzerain (Sordland) | — (keine explizite Machtwährung) | Züge+Gefallen | Kapitel-Struktur, Zusagen | irreversible Allokationen, Verfassung 2/3+Gericht | gebrochene Zusagen = verzögerte Rache (Impeachment) |
| Suzerain (Rizia) | Authority / Budget / Energy | hart, Kapazität+Fluss | Dekrete, Häuser-Deals, Militär-Projektion | Dekrete: −1…−3 Authority + −1…−7 Budget ± Energy | Kapazitätsdeckel; Mehr-Konto-Preise je Aktion |
| Old World | Orders | hart, **verfällt je Runde** | Legitimität × 0,1, Städte, Traits (Robust +1) | alles: Züge, Ernennungen (2 Orders), Gesetze | Ungenutztes verfällt (wird zu Gold); Fatigue-Deckel |
| Old World | Legitimacy | weich, Herrscher | Ambitions +10/−5, Cognomen, Events | → Orders + Familien-Meinung | bleibt über Herrscherwechsel (institutionalisiert) |
| Frostpunk | Hope / Discontent | Doppelwaage | Gesetze (Soforteffekt), Gebäude, Ereignisse | Ultimaten: Hope auf 15 % in 2 Tagen; Discontent auf 75 % | Ultimatum verfehlt = Absetzung/Hinrichtung |
| Frostpunk | Law Cooldown | Zeitwährung | 18 h / 36 h / 45 h nach Gesetz | taktet Gesetzgebung | irreversible, paarweise exklusive Gesetze |
| Tropico 6 | Schweizer Konto / Staatskasse | privat vs. Staat | Veruntreuung, Broker-Missionen, korrupte Minister | Broker: Image-Kampagne, Forderung streichen, Forschung | Korruptionswert frisst Kasse; Wahl = Abrechnung |
| Rebel Inc. | Reputation | **einzige Verlierbedingung** | Zonen stabilisieren ∝ Bevölkerung | — (wird nicht ausgegeben, nur verloren) | 0 = Niederlage; „zu langsam" = exponentieller Verlust |
| Rebel Inc. | Jahresbudget / Inflation / Corruption Risk | hart / Tempo / Kappe | jährliche Tranche | Initiativen treiben Inflation + Korruptions-Kappe | Inflation verteuert alles; Korruption ≈ quadratischer Schaden |

### 14b. Taxonomie

Aus der Tabelle lassen sich vier Achsen ablesen, die jede Machtwährung klassifizieren:

**(1) Hart vs. weich.** Harte Währungen haben einen Zähler und einen Preis (PC, PP, Orders, DF, Gold). Weiche sind Bewertungen mit Schwellen (Legitimacy, Approval, Hope, Reputation) — man „gibt" sie nicht aus, sondern riskiert sie. **Design-Regel des Genres: Harte Währungen taktieren das Spiel, weiche beenden es.** (Rebel Inc. ist der Extremfall: einzige weiche Währung = einzige Verlierbedingung.)

**(2) Flüchtig vs. dauerhaft.** Flüchtig: Orders (verfallen je Runde), D4-PC über dem 2×-Deckel, Frostpunk-Cooldown-Zeit, Prestige (5 %/Jahr-Drift), Dread (0,5/Jahr-Drift). Dauerhaft: EU4-MP bis 999, Unity, Governor-Titel, Cognomen-Legitimität. **Verfall ist das Gegenmittel gegen Horten**; Deckel sind die weichere Variante. Old World zeigt die radikalste, D4 die pragmatischste Lösung.

**(3) Sichtbar vs. verdeckt.** Sichtbar: alle Paradox-Topbar-Währungen. Verdeckt: CK3-Boldness (Schwellen für Intimidation), Suzerain-Sordland-Beziehungen (nur Reaktionen sichtbar), D4-Zynismus (vergraben im Gruppen-Screen). Verdeckte Währungen erhöhen Immersion, sichtbare erhöhen Planbarkeit — Rizia vs. Sordland ist das kontrollierte Experiment: dasselbe Studio, beide Varianten, und das Publikum lobt **beide für unterschiedliche Tugenden**.

**(4) Persönlich vs. institutionell.** Persönlich: Dread, Stress, Schweizer Konto, V3-Herrscher-Popularität, D4-Minister-Loyalität. Institutionell: Legitimacy (V3), Stability (HOI4), Era Score. CK3 ist das rein persönliche, V3 das rein institutionelle Extrem. **Der Türkei-Stoff lebt von der Verschmelzung beider** (Präsident und Staat werden eins) — die Architektur muss beide Ebenen haben UND ihre Konversion erlauben.

**Querschnitt-Befunde:**

- **Defizit-Philosophien im Vergleich**: D4 und EU4 verbieten Überschuldung schlicht (nicht bezahlbar = nicht möglich). HOI4 erlaubt −500 PP mit Sperrung. V3 erlaubt unbegrenzte Überlast mit **proportionaler Strafe**. CK3 erlaubt Schulden mit **tilgungsdauer-skalierter Strafe**. Stellaris straft 0-Bestand bei negativem Fluss mit Imperiums-Mali. → Das Genre hat sich von „verboten" zu „erlaubt, aber eskaliert" entwickelt. Eskalierende Defizite erzeugen **Dramaturgie** (Spirale, Rettungsaktion), Verbote erzeugen nur Warten.
- **Konversionen sind der eigentliche Machtkern**: Berater (Dukaten→MP), Strengthen Government (MIL→Legitimität), DF-Handel (Gold↔Stimmen), Broker (Schwarzgeld→alles), Rivalitäten (Feindschaft→Influence), Rizia-Dekrete (Authority↔Budget↔Energy), Legitimität→Orders (0,1/Punkt). Spiele ohne Konversionen (D4) sind klarer, aber flacher; Spiele mit reicher Konversionsmatrix (EU4, CK3, Rizia) erzeugen „Machtpolitik" als Gefühl.
- **Zeit ist überall die versteckte Oberwährung**: Fokus 70 Tage à 1 PP/Tag (HOI4), Cooldowns (Frostpunk), Kapitel (Suzerain), Orders/Runde (Old World), Implementierungsdauer (D4, Rizia-Dekrete „~2 Turns").

### 14c. Architektur-Empfehlung für Staatsräson

**Bestandsaufnahme unserer Systeme**: Politisches Kapital (Start 60, Einkommen ~3,5 + Vertrauen/Mehrheit/Legitimität, Max 150, Überziehung bis −20 gegen Legitimität/Vertrauen), Gesetz 301/600 vs. Erlass (Doppelpreis + Vertrauensverlust), Fraktionsverhandlung, Stimmenkauf (0,5 Kapital/Stimme), Verwaltungskraft, Baukapazität, 11 Wählergruppen, Haushaltsregler, Notenbank, Chronik.

**Vorschlag: sieben Größen in drei Ebenen.**

| # | Währung | Ebene | Quellen | Senken | Defizitfolge |
|---|---|---|---|---|---|
| 1 | **Politisches Kapital** (bestehend) | institutionell | Basis 3,5 + Vertrauen/Mehrheit/Legitimität-Modifikatoren (D4-Modell) + Krisenbonus bei ausgerufenem Notstand (D4-Emergency-Powers-Übernahme) | Gesetze, Erlasse, Verhandlungs-Klauseln, Stimmenkauf | Überziehung — **überarbeitet, siehe unten** |
| 2 | **Verwaltungskraft** (bestehend, umbauen) | institutionell | Ministerien, Digitale Verwaltung-Leiter, +Einkommens-Upgrades als Vorhaben (Rizia-Modell) | laufende Vorhaben, Institutionen-Level, Erlass-Unterhalt (Edict-Fund-Prinzip) | **Fluss-Bilanz nach V3**: Überlast ∝ Strafe: Umsetzungstempo aller Vorhaben sinkt, Ereignis-Fehlgriffe (Bürokratie-Pannen) steigen — statt harter 8er-Sperre |
| 3 | **Baukapazität** (bestehend) | materiell | Bevölkerung+Industrie (Civ-Modell, bestehend) | Vorhaben-Queue | Überlast = Verzögerung + Preissteigerung (Rebel-Inc-Inflationsprinzip auf Baupreise) |
| 4 | **Legitimität** (neu als eigenständige, getrennte Größe; derzeit nur Modifikator) | institutionell | Wahlausgang (+110-Prinzip aus V3: Wahlsieg gießt Legitimität), AYM-konforme Verfahren, EGMR-Gehorsam, Verfassungstreue | Verfassungsverstöße, Erlass-Spam, Affären, brutale Repression | **V3-Schwellen**: < 25 „fragwürdig": Kapital-Einkommen halbiert, Radikalisierung +, Ultimatum-Mechanik (Frostpunk): Vertrauensfrage mit Frist; < 10: Neuwahl/Putsch-Eskalation |
| 5 | **Devisen** (neu, aus WIR-2) | materiell | Exporte, Tourismus, Kredite, IWF | Importe, Schuldendienst, Interventionen zur Lira-Stützung | unter Schwelle: Wechselkurskaskade → Inflation → Vertrauen (bestehendes Makromodell andocken) |
| 6 | **Geheimhaltung** (neu, Block D) | verdeckt | Geheimdienst-Budget, Loyalität des Apparats | dunkle Operationen (je Operation Verbrauch), Whistleblower-Events | 0 = Skandal-Exposition: Affäre wird öffentlich → Legitimität + ggf. AYM/EGMR-Achse; **Stellaris-Prinzip**: Mangel bestraft das ganze System, nicht die Einzelaktion |
| 7 | **Aufmerksamkeit** (neu, Old-World-Modell) | persönlich | **verfällt je Woche/Monat — kein Horten**; Basis ∝ Legitimität (0,1-Prinzip) + Kabinettsqualität | Gespräche, Verhandlungssitzungen, Krisen-Interventionen, Erlass-Prüfung, Aufsicht laufender Vorgänge (gebunden!) | wer alles delegiert, bekommt Eigendynamik: Minister handeln selbständig (Loyalitäts-abhängig, D4-Minister-Modell) |

**Konversions-Matrix** (Preise als Startkalibrierung — „Spielparameter, keine Tatsachen", zu kalibrieren mit den Lernfällen 2019/2021/2023):

| Von → Nach | Kapital | Verwaltung | Bau | Legitimität | Devisen | Geheimhaltung | Aufmerksamkeit |
|---|---|---|---|---|---|---|---|
| **Kapital** | — | Vorhaben beschleunigen: 4 Kap./Vorhaben | Baupriorität: 3 Kap. (Queue-Vorzug) | — *(direkt nicht kaufbar!)* | — | Vertuschung: 6 Kap./Affäre-Stufe | Krisensitzung einberufen: 5 Kap. |
| **Verwaltungskraft** | Dossier-Vorbereitung: 20 Verw. → +1 Kap.-Einkommen/Monat (gedeckelt) | — | Überwachung: 15 Verw. → −10 % Bauverzug | Compliance-Nachweis: 25 Verw. → +2 Leg. (AYM-fest) | Zoll-/Steuer-Effizienz: laufend | Akten säubern: 30 Verw. → +5 Geheimh. | Übernimmt Routine: +1 Aufm. (delegiert) |
| **Baukapazität** | Prestigeprojekt fertig: → +3 Kap. einmalig + Umfrage-Boost | Industriepolitik-Leiter | — | Nationalfeier am Bauwerk: +2 Leg. einmalig | Exportindustrie: laufend +Dev. | — | Bau-Besichtigung (Foto): 1 Aufm. → +Umfrage |
| **Legitimität** | hohe Leg. ≥ 75: **+25 % Kap.-Einkommen** (V3-Surplus-Prinzip) | — | — | — | IWF-/EU-Gespräche billiger | — | Volksansprache: 2 Aufm. → Leg.-Abbruch gestoppt 30 Tage |
| **Devisen** | Entwicklungshilfe-Show: 5 Mrd. → +2 Kap. | Verwaltung digital: einmalig 10 Mrd. → +10 Verw. | Baustoff-Importe: Dev. → Bau-Durchsatz | Stabilisierungs-Erfolg → +Leg. über Netz | — | Schwarze Kassen aus Devisen: **dunkler Pfad**, Affären-Risiko | — |
| **Geheimhaltung** | Kompromat: 10 Geheimh. → Stimme erzwingen (CK3-Strong-Hook, einmalig, 1 Jahr Sperre) | Überwachungs-Infrastruktur | — | — *(Geheimhaltung kann Legitimität nicht kaufen, nur schützen)* | — | — | Kurier-Operation: 1 Aufm. |
| **Aufmerksamkeit** | persönliche Verhandlungsführung: 2 Aufm. → −30 % Klausel-Preis | Aufsicht: gebunden, hebt Vorhaben-Qualität | Bau-Stopp/Inspektion | Zuhören/Besuch: 1 Aufm. → +1 Leg. (gedeckelt/Quartal) | Spitzengespräch Wirtschaft: 2 Aufm. | Befragung des Dienstes: 1 Aufm. → +2 Geheimh. | — |

Drei Design-Regeln dazu: **(1) Legitimität ist nicht direkt kaufbar** — nur über Verfahren, Erfolge und Zeit (sonst kollabiert die weiche Währung zur harten; Fehler den EU4 mit „Strengthen Government" halb begeht: 100 MIL für +10 Legitimacy ist bewusst teuer und an MIL gebunden). **(2) Aufmerksamkeit konvertiert in alles, aber verfällt** — sie ist der Old-World-„Order-Pool" des Präsidenten und löst unser „alles gleichzeitig"-Problem. **(3) Geheimhaltung ist die einzige verdeckte Währung** (Suzerain-Lektion: Verdecktes erzeugt Immersion), ihr Stand wird nur über Vorwarnzeichen kommuniziert („Der Dienst wirkt zerrüttet").

**Kritik an der jetzigen Überziehungs-Mechanik (−20 gegen Legitimität/Vertrauen)**:

- **Was die Recherche dafür spricht**: Überschuldung ist genre-konsensfähig (HOI4 −500 PP, V3 unbegrenzte Überlast, CK3-Schulden). Die Kopplung an Legitimität/Vertrauen entspricht V3s „Political Dysfunction" (Defizit in der Machtwährung erzeugt Opposition) und Stellaris' Unity-Mangel (−20 Stabilität). Die Idee ist also richtig angelegt.
- **Drei Schwächen im Vergleich**: **(a) Klippen statt Rampe.** −20 hart + Strafe ist eine Kante; CK3 (Tilgungsjahre-Tabelle) und V3 (∝ Überlast) skalieren **stufenlos** — das erzeugt den „Ich kann noch einen Monat durchhalten"-Sog. **Empfehlung**: Strafe ∝ Überziehung/Einkommen: `Legitimitätsabfluss/Monat = −Überziehung / (2 × Monatseinkommen)`, zusätzlich Vertrauens-Malus in Stufen (−5 ab Überziehung > 0, −10 ab > 1 Monatsgehalt, ‑20 ab > 2 Monatsgehälter). **(b) Keine Tilgungs-Dramaturgie.** CK3 misst Schulden in „Jahren Einkommen" und macht die Rückzahlung zum Spielzug; bei uns verschwindet die Überziehung still durch Einkommen. **Empfehlung**: Überzogenes Kapital wird als sichtbarer „Macht-Kredit" geführt (Gläubiger = Parlament/Partei), mit monatlicher Rate und **Kündigungs-Ereignis** bei Nichtbedienung (Fraktions-Revolté, Misstrauensantrag) — das ist CK3s „kann keinen Krieg erklären" für uns: bei offenem Kredit keine neuen Erlasse. **(c) Legitimität und Vertrauen als Straf-Ziel sind heute Doppelbestrafung desselben Kontos.** **Empfehlung**: Überziehung tilgt gegen **Legitimität** (Verfahrens-Bruch), nicht gegen Vertrauen; Vertrauen leidet nur indirekt über das Netz (Legitimität → Polarisierung → Vertrauen). Das trennt die Ebenen sauber und entspricht V3 (Legitimacy ≠ IG Approval).

### 14d. Systemwechsel als Mechanik

Wie das Genre den Wechsel des Systems selbst bepreist:

| Spiel | Mechanik des Systemwechsels | Preis | Risiko |
|---|---|---|---|
| Democracy 4 | Emergency Powers in der Krise; Verfassungs-Policies (Todesstrafe etc.) als teure Policies | sehr hohe PC-Kosten; Koalitions-Deals | Zynismus, Radikalisierung bis Attentat |
| Victoria 3 | **Gesetz-Enactment**: Gesetzesänderung als mehrmonatiger Vorgang mit Zwischenereignissen; IGs mit „starker Opposition" können Revolution starten; Movement-Radikalisierung | Enactment-Zeit ∝ Legitimität; IG-Approval ±5/±10/±20 je Schrittzahl | Revolution/Bürgerkrieg als eigenes Spielziel der Gegenseite |
| HOI4 | Ideologie-Wechsel über Fokus/Referendum/Bürgerkrieg | PP + Zeit; Demokratien brauchen War-Support-Gates für Gesetze | Bürgerkrieg als alternativer (schneller, blutiger) Pfad |
| Tropico 6 | Verfassungs-Optionen pro Ära; Wahl-Fälschung, Ausnahmezustand-Edikte | Geld, Broker, Supermacht-Zorn | Invasion/Rebellion; Schweizer Konto als Fluchtversicherung |
| Suzerain | **Verfassungsreform als Endgegner**: Paket schnüren, Assembly-Mehrheit (2/3 für die große Linie), Supreme-Court-Prüfung; Richter-Austausch als dunkler Seitenpfad | alle Allianzen gleichzeitig; gebrochene Zusagen | Impeachment, Putsch, Krieg als Fail-Kaskade |
| Frostpunk | **New Order / New Faith**: Endstufe ersetzt die Währung selbst (Hope → Obedience/Devotion) | Kette irreversibler Gesetze, radikale Einzelgesetze (Propaganda-Zentrum, Hinrichtungsplattform) | Scheitern danach = Hinrichtung des Spielers |
| EU4 | Regierungsreformen-Stufen, RT-Verfall → Monarchie-Kippe | MP, RT, Legitimacy | Pretender-Rebellionen [unverifiziert] |
| Civ 6 | Regierungsform-Wechsel über Civics | Kultur + ein paar Runden Anarchie-ähnlicher Umstellungskosten [unverifiziert] | Policy-Slot-Verlust, Loyalitätsdruck |

**Genre-Gesetz**: Systemwechsel wird nie als Einzelkauf modelliert, sondern als **mehrstufiger Vorgang mit (1) Paket-Schnürung, (2) qualifizierter Mehrheit, (3) Kontrollinstanz, (4) Radikalisierungs-Gegenreaktion, (5) Währungs-Ersatz im Endzustand**. Suzerain und V3 zeigen die dramaturgische Oberstufe: Der Weg ist der Konflikt.

**Übernahme-Vorschlag für Staatsräson** (verzahnt mit REC-1/REC-2):

1. **Paket-Phase**: Verfassungspaket aus 4–6 Klauseln (Amtszeit, Wahlrecht, Justizbesetzung, Notstandsartikel, Minderheiten, Zentralbank) — jede Klausel hat eigene Fraktions-Preise und AYM-Anfechtbarkeit. Klauseln sind Verhandlungsmasse am Verhandlungstisch (54 Klauseln-System andocken).
2. **Hürden-Logik türkisch**: **301/600** = Gesetz; **360/600** = Referendumspflicht (Parlament beschließt Volksabstimmung); **600/600** = direkt. Übernahme der V3-Enactment-Zeit: das Paket läuft als Vorgang über Wochen mit Zwischenereignissen (Proteste, Parteiaustritte, Medienkampagnen), Tempo ∝ Legitimität.
3. **AYM-Prüfung als Kontrollinstanz mit echter Wahrscheinlichkeit**: abhängig vom Sitze-Stand (12+3-Besetzungsmodell besteht bereits); Anfechtung kostet den Antragsteller Kapital, die Regierung bei Niederlage **Legitimität + das Paket fällt zurück**; dunkler Seitenpfad: HSK-/AYM-Umbau (Suzerain-Richter-Austausch) mit Geheimhaltungs-Verbrauch und langfristigem Legitimitäts-Leck.
4. **Referendum als Mini-Wahl**: Kampagnen-Phase (Aufmerksamkeit + Devisen + Kapital), Medien-System wirkt auf den Umfrage-Fehler (REC-4), Ergebnis bindet: bei „Nein" schwere Legitimitäts-Strafe + Politik-Sperrzeit (420-Tage-Analogie der Korruptions-Sperrzeit).
5. **Währungs-Ersatz im Endzustand** (Frostpunk-Lektion): Bei erfolgreichem autoritärem Umbau (Präsidialdekret-Republik / Dauer-Notstand) ändern sich die **Einkommensgleichungen**, nicht nur Mali: Vertrauen wird als „Gehorsam" neu kalibriert (höhere Basis aus Repression, aber kein Wahl-Legitimitäts-Zufluss mehr → Kapital-Einkommen wird von Mehrheit auf Repressions-Apparat umgestellt); Legitimität verfällt dauerhaft Richtung internationaler Achse (EGMR/EU/CDS). **Der Spieler soll den Währungswechsel spüren**: andere Symbole, andere Quellen, andere Verlierbedingung (Wahl → Putschwahrscheinlichkeit).

---

## 15. Top-15-Übernahmen

Sortiert nach Wert/Aufwand (Wert = Beitrag zur Kernfrage „Macht als Ressource", Aufwand S/M/L wie im Verbesserungsplan):

| # | Übernahme | Quellspiel | Wert | Aufwand | Anschluss an |
|---|---|---|---|---|---|
| 1 | Überziehung als „Macht-Kredit" mit Tilgungsrate, Gläubiger und Kündigungs-Ereignis; Strafe ∝ Überziehung/Einkommen statt −20-Klippe | CK3 (Schuldtabelle), V3 (Defizit ∝) | sehr hoch | S–M | 14c, bestehende Überziehung |
| 2 | Legitimität als eigenständige Größe mit V3-Schwellen (< 25: Kapital-Einkommen halbiert + Vertrauensfrage-Ultimatum mit Frist) | V3 + Frostpunk | sehr hoch | M | 14c-#4, REC-1 |
| 3 | Aufmerksamkeit als verfallende Wochen-Währung (Old-World-Orders): Gespräche/Verhandlungen/Krisen ziehen aus einem nicht-hortharen Pool | Old World | sehr hoch | M | PERSONEN, VERHANDLUNGSTISCH |
| 4 | Kombinationspreise: jede große Aktion zieht 2–4 Konten (Rizia-Dekrete-Modell) — Gesetzpreise = Kapital + Verwaltungskraft + ggf. Legitimität | Suzerain-Rizia | hoch | S | Gesetz/Erlass-System |
| 5 | Dauer-Abfluss statt Einmalpreis für große Reformen (1 Kap./Tag × N Tage, HOI4-Fokus-Modell) über das vorhandene Vorgangs-Objekt | HOI4 | hoch | S–M | Vorgänge, MIL-1 |
| 6 | Gebundene Kapazität für Dauerhaftes (Attaché-Modell): Kommissionen/Sonderermittler blockieren Aufmerksamkeit/Verwaltung bis Abschluss | HOI4 (CP) | hoch | S | Verwaltungskraft, REC-5 |
| 7 | Haken-Ökonomie dreistufig (schwach einmalig / stark mit Abklingzeit / Kompromat aus Geheimhaltung) — erzwingt Stimme, blockiert Gegenaktion | CK3 | hoch | M | REC-3, Stimmenkauf |
| 8 | Krisen-Kapital-Multiplikator: ausgerufener Notstand erhöht sichtbar das Kapital-Einkommen (D4-Emergency-Powers), mit Abgewöhnungspreis | Democracy 4 | hoch | S | REC-2 Notstand |
| 9 | „Broker"-Universalkonverter für die dunkle Währung: Schwarzgeld/Parteigelder kaufen Forderungs-Streichung, Image-Kampagne, Kompromate | Tropico 6 | hoch | M | Block D, Korruption |
| 10 | Deckel-Regel „Max = 2× Einkommen" statt fixer 150 — koppelt Kapazität an politische Stärke; Kabinettspflege wird Infrastruktur-Investition | Democracy 4 | mittel-hoch | S | PC-System |
| 11 | Inflations-Prinzip auf Aktionstempo: zu viele Erlasse/Bauprojekte pro Zeiteinheit verteuern alle weiteren | Rebel Inc. | mittel | S | Erlass/Bau |
| 12 | Risk-vs-Wert-Doppelung für Korruption: Affären setzen die Kappe (Risiko), der Wert driftet zur Kappe; Schaden quadratisch | Rebel Inc. | mittel | S | Korruptions-System |
| 13 | Gesetzes-Cooldown (Sitzungsperioden-Takt) zusätzlich zum Kapitalpreis — Zeit als zweite Senke | Frostpunk | mittel | S | Parlament, Staatskalender |
| 14 | Diplomatische Gunst als handelbare Stimm-Währung für EU-/UN-/Europarat-Ebene mit Eskalationspreis je Zusatzstimme | Civ 6 | mittel | M | AUSSENPOLITIK |
| 15 | „Strengthen Government"-Konversion mit progressivem Preis: Prestigeprojekte/Feiern kaufen Legitimität, jeder Kauf teurer (+50 %/+100 %-Kurve) | EU4 | mittel | S | Baukapazität → Legitimität |

**Bewusst NICHT übernommen**: HOI4s negative PP bis −500 ohne Konsequenzmodell (zu freizügig), EU4s drei gleichwertige Machttöpfe ADM/DIP/MIL (für ein Präsidentenspiel zu granular; unsere Verwaltungskraft/Baukapazität decken die Funktion), Stellaris' Deckel-1000-Influence (willkürlicher Deckel ohne Dramaturgie), Realpolitiks' Slot-Deckel „2 Policies" (erzeugt Warte-Frustration), Power & Revolution (zu schlecht dokumentiert).

---

## 16. Unsicherheiten

1. **Democracy 4**: Exakte PC-Einkommensformel (Gewichte der vier Faktoren, Höhe des Amtsbonus, Emergency-Powers-Auslöser) ist nicht öffentlich dokumentiert — nur die Faktorenliste (cliffskis Guide) und die 2×-Deckel-Regel (Reddit, von cliffski nicht dementiert). Preise je Aktionstyp sind dynamisch (Kontroversität × Amplitude), nicht tabelarisch. **[unverifiziert: Amtsbonus-Höhe, Emergency-Powers-Mechanik im Detail]**
2. **EU4**: Exakte Zahlen zu Legitimacy/RT-Schwellenfolgen, Prestige-Drift (5 %/Jahr aus Spielerwissen), Root-out-Corruption-Kostensatz (~0,05 Dukaten/Dev/Jahr je Abbaurate) nicht in dieser Recherche gegen Primärquelle geprüft. **[unverifiziert]**
3. **HOI4**: XP-Preise (Doktrin 100, Template 5) aus Spielerwissen. **[unverifiziert]**
4. **CK3**: Mental-Break-Stufen (100/200/300), Dread-Drift (0,5/Jahr), Intimidated/Terrified-Schwellen (Boldness+20/+45) aus Sekundärquellen (TheGamer/GameRant), Traits-Werte aus dem Wiki. **[teilweise unverifiziert]**
5. **Civ 6**: DF-Stimmkosten-Eskalation (10/20/40 …) und Gouverneurs-Details aus Community-Guides. **[unverifiziert]**
6. **Suzerain-Sordland**: Kapitelzahl (~10), Budget-Einheiten und 2/3-Hürde aus Spielerberichten/Patchnotes, nicht aus offizieller Doku. Rizia-Dekret-Preise dagegen aus dem offiziellen Wiki. **[Sordland teilweise unverifiziert]**
7. **Tropico 6**: Broker-Preise im Detail nicht dokumentiert; Lobbyistico-Korruptionswerte aus NamuWiki. **[unverifiziert]**
8. **Power & Revolution**: keine belastbare Mechanik-Quelle gefunden; nur Serien-Existenz belegt. **[weitgehend unverifiziert]**
9. **„Der Corruptor"**: Titel nicht auffindbar — vermutlich Fehlbenennung. **[nicht verifiziert]**
10. **Frostpunk**: Cooldown-Werte (18/36/45 h) und Ultimaten (15 % Hope / 75 % Discontent in 2 Tagen) aus Analyse-Blogs und TV Tropes, nicht aus offizieller Doku. **[unverifiziert, aber mehrfach übereinstimmend]**

Alle als „Empfehlung" markierten Zahlen in Kapitel 14c (Konversions-Matrix) sind **Startkalibrierungen („Spielparameter, keine Tatsachen")** und müssen mit den Lernfällen 2019/2021/2023 aus WIR-1 kalibriert werden.
