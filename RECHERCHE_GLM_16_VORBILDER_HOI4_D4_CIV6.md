# GLM-Recherche 16: HOI4, Democracy 4 und Civilization 6 — Design im Tiefgang und Übernahme-Matrix (06.10.2026)

Auftrag des Projektinhabers: „Recherchiere intensiver das Design von HOI4, Democracy 4 und Civilization 6 viel intensiver und übernimm die Ideen." Grundlage: Paradox-Wiki, Positech-Modding-Dokumentation (die eigentlichen Simulationsdateien), Civilopedia und Design-Analysen; Abgrenzung zu den flacheren Bestandsdokumenten (REFERENZANALYSE.md: 131 Zeilen für alle vier Spiele). Diese Datei zerlegt das Design jedes Vorbilds in Mechanismen mit belegten Werten und ordnet jede Übernahme einem bestehenden Staatsräson-System zu. Zahlen sind Mechanik-Werte der Vorbilder (belegt) bzw. Spielparameter der Übernahme (markiert).

## 1. Kurzfassung

Die drei Vorbilder leben von je einem Kerngedanken, den Staatsräson je zur Hälfte hat: **HOI4** macht aus Zeit Verpflichtung (70-Tage-Foki mit gegenseitigen Ausschlüssen, Planungsbonus, Nachschub, Besatzungs-Compliance, Friedenskonferenz mit Gebotsrunden). **Democracy 4** macht die Gesellschaft endogen — Politiken verschieben nicht nur Stimmungen, sondern **die Mitgliedschaft der Gruppen selbst**, und Zynismus aus Richtungswechseln und Wahlgeschenken frisst dauerhaft die Wahlbeteiligung. **Civilization 6** macht Raum zu Entscheidungen (Bezirke mit Nachbarschafts-Boni), belohnt Welttaten mit Eureka, und gibt jeder Amtszeit einen epoche-artigen Bogen (Epochenwert → Goldenes/Dunkles Zeitalter), dazu ein **Kränkungskonto** mit doppelter Wirkung und **Notstands-Koalitionen**. Fünf Übernahmen sind der höchste Nutzen: endogene Mitgliedschaft (D4), Amtszeit-Epochen (Civ 6), Besatzungs-Compliance (HOI4), Zynismus und Beteiligung (D4), Kränkungskonto mit Notstands-Koalitionen (Civ 6).

---

## 2. HOI4 im Tiefgang

### 2.1 Was das Design wirklich tut

- **Fokusbaum:** Standardfokus **70 Tage**; Äste um ein Thema, meist isoliert, lokal verbunden; `mutually_exclusive` zwingt zu strategischer Verpflichtung (Markt gegen Staatswirtschaft ist hier erfunden — HOI4s Ideologieäste sind das Vorbild). Foki wirken als **National Spirits** — dauerhafte, *benannte* Modifikatoren („Verwundete Ehre" als sichtbarer Zustand, nicht als Zahl).
- **Kritik der Community als Designlehre:** Der generische Baum gilt als zu stark (kleine Nationen schnell +10 Fabriken); das Spiel driftet zum Statistik-Optimum („maximiere weichen Angriff"). Lehre für Staatsräson: Wege brauchen **Preise und Verlierer**, sonst ist der Baum ein Bonushandel.
- **Planungsbonus (Battle Plans):** Frontlinien ziehen, Angriff/Verteidigung planen — die **Planungszeit selbst ist eine Ressource**: Wer angreift, ohne Wochen zu planen, verliert den Bonus. Delegation an Generäle (mit Charakteren) ist der Normalweg, Mikro die Ausnahme.
- **Divisionsschablonen:** Bataillone + Unterstützungskompanien, Kampfbreite als Kompromiss; Garrison-Schablonen (billige Kavallerie) für die Besatzung.
- **Nachschub:** Versorgungsknoten an Bahnen und Häfen; **unterversorgte Divisionen verlieren bis zu 80 % Kampfkraft** (Angriff, Verteidigung, Organisation, Tempo). Die Angriffsachse baut ihre Logistik vorher.
- **Besatzung:** Widerstandsstärke wächst/verfällt zum Widerstands-Ziel; Compliance wächst langsam (Grunddrift −0,00083 % je Tag gegen Zerfall) und schaltet Industrie frei; **harte Gesetze → mehr Widerstand, weiche → mehr Compliance**; ~50 % Compliance gilt als Optimum, Garantien kosten Truppen (Garrison-Abnutzung).
- **Friedenskonferenz:** Kriegswert aus Beiträgen (Einkesselungen, Gefangene) wird zu **Forderungspunkten**, die Sieger bieten **rundenweise** um Gebiete, Reparationen, Regimewechsel.
- **Politische Macht als Währung:** Berater („Stille Arbeitskraft": +5 % PP), Gesetze, Nationenbeeinflussung — eine Währung für alles Politische, mit **Designbüros** (Panzer-/Schiff-/Flugzeugkonstrukteure als Forschungsmodifikatoren) und **Entscheidungen** (kontextuelle, zeitlich begrenzte Aktionen).

### 2.2 Übernahme nach Staatsräson

| Idee | Anschluss | Aufwand | Spieltest |
|---|---|---|---|
| Planungsbonus: Kriegsoperationen brauchen Vorbereitungswochen | `sim/krieg.ts` (Befehle je Front, Welle K): Angriff ohne Planung startet mit Malus, je Woche Planung +Bonus (Kappe, Spielparameter) | mittel | Der Falken-Spieler verliert den Blitzkrieg, der Planer gewinnt die dritte Woche |
| Nachschub-Krieg: unterversorgte Fronten −80 % | `sim/krieg.ts` + Reich-Infrastruktur: Bahnen/Häfen der Angriffsachse sind Kampfwerte; Feind-Bombardement auf Bahnknoten wirkt sofort | mittel | Ein Hafenverlust dreht eine ganze Front — und wird im Nachkriegsbericht benannt |
| Besatzungs-Compliance mit belegter Drift | `sim/krieg-typen.ts:145` („noch nicht gebaut"): Compliance steigt langsam (Grunddrift als Spielparameter an −0,00083 %/Tag angelehnt), Besatzungsgesetze als Leiter (zivil/militärisch/hart), Garrison-Abnutzung, Industrie freigeschaltet ab Stufen | groß (Welle K) | Die Besatzung ist ein Etat: weiche Verwaltung zahlt sich nach Jahren aus, harte kostet täglich Truppen |
| Friedenskonferenz als Gebotsrunden | `sim/krieg.ts` Friedenspakete: Kriegswert-Punkte, Sieger bieten rundenweise (Gebiete, Reparationen, Regimewechsel), Teilfrieden möglich | mittel | Der Frieden ist eine Szene mit Rivalität zwischen den eigenen Verbündeten |
| Designbüros der Rüstung | `data/krieg-daten.ts` + Rüstungsexportlinie: ASELSAN/TUSAŞ/TEI-artige Konstruktionsbüros (im Spiel erfundene Namen nach Block B) als Doktrin-Forscher mit Spezialgebieten | klein | Wer TEI-artig Triebwerke forscht, kriegt KAAN-artige Flugzeuge schneller — die Firma ist sichtbar |
| National Spirits als benannte Dauerzustände | Netz-Bestände bekommen Namen im Spiel („Verwundete Ehre", „Laizistische Ordnung", „Kriegswirtschaft") — Sichtbarmachung vorhandener Bestände, keine neue Mechanik | klein | Spieler zitieren die Geister als Kapitelnamen ihrer Partie |

---

## 3. Democracy 4 im Tiefgang

### 3.1 Was das Design wirklich tut

- **Die Simulation ist ein Effekt-Netz** (Positech-Modding-Doku): Politiken → Simulationswerte → Wählergruppen/Ereignisse, jede Kante mit **Inertia und Wirkungskurve** (nicht-linear, verzögert). Staatsräson hat das (W1: Kantenformel, Trägheit) — bestätigt, nicht neu zu bauen.
- **Mitgliedschaft ist endogen — der tiefste D4-Gedanke:** Politiken verschieben, **wie viele Menschen zu einer Gruppe gehören**: Arbeitsfreie Feiertage wachsen die Sozialisten, Wirtschaftsförderung die Selbstständigen, Evolution-Unterricht schrumpft die Religiösen. Gruppen sind nicht fixe Quoten, sondern Populationen mit Ein- und Ausgängen.
- **Jede Gruppe hat Loyalität, Einkommen — und Zynismus:** Zynismus wächst durch **Richtungswechsel** (einbringen → abschaffen), **Wahlgeschenke kurz vor der Wahl** und gebrochene Versprechen; er verfällt nur langsam und drückt dauerhaft die Meinung *und* die Beteiligung der Gruppe.
- **Wahlbeteiligung ist endogen:** Zufriedene Wähler gehen hin, enttäuschte bleiben zu Hause — man kann Wahlen verlieren, weil die eigene Basis der Urne fernbleibt, nicht weil die Gegner wuchsen.
- **Minister werden zynisch:** Loyalität sinkt mit der Zeit im Amt („jaded and cynical") — Umbildung ist Systempflege, nicht Strafe.
- **Überkomplexität als Absicht** (Cliffski): das „uber-connected" Netz *ist* das Spiel; die Oberfläche zeigt jede Kante per Mouse-over. Staatsräsons Abgrenzung: Härte zeigen, Komplexität verpacken (Auftrag) — D4s Sichtbarkeit aber übernehmen, nicht seine Dichte als Ziel.
- **Voting-Systems-Schicht:** Wahlregistration, Stimmmethoden, Kampagnenfinanzierung als Politikfelder; **Manifest** vor der Wahl (Versprechen mit Folgen).

### 3.2 Übernahme nach Staatsräson

| Idee | Anschluss | Aufwand | Spieltest |
|---|---|---|---|
| **Mitgliedschaft endogen** (Kernübernahme) | `sim/gruppen.ts`: Jede der 11 Gruppen bekommt einen **Mitgliedsanteil** (0–100), verschoben von Maßnahmen (m_mindestlohn ↑ Gewerkschafter, m_religionsbehoerde ↑ Fromme, Bildungs­ausbau ↑ Gebildete) mit Verzug; die Wählerrechnung gewichtet Stimmung × Anteil. Spielstand-Migration: Anteile aus den Startgewichten ableiten | mittel–groß | Der Spieler ändert die *Gesellschaft*, nicht nur ihre Laune: Wer zehn Jahre religiöse Politik macht, hat 2036 eine andere Wählerschaft — und ihre Stimmen |
| **Zynismus je Gruppe** | `sim/waehler.ts`: Zynismus steigt bei Gesetzes-Rücknahme, gebrochenen Zusagen (gebaute Brechung) und Wahlgeschenken in den letzten 6 Monaten; verfällt träge; wirkt auf Stimmung **und** Beteiligung | mittel | Ein Dauer-Flip-Flopper verliert 2032, obwohl alle Zahlen stimmen — und der Wirkungsbericht sagt warum |
| **Wahlbeteiligung endogen** | `sim/wahl.ts`: Beteiligung je Gruppe aus Laune × (1 − Zynismus) × Apathie; die Wahlnacht zeigt Beteiligungsverluste je Provinz | klein–mittel | Die eigene Basis bleibt der Urne fern, der Gegnerschaft nicht — Wahlabend mit Beteiligungszeile |
| Manifest mit Erinnerung | Wahlkampf (gebaut): Vor der Wahl 3–5 Versprechen wählen; nach der Wahl wandern sie in Zusagen; Bruch → Zynismus | klein | Der Spieler wählt 2028 Versprechen und zahlt 2030 dafür |
| Wahlen als Politikfeld | Verfassung/Wahlrecht: Wahlalter, Auslandsurnen (GLM_12), Kampagnenfinanzierung als Gesetz `g_wahlrecht` (neuer Baustein nach data/gesetze-Muster) | mittel | Der Spieler formt den Wählerkörper — mit AYM- und Oppositionspreis |
| Effekt-Sichtbarkeit | Gebaut (Mouse-over-Ketten, lern.ts, „Warum ist das passiert?") — D4 bestätigt die Richtung; nur die **Maßnahmen-Vorschau** bekommt D4-artige Pfeilzeilen (± je Gruppe) | klein | Vorschau zeigt Gewinner/Verlierer als Pfeile, bevor man unterschreibt |

---

## 4. Civilization 6 im Tiefgang

### 4.1 Was das Design wirklich tut

- **„Play the map" — Bezirke entstapeln die Stadt:** 16 Bezirksarten mit **Nachbarschafts-Boni** (Berge, Flüsse, Wunder, Nachbar-Bezirke); ein Bezirks-Deckel je Stadt macht den Platz zur Währung (das „Government-Plaza-Dilemma"). Platzierung ist eine Entscheidung mit dauerhafter Konsequenz — Fehler stehen auf der Karte.
- **Eureka/Inspiration:** Belegte 40–50 %-Boosts für **bestimmte Taten in der Welt** (nicht für Grinds) — belohnt vielfältiges Spielen.
- **Epochenwert, Goldenes/Dunkles/Heroisches Zeitalter:** Historische Momente geben Epochenwert; am Ära-Ende wird bewertet — Golden (Bonus), Normal, **Dunkel (Malus, aber Loyalitäts-Druck auf Nachbarn und Heroisch-Comeback als Chance)**; **Widmungen** sind das Zeitalter-Ziel. Community-Kritik als Designlehre: Single-Punkt-Momente sind zu klein — Momente müssen erzählen.
- **Loyalität je Stadt:** Bevölkerungsdruck der Nachbarn, Gouverneure, Annehmlichkeiten — Städte **kippen**; Eroberungen erzeugen Grievances, die Loyalität weiter drücken.
- **Kränkungen (Grievances) als Buch:** Quantifizierte Kränkungslaufzeit je Paar; wirkt **zweifach** — direkt auf die Beziehung und auf die Beobachter (Dritte strafen den Täter).
- **Notstände (Emergencies):** Schwere Verstöße (Stadtstaat erobert, Atombombe) rufen eine **Koalition gegen den Täter** auf; Teilnehmer werden belohnt.
- **Weltkongress:** Periodische Resolutionen mit Stimmenhandel (Favor-Währung); **Spionage** als leichte Ebene (Partisanen entfachen, Geld abzweigen).
- **Politikkarten:** Regierungsform definiert **Slots**; Karten sind austauschbar, der Wechsel kostet — Verfassung als Steckbrett.

### 4.2 Übernahme nach Staatsräson

| Idee | Anschluss | Aufwand | Spieltest |
|---|---|---|---|
| **Amtszeit-Epochen: Golden, Normal, Dunkel, Heroisch** | `sim/amtszeit.ts` + `ziele.ts`: Historische Momente der Amtszeit (Rezession überwunden, Großprojekt eröffnet, Friedensschluss, Wahlsieg) geben **Epochenwert**; am Amtszeitende bewertet das Spiel: **Goldene zweite Amtszeit** (Bonus: Kapital, Legitimität), **Dunkle** (Krisen, Protestdruck, Loyalitätsverlust — aber die Widmung „Krisenbewältigung" öffnet **Heroisch** mit Comeback-Bonus); die **Widmung** ist die bestehende Zielwahl als Zeitalter-Ziel | mittel | Der Spieler kennt sein Zeitalter: „Ich regiere in einer dunklen zweiten Amtszeit" — und die Karte zeigt den Druck |
| **Nachbarschafts-Boni für Provinz-Institutionen** | `sim/synergien.ts` (26 Produktkanten) um **räumliche Adjazenz** erweitern: Technopark + Universität + Klinik in derselben Provinz → Forschungs-/Gesundheitsbonus; Provinzblatt zeigt die Boni | mittel | Die Karte wird zum Bau-Puzzle: Was lege ich wohin? — Civs „play the map" in Provinzauflösung |
| **Kränkungskonto mit Beobachter-Wirkung** | `sim/welt-modell.ts` / `laender.ts`: Kränkungslaufbuch je Länderpaar (Bohrer vor Zypern, Drohnenexport an Feind X, Meerengen-Schikanen); wirkt direkt **und** auf Dritte (EU straft das Verhalten, nicht nur das Opfer) | mittel | Außenpolitik bekommt Gedächtnis: Der Spieler sieht sein Konto und wer zuseht |
| **Notstands-Koalitionen** | `sim/pakte.ts` / `welt-bloecke.ts`: Schwere Verstoß-Ereignisse (Invasion, Massenrepression, Kriegsverbrechen-Bericht) rufen einen **Notverbund** auf — Mitglieder bieten Sanktionen/Beistand und werden belohnt; Türkiye kann selbst Mitläufer, Täter oder Anführer sein | mittel | Der Notstand ist eine Bühne: Der Spieler wählt zwischen Mitläufertum und Gegenfront |
| Gouverneure je Provinz mit Loyalitätswirkung | Vision §2 (Gouverneure der 81 Provinzen, geplant): ernannte Gouverneure heben Rückhalt/Loyalität der Provinz, können kippen | mittel–groß | Die Personalentscheidung wird Landpolitik |
| UNO-Resolutionen mit Stimmenhandel | `sim/welt-bloecke.ts`: Gipfel bekommen Resolutionen; **Favor-Währung** (Gefälligkeiten werden gesammelt und geboten) | mittel | Diplomatie wird verhandelbar: Stimme ich für dich im Irak-Fall für deine EU-Stimme? |
| Spionage als leichte Ebene | Geheimdienst (gebaute verdeckte Operationen) um Civ-6-Missionen erweitern: Geld abzweigen, Partisanen entfachen, Einfluss steuern — begrenzt, mit Entdeckungsrisiko | klein | Wenige, sprechende Missionen statt Verwaltungsnetz |
| Politikkarten-Slots | `sim/verfassung.ts`: Regierungsform definiert Aktions-Slots (Präsidial: mehr Erlass-Slots; Parlamentarisch: mehr Gesetz-Geschwindigkeit; Reform: mehr Legitimität) | mittel | Die Verfassung wird ein Steckbrett mit echten Opportunitätskosten |

### 4.3 Was bestätigt wird, nicht neu gebaut

Eureka (data/forschung, gebaut), Epochen-Anker der Amtszeit (Welle 2: Umbildung, Ziele — gebaut, wartet auf die Epoche-Bewertung), Achsen als Kartenlogik (linien.ts — Regierungsform-Slots sind die Ergänzung), Kriegs-Theater mit Gelände (GLM_10, belegt).

---

## 5. Die fünf Kernübernahmen (priorisiert)

1. **Mitgliedschaft endogen (D4):** Maßnahmen ändern, wie viele Menschen zu welcher Gruppe gehören. Tiefste Simulationsteigerung, wirkt auf jede Wählerrechnung, Kalibrierung über die bestehenden Startgewichte. Aufwand mittel–groß.
2. **Amtszeit-Epochen (Civ 6):** Historische Momente → Epochenswert → Goldene/Dunkle/Heroische Amtszeit mit Widmung. Gibt jeder Partie einen Erzählbogen und nutzt das gebaute Amtszeit-System. Aufwand mittel.
3. **Besatzungs-Compliance (HOI4):** Der Welle-K-Baustein, der noch fehlt, mit den belegten Mechanik-Werten (Drift, Gesetzesleiter, Garrison, Industrie-Freischaltung). Aufwand groß, aber mit Zahlenunterlage.
4. **Zynismus + endogene Beteiligung (D4):** Wahlen können durch Vertrauensverlust und Fernbleiben verloren werden — Flip-Flop und Wahlgeschenke bekommen ein Gedächtnis. Aufwand mittel.
5. **Kränkungskonto + Notstands-Koalitionen (Civ 6):** Außenpolitik bekommt ein beobachtetes Gedächtnis und kollektive Bühnen. Aufwand mittel.

Dahinter: Nachschub/Planungsbonus/Friedensrunden (Welle K), Nachbarschafts-Boni (Provinz-Puzzle), Politikkarten-Slots (Verfassung), Gouverneure, UNO-Resolutionen, Manifest, Wahlrechtsgesetz, Designbüros, National Spirits als Namen.

## 6. Verworfen (mit Belegen aus der Community-Kritik)

- **Meta-Maximierung als Endzustand** (HOI4-Kritik: „boils down to maximizing soft attack"): Jede übernommene Mechanik braucht Preise und Verlierer — der generische Fokusbaum als Bonushandel ist die Warnung.
- **Überkomplexität als Selbstzweck** (Cliffski erklärt sie als Absicht): Staatsräson zeigt das Netz, verpackt aber (Auftrag: „nichts überkompliziert") — D4s Sichtbarkeit ja, D4s Dichte nein.
- **Bezirks-Kap-Optimierung auf Provinzebene:** Adjazenz als Bonus, nicht als Optimier-Loch; kein „Bezirksdeckel" für Provinzen.
- **Epochenwert für Einzelpunkte** (CivFanatics-Kritik: +1 für Forschungsprojekt vs. +3 für Barbarenlager): Historische Momente müssen erzählen — ein Moment = eine Zeile im Geschichtsbuch, nicht ein Zählerknacks.
- **Wahllimits als Spielverlängerung** (D4-Debatte „unlimited mandate"): Das Spiel hat unbegrenzte Amtszeit als Verfassungsfrage (gebaut) — nicht als bequeme Weiterspielen-Klingel.
- **Grievance-Zahlen offen anzeigen:** Das Kränkungskonto wirkt als Haltung der Gegenseite („Berlin führt ein Kränkungsbuch"), nicht als Punktestand im HUD.

## 7. Vorbilder und Belege

- HOI4: [National focus (Wiki)](https://hoi4.paradoxwikis.com/National_focus), [Generic focus tree](https://hoi4.paradoxwikis.com/Generic_national_focus_tree), [Logistics](https://hoi4.paradoxwikis.com/Logistics), [Occupation](https://hoi4.paradoxwikis.com/Occupation), [Peace conference](https://hoi4.paradoxwikis.com/Peace_conference), [Battle plan](https://hoi4.paradoxwikis.com/Battle_plan), [Political advisors](https://hoi4.paradoxwikis.com/Political_advisors), [Nachschub-Guide (bis 80 % Verlust)](https://stratemgames.space/en/hearts-of-iron-iv/supply-guide), [ACoUP zu HOI4 als Geschichtssimulation](https://acoup.blog)
- Democracy 4: [Modding Simulation (Effekt-Netz)](https://www.democracygame.com/mod_simulation.html), [Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html), [Gruppen-Mitgliedschaft ändert sich](https://steamcommunity.com/app/1410710/discussions/0/2958292387835717872/), [Cliffski: Überkomplexität als Absicht](https://www.positech.co.uk), [Basic Gameplay Guide (Beteiligung, Minister)](https://steamcommunity.com/sharedfiles/filedetails/?id=2251526478), [Voting Systems DLC](https://www.positech.co.uk/democracy4/dlc_votingsystems.html), [Capitalist-Gruppe (Fandom)](https://democracygame.fandom.com/wiki/Capitalist)
- Civ 6: [Adjacency bonus](https://civilization.fandom.com/wiki/Adjacency_bonus_(Civ6)), [Eureka/Inspiration (Civilopedia)](https://www.civilopedia.net), [Rise and Fall Era Score (Eurogamer)](https://www.eurogamer.net), [RPS-Designanalyse](https://www.rockpapershotgun.com), [Loyalty](https://civilization.fandom.com/wiki/Loyalty_(Civ6)), [Grievances-Doppelpenalty](https://steamcommunity.com/app/289070/discussions/), [Emergencies (Civilopedia)](https://www.civilopedia.net), [Government Plaza](https://civilization.fandom.com/wiki/Government_Plaza_(Civ6))

## 8. Unsicher oder unbelegt

1. Die 40–50-%-Eureka-Boosts: Civilopedia-Angabe, im Spiel als 40 % gebaut — übereinstimmend, aber genau 50 % nur für Zivil-Karten belegt.
2. Compliancedrift −0,00083 %/Tag: Wiki-Formelwert — als *Anker* für Spielparameter, nicht als Kopie.
3. „Bis 80 % Effektivitätsverlust" bei Nachschubmangel: Guide-Auswertung, exakte Formel im Wiki (Nachschub-Faktor je Stufe) — vor Übernahme gegen die Wiki-Tabelle prüfen.
4. D4-Zynismus-Verfallrate: nicht belegt (Spielgefühl: trägie) — Spielparameter.
5. Friedenskonferenz-Punkteformel (post-BBA): Wiki-Tabelle auswerten, bevor die Rundenlogik kalibriert wird.
6. Epochenwert-Schwellen je Ära: Civ-6-Daten (Eras.json-Modding) — als Spielparameter übernehmen, nicht als Kopie.
7. Alle Vorbildwerte sind Mechanikbeschreibungen fremder Spiele — Urheberrecht: Mechaniken sind frei, Namen/Texte/Bilder der Vorbilder werden nicht übernommen.
