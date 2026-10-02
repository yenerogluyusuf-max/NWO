# RECHERCHE-VERTIEFUNG: Recht, Strafverfolgung, Überwachung, Medien, Geheimdienste im Strategiegenre

**Stand: 30. September 2026. Vertiefung zu [RECHERCHE_MECHANIKEN.md](RECHERCHE_MECHANIKEN.md), [VERBESSERUNGSPLAN_2026-09-30.md](VERBESSERUNGSPLAN_2026-09-30.md) und den Schwesterbänden [RECHERCHE_VERTIEFUNG_MACHT_KAPITAL.md](RECHERCHE_VERTIEFUNG_MACHT_KAPITAL.md) (Währungen) und [RECHERCHE_VERTIEFUNG_WIRTSCHAFT.md](RECHERCHE_VERTIEFUNG_WIRTSCHAFT.md) — dupliziert deren Inhalte nicht, sondern beantwortet die Kontrollfrage: _Wie bepreisen Spiele den Zugriff des Machthabers auf Recht, Polizei, Überwachung, Presse und Geheimdienste — und wann schlägt Kontrolle zurück?_**

Kernbeispiel des Auftraggebers (sinngemäß): „In Democracy 4 kannst du die Pressefreiheit ändern. Das kostet Kapital, bringt aber Vorteile — die Presse ist auf deiner Seite — während westliche Länder dagegen sind. Langfristig kann es nützlich sein." Dieser Band prüft anhand von 15 Spielen, ob und wie dieses Muster (Einführungspreis + asymmetrische Gruppenreaktionen + langfristiger Nutzen + externe Rechnung) tatsächlich modelliert wird.

**Methodik und Verlässlichkeit**: Primärquellen sind die offiziellen Wikis (democracygame.fandom.com, tropico.fandom.com, frostpunk.fandom.com, civilization.fandom.com, ck3.paradoxwikis.com, suzerain.wiki.gg, rebelinc.wiki.gg, orwell-game.fandom.com), Cliff Harris' Patch-Notes und Foren (positech.co.uk, dort stehen echte Effektgleichungen), das offizielle Tropico-5-Handbuch (PDF), Entwickler-Devlogs (Lucas Pope / Papers Please), Wikipedia sowie akademische Analysen (u. a. Soraya Murray zu Orwell, Alfonsin/TTU zu Frostpunk, Kafer/UChicago zu Papers Please). Alles aus Spielerwissen ohne Gegenprobe ist als **[unverifiziert]** markiert. Wo das Democracy-Wiki nur Democracy-3-Werte nennt, ist das als „D3" gekennzeichnet — D4 verwendet dasselbe Format, aber teils andere Koeffizienten.

**Bezug zu unseren Systemen** (Kürzel): Justiz-Unabhängigkeit mit Sitze-Modell (AYM 15 = 12+3, HSK 13); Pressefreiheit RSF 163/180 (Score 27,94), ~90 % regierungsnahe Medienreichweite, FOTN 31/100; GTI Rang 36/163 (Score 3,212); Haft 434.681 bei 304.278 Plätzen (~142 % Auslastung, 16,3 % U-Haft); Beziehungsmatrix 17 Länder + EU in 4 Dimensionen; Gesetz 301/600 vs. Erlass (Doppelpreis); Geheimhaltung als Verbrauchsgut (Block D); Manipulations-Stufenleiter bei Wahlen (ELE-02); Medien-System-Lücke REC-4; Notstands-System REC-2; Korruptionsregeln mit 4 Affärenvarianten; 11 Wählergruppen; Politisches Kapital Start 60, Überziehung bis −20.

---

## Inhaltsverzeichnis

1. [Democracy 4 — die Kernreferenz (tiefste Ebene)](#1-democracy-4)
2. [Tropico 6 — Edikte, Medien-Gebäude, Fraktionen](#2-tropico-6)
3. [Suzerain — Presse, Polizei-Bündel, Notstand, Verfassung](#3-suzerain)
4. [Frostpunk — Das Gesetzesbuch und die „Linie"](#4-frostpunk)
5. [Beholder — Überwachung als Handwerk](#5-beholder)
6. [Orwell 1 & 2 — Überwachung als Deutungsmacht](#6-orwell)
7. [Headliner: NoviNews / The Westport Independent — Medien von der anderen Seite](#7-headliner-westport)
8. [Crisis in the Kremlin / Ostalgie — Repression als Regler](#8-crisis-in-the-kremlin-ostalgie)
9. [Civilization VI — Spionage und Soft Power](#9-civilization-vi)
10. [Crusader Kings III — Dread, Schemes, Haken, Tyrannei](#10-crusader-kings-iii)
11. [Power & Revolution — Geheimdienst-Menü und Indizes](#11-power--revolution)
12. [Rebel Inc. — Korruption als Latenz, Presse als Gegenmittel](#12-rebel-inc)
13. [Kurzporträts: Floor 13 (1991), Papers Please, Not for Broadcast](#13-kurzporträts)
14. [HERZSTÜCK: Der Preis der Kontrolle — eine Taxonomie](#14-der-preis-der-kontrolle)
    - (a) [Typologie der Bepreisung](#14a-typologie)
    - (b) [Das dreistufige Kontroll-Modell für Staatsräson](#14b-dreistufiges-modell)
    - (c) [Zahlenrahmen](#14c-zahlenrahmen)
15. [Top-15-Übernahmen (Wert/Aufwand)](#15-top-15-übernahmen)
16. [Unsicherheiten und offene Prüfpunkte](#16-unsicherheiten)

---

## 1. Democracy 4

Democracy 4 ist die Kernreferenz des Auftraggebers — und die einzige Quelle, in der die tatsächlichen Formeln und Preise der Kontroll-Policies dokumentiert sind (Cliff Harris veröffentlicht das gesamte Regelwerk als CSV-Format; ein Balance-Thread im offiziellen Forum zitiert die Pressefreiheit-Gleichungen wörtlich). Entscheidend vorab: **D4 modelliert Kontrolle nicht als moralische Einbahnstraße, sondern als Portfolio mit drei Preis-Kanälen** — Politisches Kapital (Einführung), Wählergruppen-Groll (sichtbar, reversibel) und versteckte Simulationswerte (Democracy, Security, Terrorism — langsam, teils irreversibel).

### 1.1 Press Freedom (die Auftraggeber-Referenz)

- **Funktionsweise**: Slider-Policy, **UNCANCELLABLE** (Position, kein Abschalten — man kann nur den Regler bewegen). PC-Preise: **Raise 10, Lower 30**. Effekte laut Forum-Post mit Gleichungen (Positech-Forum, Jan. 2022): `Democracy: 0.25−(x+1.25)^−3` (steil fallender Demokratie-Verlust bei Einschränkung); `Corruption: 0−(x^6)*0.1` (Korruption steigt erst bei sehr niedriger Pressefreiheit — x^6-Kurve: fast nichts, dann viel); `Liberals: −0.15+(0.25*x)`; `Everyone: 0+(x+1.06)^−20` (kleiner Allgemein-Bonus für freie Presse); `Security: −0.05*(x^10)` — **freie Presse senkt messbar die Sicherheit** (x^10: erst nahe Vollausschlag); `_global_liberalism: 0.11*(x^2)+0.03`; `Polarization: 0.1−(0.2*x)` (freie Presse entpolarisiert).
- **Kosten**: 30 PC für die Einschränkung (3× so teuer wie die Öffnung) — plus Democracy-Wert, Korruptionsanstieg erst ab tiefem Regler, Sicherheitsgewinn.
- **Nutzen kurzfristig**: +Security (Attentats-/Terrorschutz), weniger liberale Unzufriedenheitsschreiber; langfristig: Korruption bleibt unkontrollierbar sichtbar (hohe Pressefreiheit deckt auf), Polarisierung sinkt bei freier Presse.
- **Wer gewinnt/verliert**: Liberale sind die einzige direkt adressierte Gruppe; „Everyone" bekommt einen Mini-Bonus. Konservative/Patrioten reagieren NICHT direkt auf Pressefreiheit — das ist eine D4-Asymmetrie: Repression erzeugt Widerstand nur auf einer Seite (Liberale), Belohnung nur indirekt (Security).
- **Versteckte Effekte**: Der Korruptions-Term mit x^6 ist die tiefste Lehre — **Pressefreiheit ist ein Korruptions-Enthüllungs-Multiplikator mit Schwelle**: bei mittlerer Einschränkung passiert (sichtbar) fast nichts, erst bei extremer Zensur explodiert der Korruptionswert. Patch-Note (Build 1.28): „situations where a policy reduces security effectiveness, such as Press Freedom" werden nun korrekt verrechnet — d. h. die Security-Wirkung war zeitweise sogar unsichtbar/falsch verkabelt.
- **Übernahme für Staatsräson**: Genau so für REC-4: Pressefreiheit-Regler (RSF-Position 163/180 als Start) mit (a) PC-Asymmetrie Öffnen billig/Schließen teuer, (b) `Korruption ~ (1−x)^6`-Kurve (Schwellen-Enthüllung), (c) `Geheimdienst-Erfolg ~ +c*(1−x)^k` (freie Presse bläst Operationen auf — koppelt an Geheimhaltung als Verbrauchsgut), (d) Polarisierungs-Senker bei Öffnung. Quellen: [Positech-Forum: Press Freedom is OP](https://forums.positech.co.uk/t/balance-press-freedom-is-op/18217), [Democracy Wiki: Press Freedom](https://democracygame.fandom.com/wiki/Press_Freedom), [Cliffskis Blog Build 1.28](https://www.positech.co.uk/cliffsblog/2021/05/05/updated-democracy-4-to-build-1-28-lots-of-super-cool-balance-tweaks/)

### 1.2 Die Überwachungs-Policies und ihre echten PC-Preise

| Policy | Einführung | Hoch | Runter | Abschaffen | Umsetzung | Kern-Effekte (Wiki) |
|---|---|---|---|---|---|---|
| **CCTV Cameras** | 28 PC | 9 | 7 | 28 | 2 Runden | −Crime (Inertia 4), −Violent Crime (3), +Conservatives, −Liberal, −Street Gangs/Antisocial/Riots; Slider: „Crime spots only" → **„Face Recognition System"** |
| **Armed Police** | 50 PC | 10 | 19 | 48 | 3 Runden | Liberals −5 % → **−40 %** (Vollausbau), Crime −10→−20 %, Violent Crime 0→−20 %, Security +2,5→+6 %, Inner City Riots bis **−90 %**; Kosten 300–960 |
| **Wire Tapping** (D3-Werte) | — | 26 PC (max) | — | — | — | Organised Crime bis −26,6 %, Liberals bis −38,8 %; Slider: „With Government Decree" → **„Universal Monitoring"** |
| **Police Drones** | 16 PC | — | — | — | 4 Runden | −Crime, −Violent Crime, −Street Gangs, −Organised Crime, +Security, −Liberal |
| **ID Cards** | — | 39 | 20 | 25 | — | −Liberal, −Crime, −Violent Crime, +Conservatives, **+Patriot**; Slider: „Voluntary" → „Heavily enforced" |
| **Detention Without Trial** | 50 PC | 36 | 19 | 16 | 1 Runde | 0 %: 3 Tage Haft ohne Verfahren → 100 %: **unbegrenzt**; Patriots +10→+20 %, Liberals −15→−25 %, Terrorism −10→−20 %, Security +5→+10 %; Fixkosten 2 |
| **Curfews** | 50 PC | — | — | — | 1 Runde | −Crime, −Violent Crime, **−Everyone**, −Liberal, **−GDP**; Slider „For under 16s" → „10pm to 8am"; Kosten 31–78 Mio. |
| **Intelligence Services** | UNCANCELLABLE | 7 | 8 | — | — | −Crime (Inertia 2), **+Patriot**, −Organised Crime, −Internet Crime (10), −Cyber Warfare (6), Security; Stufen „A few spies" → „Spy Satellite Network"; **unter 67 % Finanzierung steigt Terrorismus** |
| **Border Controls** | UNCANCELLABLE (25) | 18 | 13 | (25) | 1 Runde | +Patriot, −Immigration, −Terrorism, −Liberal; **>20 % Regler tötet Tourism Boom**; Kosten 10–280; Stufen „Random passport check" → „Retinal scan" |
| **Prisoner Tagging** | 14 PC | 7 | 4 | 14 | 1 Runde | −Liberal, −Crime, −Violent Crime |
| **Tasers** | 25 PC | — | — | — | 2 Runden | −Liberal, −Crime; Slider „Extreme cases" → „Ubiquitous" |
| **Racial Profiling** | Free Policy | — | — | — | — | −Crime/−Terrorism, aber **+Racial Tension** (Eskalations-Kreisel), −Liberal |
| **Community Policing** | 1 PC (!) | 0 | 2 | 6 | 5 Runden | **+Liberal** (Gegenstück!), −Crime −13 %, −Violent Crime −10 %, −Racial Tension, +Liberalism; Kosten 100–639 |
| **Jury Trial** | 18 PC | 8 | 10 | 25 | 1 Runde | +Liberal +15 %; Kosten 105–322 |
| **Prisons** (Finanzierung) | UNCANCELLABLE | — | — | — | — | Stufen „Overcrowded cells" → „State of the art"; **unter 26 % Finanzierung verärgert State Employees**; senkt Crime, macht Conservatives UND Liberals UND State Employees glücklich |
| **Prison Regime** | — | — | — | — | — | 3-Stufen-Slider **Gentle / Balanced / Harsh** (Liberale wollen Rehabilitation, Konservative Abschreckung) |
| **Death Penalty** | Free Policy | — | — | — | — | +Patriot, −Liberal; Einführung senkt **Liberalism um 4–8 %** (Gruppenmitgliedschafts-Drift!); Slider skaliert Delikt: „mass murder" (≤9 %) → „almost every criminal case" (≥90 %) |
| **Body Cameras** (D4) | — | — | — | — | — | Anti-Polizeiwillkür-Policy; **Kosten skalieren mit Polizei-/Community-Police-/Armed-Police-Personal** (Patch 1.28) |
| **Internet Censorship** | — | — | — | — | — | **−Liberal UND −Youth** (einzige Policy mit Jugend-Effekt), +Conservatives, −Cyber Warfare, −Internet Crime, **−Technology**; Slider „In extreme cases" → „All traffic monitored" |
| **State Broadcaster** (D4) | — | — | — | — | — | Staatlicher Rundfunk als Verstaatlichungs-Policy („defense against biased or fake news"), TV-Steuer unbeliebt |
| **Legal Aid** | — | 7 | 9 | 13 | — | +Equality, +Liberals/Socialists/Poor |

Quellen je Zeile: [Democracy Wiki: Armed Police](https://democracygame.fandom.com/wiki/Armed_Police), [CCTV Cameras](https://democracygame.fandom.com/wiki/CCTV_Cameras), [Wire Tapping](https://democracygame.fandom.com/wiki/Wire_Tapping), [Police Drones](https://democracygame.fandom.com/wiki/Police_Drones), [ID Cards](https://democracygame.fandom.com/wiki/ID_Cards), [Detention Without Trial](https://democracygame.fandom.com/wiki/Detention_Without_Trial), [Curfews](https://democracygame.fandom.com/wiki/Curfews), [Intelligence Services](https://democracygame.fandom.com/wiki/Intelligence_Services), [Border Controls](https://democracygame.fandom.com/wiki/Border_Controls), [Community Policing](https://democracygame.fandom.com/wiki/Community_Policing), [Jury Trial](https://democracygame.fandom.com/wiki/Jury_Trial), [Prisons](https://democracygame.fandom.com/wiki/Prisons), [Prison Regime](https://democracygame.fandom.com/wiki/Prison_Regime), [Death Penalty](https://democracygame.fandom.com/wiki/Death_Penalty), [Internet Censorship](https://democracygame.fandom.com/wiki/Internet_Censorship), [Racial Profiling](https://democracygame.fandom.com/wiki/Racial_Profiling), [Policies-Liste](https://democracygame.fandom.com/wiki/Policies)

**Muster, die die Tabelle zeigt**:
1. **Preis-Asymmetrie ist die Regel, nicht die Ausnahme**: Detention Without Trial kostet 50 zum Einführen, aber nur 16 zum Abschaffen — harte Maßnahmen sind in D4 *leichter loszuwerden als einzuführen* (politischer Realismus: Rückbau ist populär). Umgekehrt Press Freedom (Öffnen 10 / Schließen 30) und Jury Trial (Raise 8 / Cancel 25) — liberale Errungenschaften sind teuer zu demontieren. **Die Asymmetrie-Richtung kodiert die ideologische „Härte" der Policy.**
2. **UNCANCELLABLE** für Infrastruktur der Kontrolle (Geheimdienst, Grenzen, Gefängnisse, Pressefreiheit): Man erbt den Apparat des Vorgängers und kann ihn nur skalieren — exakt unser Design-Ansatz für MİT/Justiz.
3. **Slider-Endpunkte sind Eskalations-Leiter mit Namen**: CCTV „Crime spots only" → „Face recognition system"; Wire Tapping „Government decree" → „Universal monitoring". Die Stufen tragen die Eskalation sprachlich — direkt übernehmbar für unsere Manipulations-Stufenleiter (ELE-02).

### 1.3 Der versteckte „Security"-Wert und das Attentat

- **Funktionsweise**: `Security` ist ein **versteckter Simulationswert**, der die Attentatswahrscheinlichkeit gegen den Spieler steuert. Das Wiki dokumentiert die Input-Gleichungen vollständig: `Intelligence Services {0+(0.4*x)}` (mit Abstand der stärkste Hebel), `ID Cards {0+(0.15*x)}`, `Curfews {0.12+(0.11*x)}`, `Wire Tapping {0.075+(0.1*x)}`, `Detention Without Trial {0.05+0.05x}`, `Armed Police {0.025+0.035x}`, `CCTV {0.025+0.038x}`, `Police Drones {0.03+0.03x}`, `Tasers {0.015+0.02x}`, `Internet Crime {−0.01−0.05x}` (Kriminalität untergräbt Sicherheit). — [Democracy Wiki: Security](https://democracygame.fandom.com/wiki/Security)
- `Terrorism` (ebenfalls versteckt) wird getrieben von `Racial Tension {−0.2+(x^4)}` und `Foreign Relations {−0.2+(x^4)}` (x^4-Schwellen: erst hohe Spannung explodiert) und gesenkt von Intelligence Services `0.2−0.3x`, Curfews, Wire Tapping, Military Spending, Border Controls. — [Democracy Wiki: Terrorism](https://democracygame.fandom.com/wiki/Terrorism)
- **Radikalisierungs-Kette**: Wählergruppe unzufrieden → Pressure Group → Terrororganisation; reversibel, aber langsam; **die Gegenmaßnahme mit dem besten Preis ist das Besänftigen der Ursprungsgruppe** („reducing the number of socialists reduces the pool of potential recruits"). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- **Übernahme**: Genau das ist unser GTI-36-Startwert-Modell: Terrorrisiko als versteckter Wert mit x^4-Schwelle aus gesellschaftlicher Spannung + Außenbeziehungen; Geheimdienst-Finanzierung als stärkster Einzelhebel (Faktor 0,4), aber mit Patriot-Bonus und Liberal-Malus; **Besänftigung der Ursprungsgruppe als legitime Alternative zum Apparat** — die „hässlichen Wege" sind nie die einzigen.

### 1.4 Die Gegenseite: Welche Gruppen wie reagieren

- **Liberals**: tragen fast alle Repressions-Malusse allein (Wire Tapping bis −38,8 %, Armed Police bis −40 %, Detention bis −25 %); ihre Pressure Groups: Human Rights Society → radikalisiert zu **Freedom League** (gewalttätig). — [Democracy Wiki: Liberal](https://democracygame.fandom.com/wiki/Liberal)
- **Conservatives**: gewinnen durch CCTV, ID Cards, Prison-Funding; verlieren durch Liberalisierungen; Pressure Group Traditional Values Alliance → **Moral Crusade**. — [Democracy Wiki: Conservatives](https://democracygame.fandom.com/wiki/Conservatives)
- **Patriots**: die eigentliche Repressions-Profiteur-Gruppe (+Intelligence Services, +ID Cards, +Border Controls, +Death Penalty); unzufriedene Patriots → **True Way** (gewalttätig); wachsen durch schlechte Foreign Relations und hohe Racial Tension (Rekurs-Schleife: Repression → Spannung → mehr Patriots → mehr Rekrutierungspool). — [Democracy Wiki: Patriot](https://democracygame.fandom.com/wiki/Patriot)
- **Youth**: reagiert (neben Liberals) nur auf Internet Censorship — digitale Kontrolle hat eine eigene Opfer-Gruppe.
- **Wichtig**: Es gibt **keine Gruppe, die Repression direkt „gewinnt" außer Patriots**; Konservative gewinnen nur bei kameralistischer Sichtbarkeit (CCTV). D4s Antwort auf die Auftraggeber-Frage „wer jubelt" ist also: eine kleine Gruppe stark (Patriots), eine große leise (Everyone über Crime/Security).
- **Grudge-System bei Gruppen**: Wählergruppen-Unzufriedenheit ist nicht statisch, sondern ein **Grudge-Konto pro Kante**: Effekte aus Policies wirken dauerhaft (solange die Policy steht), aber Event-/Dilemma-Grudges haben einen **Decay-Faktor** (z. B. 0,9/Quartal = schnelles Vergessen, 0,97 = langes Grollen) — über die Formel `CreateGrudge(Ziel, Wert, Decay)`. Dazu zwei Gruppen-Gedächtnisse: **Cynicism** (wächst durch Wahltermin-Populismus, Flip-Flops und Ärgern direkt nach der Wahl — macht dieselbe Maßnahme beim zweiten Mal schwächer) und **Complacency** (zufriedene Gruppen verwohnt werden; nach jedem Wahlsieg wird Kernwähler-Halten schwerer). — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/), [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- **Der „Democracy"-Simulationswert als stiller Gesamtpreis**: Pressefreiheit, Media Monopoly, Military Interference u. a. wirken alle auf den zentralen `Democracy`-Wert, der seinerseits in das Regierungshandeln zurückwirkt (u. a. über die Attentats-/Stabilitätslogik und die Länderwahrnehmung). Repression hat in D4 also einen **Sammel-Abfluss**: Man kann nicht nur „ein bisschen" autoritär werden, ohne den Gesamtwert zu bewegen. — [Democracy Wiki: Military Interference](https://democracygame.fandom.com/wiki/Military_Interference), [Cliffskis Blog Build 1.28](https://www.positech.co.uk/cliffsblog/2021/05/05/updated-democracy-4-to-build-1-28-lots-of-super-cool-balance-tweaks/)
- **Übernahme**: Auf unsere 11 Wählergruppen gemappt: das D4-Muster empfiehlt, Repressions-Zustimmung auf 2–3 Gruppen zu konzentrieren (z. B. Nationalistische/Sicherheitsorientierte, Teile der Konservativen), den Schaden breit zu verteilen (Junge/Urban, Gebildete, Kurden-Gruppe je nach Maßnahme) — plus die rekursive Schleife „Repression erzeugt die Gruppe, die Repression fordert". Das Grudge-/Decay-Modell (Decay 0,9–0,97 je nach Härte der Kränkung) ist unsere Vorlage für „Skandal verblasst, aber nicht vor der Wahl"; Cynicism ist die ehrliche Antwort auf die Versuchung, kurz vor der Wahl zu öffnen.

### 1.5 Situations: Wo D4 Repression *sichtbar* werden lässt

- **Civil Uprising** (D3 Africa, Mechanik identisch in D4): Der Aufstand wird *verursacht* durch Repression — Inputs: Armed Police 0→−8 %, Press Freedom 0→−16 %, Internet Censorship 0→−8 %, Wire Tapping 0→−8 %, Curfews 0→−16 %, **Torture Use 0→−12 %**, Corporal Punishment 0→−12 %, Right of Demonstration +4→−20 % (höchste negative Wirkung!). D. h.: Jede Kontroll-Policy ist formal eine Uprising-Input-Kante — der zweite Preis, der nicht auf dem Preisschild steht. — [Democracy Wiki: Civil Uprising](https://democracygame.fandom.com/wiki/Civil_Uprising)
- **Torture Use / Right of Demonstration / Corporal Punishment** existieren als Policies in D3 Africa (im Basis-D4 nicht; D4 bleibt bei „Detention Without Trial" als härtester Stufe) — für uns belegt das die Existenz formalisierter Folter-/Demonstrationsrecht-Regler im Referenzsystem.
- **Media Monopoly** (D4-Situation): senkt seit Build 1.28 explizit **Democracy**; **Fake News** (D4-Situation): erhöht Chance/Wirkung von Contagious Disease und **boostet Racial Tension** (Build 1.28). — [Cliffskis Blog Build 1.28](https://www.positech.co.uk/cliffsblog/2021/05/05/updated-democracy-4-to-build-1-28-lots-of-super-cool-balance-tweaks/) (Die vom Auftraggeber vermutete Situation „Press Muzzling" existiert in dieser Form nicht; die Funktion übernehmen Media Monopoly + Fake News + Press-Freedom-Regler.)
- **Law Courts Backlog** (D3 Africa): Überlastete Justiz als Situation aus hoher Kriminalität + unterfinanzierter Judikative — das D4-Pendant zu unserer AYM/512-Tage-Verfahrensdauer. — [Democracy Wiki: Law Courts Backlog](https://democracygame.fandom.com/wiki/Law_Courts_Backlog)
- **Military Interference** (D3 Africa): Aus hohen Military Spending + niedriger Stability entsteht eine Situation, die **Democracy** senkt — das Putsch-Flüstern als Zustand, nicht als Event. — [Democracy Wiki: Military Interference](https://democracygame.fandom.com/wiki/Military_Interference)
- **Drone Protests**: Start-Trigger 60 %, Stop 40 % (Hysterese), verursacht durch Police Drones 0–40 % + Liberal-Mitgliedschaft; wirkt zurück auf Conservative-Happiness −10→−30 % und Crime +4→+8 %. — [Democracy Wiki: Drone Protests](https://democracygame.fandom.com/wiki/Drone_Protests)
- **Übernahme**: Situations mit Hysterese sind unser Modell für „Protestwinter", „Presse-Kampagne gegen Regierung", „Putsch-Gerüchte" — jeweils mit Start/Stop-Schwellen (Start leichter als Stop) und der D4-Regel: **Repressions-Policies sind Inputs in die Situation, die sie bekämpfen sollen** (Racial Profiling senkt Terrorismus direkt, erhöht aber Racial Tension, die Terrorismus treibt — das ist die eleganteste Blowback-Kante des Genres).

---

## 2. Tropico 6

Tropico 6 ist das Gegenmodell zu D4: Statt versteckter Simulationswerte **sichtbare Stehvermögen-Konten** (Fraktions-Standing, Supermacht-Beziehungen, Schweizer Bankkonto) und Edikte mit explizitem Preisschild plus **Cooldowns als Exit-Blocker**. Die beißende Penultimo-Satire („It's not an underhanded ploy, it's national security!") macht die Moral zum Text, die Rechnung zur Mechanik.

### 2.1 Repressions-Edikte mit echten Zahlen

| Edikt | Kosten | Wirkung (Ränge 1/2/3) | Verlierer/Gewinner |
|---|---|---|---|
| **Martial Law** | $7.500 | **Sagt Wahlen ab und verhindert sie**; Wähler-Erfahrung −15; Liberty −35/−30/−25; **Rebell-Werden-Chance +15 %**; Tourismus −30/−25/−20 % | Militarists **+30**; **alle anderen Fraktionen −15** |
| **Assembly Ban** | $0 + **$1/Bürger/Monat** | Beendet alle Proteste sofort; Proteste verboten; Liberty −15; Rebell-Chance +15 | — |
| **Military Police** | $0 + $500/400/300 pro Monat | Militärgebäude wirken wie Polizeistationen (Verbrechen ↓); **Liberty-Malus der Gebäude +40/35/30 %** | Militarists +10/12/15, Conservatives +5 |
| **Right to Arms** | $2.500 | Liberty **+15/18/20**; Crime Safety −10/−8/−5; Militär +10 % Schaden | Militarists **−15**, Industrialists/Capitalists +7/9/12 — Bewaffnung der Bürger ist eine *Liberalisierungs*-Maßnahme mit Kriminalitätspreis |
| **Penal Colony** | — (bringt Geld: +$100/150/300/Monat) | Immigration +50/55/60 %, aber **300 % höhere Chance auf kriminelle Einwanderer** | Der Staat verkauft Grenzstandards gegen Einnahmen |
| **Policy of Detente** | $5.000, Cooldown **5 Jahre** | Jeder Rebell/Anführer hat **50 % Chance, die Rolle abzulegen** | Conservatives −15 — Amnestie als Exit-Strategie aus der Repressions-Spirale |
| **Sensitivity Training** (T5/T1-Tradition) | $500 + $5/Monat je Polizist/Soldat | Senkt den Liberty-Malus von Polizei-/Militärgebäuden | Militarists verärgert — **Deeskalations-Training kostet Geld pro Kopf und verprellt die Sicherheitsfraktion** |
| **Nuclear Testing** | $0 (einmalig) | +$100.000; Gesundheits-Schwelle +10 | **Alle Fraktionen −15**; Supermächte zahlen für die Demütigung |

Quellen: [Tropico Wiki: Edicts (Tropico 6)](https://tropico.fandom.com/wiki/Edicts_(Tropico_6)), [Tropico Wiki: Edicts (Tropico 5)](https://tropico.fandom.com/wiki/Edicts_(Tropico_5)), [Tropico 5 offizielles Handbuch (PDF)](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/245620/manuals/T5_pc_manual_uk_extendedversion_online.pdf), [Gamepressure: Tropico 6 Edicts](https://www.gamepressure.com/tropico-6/edicts/z9c0a5)

### 2.2 Medien als steuerbare Gebäude (die stärkste REC-4-Vorlage)

Drei Medien-Gebäudetypen mit **Work Modes** — jedes Medium kann unabhängig, Propaganda-Sender oder Monetarisierungs-Maschine sein:

- **Newspaper** ($1.800, Colonial Era): Basis-Liberty +40 im Umkreis. Modi: **Open Mind** (Default, volle Liberty), **The Dependent** (Zustimmung ↑ bei jeder Ruhephase, Liberty 40→10), **Penny Saver** (+$5 je Anwohner/Ruhephase, Liberty 40→35), Fraktions-Modi (**Red Star** = Kommunisten, **The Word** = Religiöse, **Gunny** = Militaristen, **The Preserver** = Konservative u. a.): je **25 % Chance**, die politische Orientierung von Anwohnern zu verschieben (außer „die-hard"), Liberty 40→30. **Effizienz jeder Zeitung sinkt mit jeder weiteren Zeitung** (Sättigung). — [Tropico Wiki: Newspaper (T6)](https://tropico.fandom.com/wiki/Newspaper_(Tropico_6))
- **Radio Station** ($2.400, World Wars): wirkt auf **Arbeitsplätze** statt Wohnungen; **Channel 1 (Canal Uno)**: Zustimmung ↑, Liberty −30; Fraktionsmodi 25 %-Conversion, Liberty −10. — [Tropico Wiki: Radio Station (T6)](https://tropico.fandom.com/wiki/Radio_Station_(Tropico_6))
- **TV Station** ($8.200, Cold War, −45 MW Strom): wirkt auf Wohnumfeld, besonders auf Kinder und Rentner; Modi analog (Telenovela-Default, Canal Uno, Pay TV, Fraktionsmodi 25 %). — [Tropico Wiki: TV Station (T6)](https://tropico.fandom.com/wiki/TV_Station_(Tropico_6))
- **Verfassungs-Option „Personal Rights": Security Surveillance vs. Privacy Rights** — Überwachung ist Verfassungsrang-Entscheidung, die Fraktionen sortiert (Religiöse mögen überraschend Security Surveillance). — [GameRant: Every Faction Explained](https://gamerant.com/tropico-6-every-faction-explained-guide/)
- **Wahlen**: Zustimmung aller Wähler entscheidet; ~50 %+ ist die Überlebenslinie; Edikt **Early Elections** ($2.000) erzwingt Wahl in 12 Monaten (ohne Rede) — der „jetzt abwählen lassen, bevor es auffliegt"-Zug. Ultimaten der Fraktionen bei niedrigem Standing (Streiks, Putsche). — [Tropico 6 Political Support Guide (Steam)](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108), [Grokipedia: Tropico 6](https://grokipedia.com/page/Tropico_6)
- **Supermächte**: Repression schlägt nicht direkt auf CIA/Supermacht-Konten, aber: Tax Haven −15/−12/−10 Standing *jeder* Supermacht; Nuclear Testing senkt alle Fraktionen; der klassische Preiskanal ist Außenhandel/Aid über Standing.
- **Übernahme für Staatsräson (REC-4)**: Das Gebäude-Modell wird bei uns zur **Sender-/Titel-Karte**: jedes Medium (TRT-Analog, Pool-Zeitungen, unabhängige Portale, Auslandssender) hat einen Modus (unabhängig / regierungsnah / Propaganda) mit (a) Conversion-Chance pro Zyklus auf Umfrage-Fehler und Gruppenzufriedenheit, (b) Liberty-/Pressefreiheits-Preis pro Modus (Propaganda-Modus drückt RSF-Score), (c) Sättigung (das 90 %-Pool-Media-Problem: gleichgerichtete Kanäle verlieren Wirkung je Kanal — Tropicos „Efficiency sinkt je Zeitung"), (d) Zielgruppen-Matrix (TV → ältere/ländliche Gruppen, Online → junge urbane — Tropicos Kinder/Rentner-Regel). **Early Elections** entspricht unserer 360-Stimmen-Regel für vorgezogene Wahlen.

---

## 3. Suzerain

Suzerain liefert die dramaturgisch reifste Umsetzung: Kontroll-Instrumente sind **Personen, Deals und Institutionen**, keine Regler — und jedes Instrument hat einen dokumentierten Rückschlag-Pfad, der den *eigenen* Schmutz freilegt.

### 3.1 Medien-Ökosystem und Zensur-Flag

- **Sechs Zeitungen mit Eigentümern und Haltungen**: Holsord Post (konservativ/pro-USP), Sordland Today (gehört **Marcel Koronti**, Heart-of-Sordland-Konglomerat — unterstützt, was Koronti unterstützt; kann zum Staatsmedium werden; wird geschlossen, wenn man Koronti verhaften lässt), Lachaven Times (liberal, minderheitenfreundlich), The Radical (links-konträr, misstraut Rayne selbst bei Gehorsam), Ekonomists (Wirtschaftsblatt, **Mundstück der Oligarchen, Eigentümer Walter Tusk**), Geopolitico (Außenpolitik, neutral). — [TV Tropes: Suzerain — Strawman News Media](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/SuzerainRepublicOfSordland)
- **Der Koronti-Deal**: Medienhilfe gegen zwei Gefallen; Tusk (verprellt) **leakt den Deal mit hoher Wahrscheinlichkeit** — gekaufte Presse erzeugt eine neue Angriffsfläche (Beleg: Reddit-Analyse des Media-Council-/Koronti-Deals). — [Reddit r/suzerain: Media Council and Koronti's deal](https://www.reddit.com/r/suzerain/comments/zwhhov/media_council_and_korontis_deal/)
- **„Media is censored" ist ein globaler Spielzustand**, der die Auszahlung späterer Ereignisse verändert — die Walkthrough-Daten geben exakte Zahlen: Verhandlungs-Reaktion auf Unruhen: **Public Opinion −3 mit Zensur vs. −10 ohne**; Militär-Einsatz gegen Unruhen mit verlängertem Notstand: −1 mit Zensur/freundlichem Sordland Today vs. −3 ohne; Soll-Prozess, Todesurteil: **+1 mit Zensur, 0 mit gekaufter Zeitung, −10 mit freier, ungekaufter Presse**; Freispruch: −5 mit Zensur, sonst 0. — [Neoseeker: Suzerain Chapter IV Turn 9 Walkthrough](https://www.neoseeker.com/suzerain/walkthrough/Chapter_IV_-_Checkmate_-_Turn_9)
- **Kosten/Nutzen**: Zensur kostet keinen sichtbaren Preis am Tag der Einführung — sie ist eine **Ergebnis-Dämpfungs-Maschine** (Krisen kosten 50–90 % weniger Meinung), die sich erst beim Skandal rächt: Sobald Impeachment läuft, schützt Zensur nicht mehr vor der Verfahrenslogik, nur vor der TV-Szene.
- **Übernahme**: Unser Zwei-Kanal-Modell (TV-Frame vs. Viral-Frame, RECHERCHE_INNENPOLITIK) bekommt die Suzerain-Formel: **„Medienkontrolle-Grad × Ereignis-Schaden"** als Dämpfungsfaktor auf alle negativen Meinungs-Events, aber mit Koronti-Regel: jede Abhängigkeit von einem Eigentümer ist ein Kompromat-Konto (Haken-System REC-3) und ein Blowback-Vektor bei dessen Sturz.

### 3.2 ACP vs. SSP — das Polizei-Bündel, das dich selbst trifft

- **Funktionsweise**: Nach Budget-Erhöhung für Security & Order entscheidet die Mittelvergabe über die Waffe: **Ministerium der Justiz (Nia Morgna) → Anti-Corruption Police (ACP)** oder **Innenministerium (Lileas Graf) → Secret State Police (SSP)** — **schließen einander aus**. — [Suzerain Wiki (wiki.gg): Anti-Corruption Police](https://suzerain.wiki.gg/wiki/Anti-Corruption_Police), [Suzerain Fandom: Sordland/Strategy](https://suzerain.fandom.com/wiki/Sordland/Strategy)
- **ACP**: kann drei Fraktionen untersuchen — Old Guard, Oligarchen, Opposition. Findet bei der Opposition nichts; kann Old Guard (v. a. Lileas Graf) und Oligarchen (Tusk, Koronti) belasten bis zur Anklage. **Aber**: Wenn du selbst Deals mit Oligarchen oder Old Guard gemacht hast, legt die Untersuchung **deine eigenen Korruptionsschemata frei → Impeachment**. — [Suzerain Wiki: Anti-Corruption Police](https://suzerain.wiki.gg/wiki/Anti-Corruption_Police)
- **SSP**: Geheimpolizei unter der (selbst belastbaren) Innenministerin; Achievement „Sssh!"; Werkzeug gegen Gegner — aber der Apparat gehört faktisch Lileas Graf, der Figur mit eigener Agenda.
- **Achievements als Design-Eingeständnis**: „Drain the Swamp" (ACP), „Sssh!" (SSP), „Police State" (Route) — das Spiel vergibt für alle drei Preise, d. h. es **würdigt den hässlichen Weg als legitimen Spielstil mit eigener Identität**.
- **Übernahme**: Exakt unser Fall (MİT vs. Justiz-Polizei? bzw. politisch besetzte Polizei vs. unabhängige Staatsanwaltschaft): **Ermittlungs-Instrumente prüfen immer das gesamte Korruptions-Konto — auch das des Präsidenten.** Konkret: Anti-Korruptions-Kommission als Vorgang, der bei Erfolg 1–2 fremde Affären löst, aber für jede eigene offene Affäre eine Entdeckungschance würfelt (Kopplung an unsere 4 Affärenvarianten + Geheimhaltung).

### 3.3 Notstand, Verfassung, Autokraten-Route

- **Article 100** = Ausnahmezustand (Achievement). **Autokraten-Route**: Deal mit **Oberstem Richter Orso Hawker** — Verfassungsreform wird *abgesagt*, im Tausch gewährt der Supreme Court **Emergency Authority**: Notstands-Dekrete können **Grundrechte aussetzen** (inkl. Haft ohne Verfahren); Macht begrenzt nur durch die Old Guard und ein mögliches **Widerrufs-Votum der Assembly**. — [TV Tropes: Suzerain](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/SuzerainRepublicOfSordland)
- **Verfassungsreform-Pfade**: Reformist (Supreme-Court-Veto abbauen, Präsidentenmacht beschneiden) vs. Diktator (Exekutive stärken, legislativ-Veto behalten, Gerichts-Veto über Verfassung entfernen) vs. Autokrat (s. o.); NFP ist für den Diktator-Deal offen, PFJP/Gerichtsreformer dagegen; Assembly braucht 2/3, Supreme Court einfache Mehrheit. — [Suzerain Wiki: Constitution](https://suzerain.wiki.gg/wiki/Constitution)
- **Preis-Logik**: Die Autokraten-Route ist die billigste *kurzfristig* (kein 2/3-Marathon), aber sie macht den Präsidenten zum **Geisel-Partner von Gericht und Old Guard** — Kontrolle ohne Umbau der Institutionen ist gemietet, nicht gekauft.
- **Übernahme**: REC-2 (Notstand) bekommt die Suzerain-Struktur: Notstand als **Institutionen-Deal** (AYM muss mitspielen — Sitze-Stand entscheidet), Nutzen = Blocker aufgehoben + Erlass-Preise fallen, laufende Rechnung = Legitimität + EGMR-Achse + „Widerrufs-Votum"-Risiko (Parlament kann Notstand aufheben → eigener Abstimmungs-Vorgang). Und die Hawker-Lektion für REC-1: **Verfassungs-Reform scheitern lassen zu können ist ein Feature** — der Ausstieg aus der Reform gegen Notmacht ist eine dritte Route.

---

## 4. Frostpunk

Frostpunk ist das moralische Kontroll-Labor: ein Gesetzesbuch, zwei Endpfade, und die berühmte Endbilanz-Frage **„Did we cross the line?"** — das einzige diskutierte Modell, in dem die Simulation dem Spieler die Rechnung *narrativ* präsentiert, ohne sie mechanisch einzutreiben.

### 4.1 Das Eskalations-Buch (Order-Pfad)

- **Stufen**: Neighborhood Watch → Guard Stations (mit Patrol-Fähigkeit) → **Propaganda Centre** → **Pledge of Loyalty** → **New Order**; paralleler Ast: Prison → **Forceful Persuasion**. Jede Stufe hat Law-Cooldown (36 h; New Order 72 h) — **Zeit als Anti-Aktionismus-Preis**. — [Frostpunk Wiki: Pledge of Loyalty](https://frostpunk.fandom.com/wiki/Pledge_of_Loyalty_(Purpose_Law)), [Frostpunk Wiki: New Order](https://frostpunk.fandom.com/wiki/New_Order_(Purpose_Law))
- **Propaganda Centre**: passive Hoffnung/Discontent-Steuerung über staatliche Nachrichten; produziert Skript-Ereignisse mit Todesfolge (Suizid des Dichters → Vandalismus-Event) — **Propaganda hat einen eingebauten menschlichen Kostenpunkt**. — [Frostpunk Wiki: Propaganda Centre (Arc)](https://frostpunk.fandom.com/wiki/Propaganda_Centre_(Arc)), [TV Tropes: Frostpunk YMMV](https://tvtropes.org/pmwiki/pmwiki.php/YMMV/Frostpunk)
- **Pledge of Loyalty**: verwandelt Bürger in **geheime Informanten**; „permanenter Hoffnungs-Bonus", Discontent steigt leicht — das Denunziations-System als *Ressourcen-Upgrade mit kleinem laufendem Preis*.
- **New Order**: **Hoffnung wird durch „Obedience" ersetzt und „wird nie wieder ein Problem sein"**; Hinrichtungsplattform wird automatisch gebaut; **12–30 Bürger sterben sofort**; bis zu 25 % leisten Widerstand (und sterben); Hinrichtung eines „Staatsfeinds" senkt fortan Discontent „greatly". Folge-Events: „Burn the Past" (Forschung temporär ↓), „The Dissident" (Tod, falls man den Ingenieur nicht einsperrt). — [Frostpunk Wiki: New Order](https://frostpunk.fandom.com/wiki/New_Order_(Purpose_Law)), [Loner Strategy Games: Frostpunk Faith or Order](https://lonerstrategygames.com/frostpunk-faith-or-order/)
- **Prison**: „Roundup"-Fähigkeit — Razzia, Unruhestifter 4 Tage weggesperrt, **Discontent fällt**, Cooldown nur 1 Tag (das häufigste, billigste Repressions-Tool).
- **Crossing the Line**: Das Szenario „A New Home" trackt exakt, welche Gesetze die Linie überschreiten: **Order: Pledge of Loyalty oder Forceful Persuasion; Faith: Protector of the Truth oder Righteous Denunciation**. Ending-Text ändert sich („we did not cross the line"); das Achievement „Golden Path" verlangt eine Partie ohne Linien-Überschreitung. — [Frostpunk Wiki: A New Home — The Line](https://frostpunk.fandom.com/wiki/A_New_Home), [TrueAchievements: Golden Path Guide](https://www.trueachievements.com/a283652/golden-path-achievement)
- **Moral-Ökonomie**: Hope/Discontent sind die Verlierer-Anzeigen (Discontent max = Absetzung); der Clou: Die End-Gesetze **lösen die Meter aus dem Spiel** (Hope wird Obedience) — totale Kontrolle ist mechanisch „optimal", aber narrativ der eigentliche Verlust. 11 bit Studios hat das als reflektierte Ebene designt („Crossing the line vs. keeping to your morals" als strategischer Loop). — [Game Developer: Human values in game design](https://www.gamedeveloper.com/design/human-values-in-game-design---an-approach-for-designing-emergent-storytelling), [MDPI: Aesth(ethics) in Frostpunk](https://www.mdpi.com/2076-0787/14/12/242)
- **Übernahme**: (a) **Linien-Tracking**: Staatsräson führt ein verdecktes „Linien-Konto" (Menschenrechtsschwere der verabschiedeten Maßnahmen), das am Amtsende ins Geschichtsbuch einfließt — ohne das Spiel mechanisch zu bestrafen (Moral beim Spieler, Rechnung bei der Simulation: die Rechnung läuft über Legitimität/RSF/Beziehungen, das Gewissen über das Bilanz-Kapitel). (b) **Hoffnung → Gehorsam**: Bei extremem Notstand + Medienkontrolle kann unsere Protest-Mechanik in einen „Ruhe durch Angst"-Zustand kippen, der Protest-Events beendet, aber Unzufriedenheit unsichtbar akkumuliert (Vorlage für Blowback). (c) **Cooldowns pro Gesetz** (36 h/72 h) als Anti-Eskalations-Spamschutz — bei uns: Mindestabstand zwischen Sicherheitsgesetzen in derselben Legislatur.

---

## 5. Beholder

Beholder (Warm Lamp Games, 2016) beantwortet die Frage „wie fühlt sich Überwachung an?" mit einer Ökonomie der kleinen Erpressung — und der wichtigsten asymmetrischen Design-Regel des Genres: **Der Staat ist nicht allwissend; er weiß nur, was gemeldet wird.**

- **Funktionsweise**: Spieler = staatlich eingesetzter Hausmeister Carl. Werkzeuge: Wohnungen verwanzen, durchsuchen, Schlüsselloch, Gespräche belauschen → **Profile** an das Ministerium verkaufen; **Meldungen** bei Verstoß gegen täglich neue, eskalierende Direktiven (bis zum Verbot des Weinens); **Erpressungsbriefe** gegen Beweise. Regierungspay pro Profil/Info (Beholder 3: $250 je Information); Fehler im Formular (falsches Feld) = **Geldstrafe**; Erpressungsbrief mit Fehler = ignoriert. — [Gameranx: Beholder Review — Panopticon](https://gameranx.com/features/id/93250/article/beholder-review-a-terrifyingly-realistic-panopticon/), [OkayGotcha: Beholder 3 Guide](https://www.okaygotcha.com/2022/03/how-to-make-lot-of-money-in-beholder-3.html)
- **Kosten**: Nicht der Überwachung, sondern des **Lebens** — die Tochter braucht Medizin (20.000–30.000), der Sohn droht von der Uni zu fliegen (15.000); ehrliche Arbeit (Profilieren) deckt das nie. Die Ökonomie *erzwingt* die hässlichen Wege: Stehlen, Erpressen, Melden. „Evil is easy": Erpressen + trotzdem melden + Besitz verkaufen = Maximalprofit. — [TV Tropes: Beholder](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/Beholder), [Grokipedia: Beholder](https://grokipedia.com/page/Beholder_(video_game))
- **Wer gewinnt/verliert**: Das Ministerium gewinnt Akten; der Spieler gewinnt Geld und Reputationspunkte (soziale Währung); die Mieter verlieren alles. Verlieren tut Carl, wenn er **erwischt** wird (Diebstahl 3× ohne Bestechung, Denunziation durch andere) — das Ministerium bestraft nur, was es *weiß*.
- **Versteckte Effekte**: (1) **Erpressungs-Opfer können Suizid begehen** (Blowback auf Ressourcen: weggefallener Mieter). (2) Wer die eigene Tochter meldet (Lesen wird verboten), dem wird *selbst* der Prozess gemacht — Kinder unter 14 zu melden ist das größere Verbrechen: **Der Apparat hat bizarre eigene Regeln, die er nicht begründet.** (3) Endspiel-Inspektion: Wer alles buchstabengetreu befolgt, besteht die Inspektion — „aber es gibt schwere Konsequenzen, wenn man nicht aufpasst" (Just-Following-Orders ist eine Falle, kein Sieg). — [TV Tropes: Beholder](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/Beholder)
- **Übernahme**: (a) **Überwachung als Informationseingang, nicht als Zustand**: Unser MİT-Modul sollte „Akten" erzeugen (Personen-Akten auf Figuren des PERSONEN-Systems), die Aktionen freischalten (Haken, Verfahren, Leak) — Überwachung ohne Akten-Nutzung ist wertlos, genau wie bei Beholder. (b) **Der Apparat kennt nur Gemeldetes**: Geheimhaltungs-Verbrauch als „Wer weiß es?"-Kette — je mehr Stellen eine Operation kennen (Dienst, Minister, Palast), desto mehr Leak-Kanten. (c) **Ökonomischer Zwang statt Menü-Vorschlag**: Die hässlichen Wege werden nicht angeboten, sie werden *nötig* (Skandal-Abwehr, Stimmenbedarf) — Beholders härteste Lektion für unser Balancing.

---

## 6. Orwell

Orwell 1 (Keeping an Eye on You, 2016) und Orwell 2 (Ignorance is Strength, 2018; Osmotic Studios) modellieren Überwachung als **Deutungsmacht**: Der Spieler entscheidet nicht, *ob* überwacht wird, sondern *was die Daten bedeuten* — und die Maschine handelt auf seine Lesart hin.

- **Funktionsweise**: Als „Investigator" des Systems Orwell zieht man **Datachunks** (Textfragmente aus Blogs, Chats, Bankkonten, medizinischen Akten, abgehörten Telefonaten) per Drag&Drop in Personen-Akten. **Konflikt-Chunks** zwingen zur Auswahl einer von 2–3 Deutungen (z. B. Harrison: „lehnt Regierung ab" vs. „feindselig, der Typ baut Bomben" vs. „unterstützt die Regierung" — je nach Upload verhört der Berater anders). Der „Orwell Ethical Codex" trennt formal Investigator (sammelt) und Adviser (handelt) — die Gewaltenteilung im Überwachungsapparat ist Theater: der Investigator lenkt die Handlung durch Auswahl. — [The Guardian: Orwell game](https://www.theguardian.com/games/2018/jul/02/orwell-game-hack-spy-tech-dystopia-government-surveillance), [Soraya Murray: Nineteen Eighty-Four and Video Games (PDF)](https://sorayamurray.com/wp-content/uploads/2021/11/murray_in_this_game_that_were_playing.pdf), [Orwell Wiki: Orwell (Surveillance System)](https://orwell-game.fandom.com/wiki/Orwell_(Surveillance_System))
- **Kosten/Nutzen**: Nutzen = Verhinderung des dritten Bombenanschlags (richtiger Chunk + genug kompromittierendes Material zum Einschüchtern der Verdächtigen). Kosten = **falsche Uploads töten**: Chunk „bewaffnet und fluchtbereit" hochgeladen → Verdächtiger wird beim Zugriff erschossen statt verhaftet; falsche Orts-Deutung → Bombe explodiert. — [No Mutants Allowed: Orwell Erfahrungsbericht](https://www.nma-fallout.com/threads/my-thoughts-on-orwell-a-game-i-stumbled-upon.209417/), [IndieGameAtlas: Orwell Episode-2-Guide](https://www.indiegameatlas.com/post/guide-orwell-keeping-an-eye-on-you-episode-2)
- **Orwell 2 — Propaganda als Werkzeug**: Das „Office" nutzt **künstliche Social-Media-Personas** (Influencer-Tool: 1 Stunde Laufzeit, blockiert den Profiler) und kann **Informationen direkt in Websites einschreiben** — aktive Desinformation statt nur Lesen. — [Orwell Wiki: Orwell (Surveillance System)](https://orwell-game.fandom.com/wiki/Orwell_(Surveillance_System))
- **Wer gewinnt/verliert**: Der Staat gewinnt Durchsetzung; die Überwachten verlieren Unschuld-Vermutung (bloße Assoziation macht zum Ziel); der Investigator selbst wird am Ende zum überwachten Objekt (Endings: Selbst-Inkriminierung, Flucht, „2+2=5" — alle Thought-Mitglieder im Gefängnis, Investigator selbst zur Fahndung ausgeschrieben). — [IndieGameAtlas: Orwell Episode-5-Guide](https://www.indiegameatlas.com/post/guide-orwell-keeping-an-eye-on-you-episode-5)
- **Übernahme**: (a) **Deutungs-Chunks für Ermittlungen**: Unsere Ermittlungs-Vorgänge (Justiz/Geheimdienst) präsentieren dem Präsidenten nicht „schuldig/unschuldig", sondern widersprüchliche Beweis-Stücke — seine Auswahl legt die Anklage fest (Moral beim Spieler, Fehlerquote bei der Simulation). (b) **Desinformations-Werkzeug** (Orwell 2): Trolle/Bot-Netzwerke als MİT-Operation mit Laufzeit-Kosten und Entdeckungspreis — deckt sich mit unserem Social-Media-Drosselungs-Realbefund (42 h, März 2025) als Event-Trigger. (c) **Der Investigator wird selbst zum Ziel**: Geheimdienst-Chef als PERSONEN-Figur, die bei zu vielen Operationen ihr eigenes Kompromat-Konto anhäuft.

---

## 7. Headliner: NoviNews / The Westport Independent

Die beiden „Zeitungsmacher"-Spiele zeigen kontrollierte Presse von der Produktionsseite — für uns wertvoll als Modell dafür, **was gesteuerte Medien konkret bewirken** (und was sie den Machthaber kosten, der sie steuert).

### 7.1 Headliner: NoviNews (Unbound Creations, 2018)

- **Funktionsweise**: Täglich Artikel stempeln (publizieren/verwerfen — manche Tage erzwingen eine Mindestzahl, manche Pakete sind zusammengeheftet, d. h. man kann sich der Positionierung nicht entziehen). Jede Entscheidung verschiebt Stadt-Öffentlichkeit: Gesundheitsversorgung, Wirtschaft, Nationalstimmung, Proteste — Rückkopplung über sichtbare Straßenzustände und Folge-Artikel. — [Medium: PEGBRJE — HEADLINER](https://tophatmuffin.medium.com/pegbrje-circa-infinity-and-headliner-f71fd18a9b6f), [IndieGameReviewer: Headliner NoviNews Review](https://indiegamereviewer.com/headliner-novinews-review-fake-news-and-real-personality/)
- **Lehre**: Kleine, „neutrale" Redaktionsentscheidungen kumulieren zu gesellschaftlichen Kippzuständen (Suizid-Cluster, Panik-Käufe, Pogrom-Stimmung) — **Medienwirkung ist ein verzögerter, nichtlinearer Fluss, keine Direktzahl**.

### 7.2 The Westport Independent (Double Zero One Zero, 2016)

- **Funktionsweise**: Chefredakteur einer Zeitung unter Zensurgesetz: Überschriften umschalten (zwei Varianten), Absätze streichen, **Marketing-Budget pro Stadtviertel nach politischer Ausrichtung verteilen**; die 4 Redakteure haben eigene Haltungen — wer sie zur loyalistischen Hofberichterstattung zwingt, senkt deren „Comfort" bis zur Weigerung; das Blatt driftet Richtung Propaganda-Organ oder Sympathisant der Rebellen, mit Enden für beide. — [Kotaku: Westport Independent](https://kotaku.com/westport-independent-is-an-intense-game-about-censoring-1754309137)
- **Lehre**: Zensur ist **Personal-Politik** (Redakteure als Figuren mit Grenzen) + **Distribution** (wo wird die geänderte Zeitung gelesen?) — nicht nur Inhalt.

- **Übernahme für Staatsräson (REC-4)**: (a) Unsere Zeitung (UI-1) bekommt eine **Redaktions-Ebene**: 2–4 benannte Chefredakteure als PERSONEN-Profile mit Haltung; Gleichschaltung = Personalwechsel, nicht Schalter. (b) Headliner-Prinzip für den Ereignismotor: Ereignis-Folgen werden durch den aktuellen Medienzustand **umgeschrieben** (gleiches Erdbeben: „Katastrophe" vs. „Koordinationsstärke"), mit kumulativer Drift der Umfragewerte — Medien als *Interpreter* aller Ausgaben, nicht als eigener Wert. (c) Westports Viertel-Marketing als Vorbild für provinzielle Medienwirkung (81 Provinzen: staatliche Medien wirken stärker in konservativen Provinzen, schwächer in Metropolen mit hohem Social-Media-Anteil).

---

## 8. Crisis in the Kremlin / Ostalgie

Die Kremlingames-Titel (und ihr 1991er Urvater von Spectrum HoloByte) sind die direkteste Blaupause für „Repression als Regler in einem sterbenden System" — mit der zentralen historischen These: **Glasnost ist eine eskalierende Freigabe mit Systemrisiko.**

- **Crisis in the Kremlin (1991)**: Erstes Spiel mit individueller Budget-Allokation; der Generalsekretär balanciert Radikale, Reformer, Hardliner — wer eine Seite zu sehr verprellt, kassiert ein **Misstrauensvotum im Politbüro** (Absetzung als Normaltod); Warschauer-Pakt- und Unionsrepubliken driften bei Schwäche ab. Ereignis-Antworten über „Telefon"-Dilemmas (3–5 Optionen). Zeitgenössische Kritik: Die Simulation treibt Richtung freier Markt und Liberale Lockerung — Repression verzögert nur. — [Wikipedia: Crisis in the Kremlin (1991)](https://en.wikipedia.org/wiki/Crisis_in_the_Kremlin)
- **Crisis in the Kremlin (2017, Kremlingames)**: Spiritual Successor; Fraktionen (Nationalisten, Kapitalisten, Generäle, Hardliner, Reformer — „all have a target painted on your back"), KGB als eigene Größe im Machtgefüge (Geheimdienst-Nutzung zur Abwehr „feindlicher" Kräfte); Scheitern = vorzeitiger Ruhestand „aus Gesundheitsgründen". Detaillierte Parameter-Dokumentation ist dünn — die genauen Reglerwerte für Freiheitsgrade sind **[unverifiziert]** (kein erreichbares Wiki mit Zahlen; Community-Guides fragmentar). — [TV Tropes: Crisis in the Kremlin](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/CrisisInTheKremlin), [Steam Community: Definitive Full Event Guide? (Thread)](https://steamcommunity.com/app/599750/discussions/0/1692659769963527735/)
- **Ostalgie: The Berlin Wall (2018)**: DDR/Bulgarien/Rumänien/Polen führen; explizit: **Wahlen manipulieren**, Propaganda anpassen, Budget verteilen, Reformen führen oder unterdrücken, „Westalgia" bekämpfen oder kanalisieren; Parteitreue und ideologischer Anker als zerbrechliche Konten (jede Zugeständnis-Richtung Westen zehrt an beiden). — [Ostalgie auf Steam (Store-Text)](https://store.steampowered.com/app/774091/), [nostal.games (Entwicklerseite)](https://nostal.games/EN/subsite3.html)
- **Übernahme**: (a) **Glasnost als irreversibler Regler mit Momentum**: Pressefreiheit-Öffnung erzeugt eine eigene Dynamik (Skandale kommen *verzögert und gestapelt* ans Licht, nicht proportional zur Öffnung) — wer öffnet, muss die Stapel-Phase überstehen, sonst bestraft ihn die Simulation wie Gorbatschow. Mechanisch: Öffnungs-Stufen erhöhen ein „Aufklärungs-Backlog"-Konto, das als Skandal-Events abgearbeitet wird. (b) **Politbüro-Misstrauen als Absetzungs-Pfad neben Wahl/Sturz**: Unsere Partei-/Fraktions-Ebene (INN-7) kann das als „Parteitag-Votum" abbilden — der türkische Kontext kennt den internen Putsch der Partei.

---

## 9. Civilization VI

Civ 6 liefert die formal sauberste **Geheimdienst-Mathematik**: Missionen mit expliziten Erfolgs-/Entdeckungswahrscheinlichkeiten, und Entdeckung ist kein Game-Over, sondern eine **diplomatische Rechnung**.

- **Funktionsweise**: Spione (max 5, mit Intelligence Agency 6) springen zwischen Städten; jede Mission hat Briefing-Screen mit **Dauer, Erfolgschance, Entdeckungs-/Todes-/Gefangenen-Chance**. Missionen: Gain Sources (+2 Level für 24 Züge, 100 % Erfolg, kein Risiko), Listening Post (+1–2 diplomatische Sicht, risikofrei), Siphon Funds (Gold des Distrikts), Steal Tech Boost (Eureka stehlen), Great Work Heist, Sabotage Production (Distrikt-Gebäude zerstört), Recruit Partisans (**2–4 Rebellen-Einheiten** spawnen — Destabilisierung als Kaufoption), Disrupt Rocketry, **Foment Unrest** (Loyalty −20, +5 je Spion-Level), **Neutralize Governor** (Gouverneur 7 Züge +1/Level außer Gefecht), **Fabricate Scandal** (entfernt 3 Gesandte +1/Level des führenden Rivalen in einem Stadtstaat — Rufmord als Service), Breach Dam (Flut auslösen). — [Civilization Wiki: Espionage (Civ6)](https://civilization.fandom.com/wiki/Espionage_(Civ6))
- **Entdeckung = Preisliste**: Entdeckte Spione lösen eine **Forderung des Ziel-Anführers + Casus Belli** aus; Flucht-Minispiel (Flugzeug 1 Zug/am gefährlichsten → zu Fuß 4 Züge/am sichersten); Gefangene Spione können **zurückgehandelt** werden und **blockieren bis dahin einen Spion-Slot** (Opportunitätskosten von Blowback!). Gegenspionage: eigener Spion deckt seinen Distrikt + alle angrenzenden (Cluster-Bau als Abwehr-Architektur). — [Civilization Wiki: Espionage (Civ6)](https://civilization.fandom.com/wiki/Espionage_(Civ6))
- **Level/Promotions**: Recruit → Agent → Secret Agent → Master Spy; Promotions spezialisieren (License to Kill: Neutralize +2 Level; Seduction: Counterspy +2; Linguist: −25 % Dauer; Polygraph: feindliche Spione −1 Level im Heimatland) — der **Apparat ist ein lernender Bestand**, kein Regler.
- **Rock Bands (Soft Power)**: Glaubens-Einheit mit Konzerten im Ausland: Basis-Tourismus 250–1.000 je Venue (Weltwunder 1.000), Album Sales als erwartete Stärke; Promotion **„Indie": Konzert kostet die Zielstadt −50 Loyalty** — kulturelle Destabilisierung als legale, sichtbare Operation (kein Entdeckungsrisiko!). — [Civilization Wiki: Rock Band](https://civilization.fandom.com/wiki/Rock_Band_(Civ6)), [Arioch's Well of Souls: Civ6 Gathering Storm Analyst](https://www.well-of-souls.com/civ/civ6_gatheringstorm.html)
- **Übernahme**: (a) Unsere Geheimdienst-Operationen (Block D/MIL-5) bekommen das Civ-6-Briefing: **Dauer, Erfolg %, Entdeckung %, Preis bei Entdeckung** (Casus-Belli-Analog: sofortige Beziehungsstufe-1-Kosten in der 4D-Matrix + „Rote-Linie"-Flag beim Zielland + möglicher EU-Eintrag). (b) **Gefangenen-Handel** als Folge-Minikrise (Agentenaustausch am Verhandlungstisch — wir haben dafür die Klausel-Infrastruktur). (c) **Fabricate Scandal** als konkrete Operation gegen Drittland-Beziehungen eines Rivalen (z. B. Einfluss auf EU-Stimmen). (d) **Indie-Rockband-Prinzip**: offene, legale Kultur-/Medien-Projektion (TRT World, Diaspora-Medien) als risikoarme Alternative zu dunklen Operationen — die Stufenleiter „sichtbar-legal ↔ verdeckt-illegal" mit je eigenem Risikoprofil.

---

## 10. Crusader Kings III

CK3 ist die Referenz für **Angst als Regierungsressource** und für die komplette Ökonomie verdeckter Operationen (Geheimnisse → Haken → erzwungene Stimmen). Zahlen aus dem offiziellen Wiki.

- **Dread (0–100)**: gewonnen durch Folter/Hinrichtung von Gefangenen, verloren durch Gnade/Freilassung; driftet mit **0,5/Monat** zum „natürlichen Dread" (Trait-basiert: Sadistic +35, Compassionate −15 …). **Schwellen**: Figur ist „intimidated", wenn Dread ≥ Boldness+20; „terrified" bei +45. Terrified-Figuren **treten nie Fraktionen oder Schemes gegen dich bei** — Angst ist prophylaktische Stabilität. Interaktions-Boni: Imprison +25/+50, Revoke Title +25/+50, Ransom +40/+100; umgekehrt **Heiraten wird schwerer (−50/−75)** — Schrecken kauft Gehorsam, aber keine Ehen/echte Bündnisse. — [CK3 Wiki: Dread](https://ck3.paradoxwikis.com/Dread)
- **Tyranny (max 1.000)**: Unrechtmäßige Aktionen ohne validen Grund: **Inhaftierung +20, Titel-Entzug +20, Vasallen-Entzug +5, Verbannung +5, Hinrichtung +10**; wirkt als General-Opinion-Malus (−1 bis −1000!); Zerfall **−0,25/Monat** (Perks/Kultur-Traditionen modulieren ±50–100 %). Perk „Malice Implicit": **+0,5 Dread pro Tyranny-Punkt** — die Brücke zwischen den beiden Konten. — [CK3 Wiki: Character — Tyranny](https://ck3.paradoxwikis.com/Tyranny)
- **Schemes**: Murder / Abduct / Fabricate Hook / Claim Throne; zwei Achsen: **Scheme Power** (Planungsgeschwindigkeit) vs. **Success Chance**; **Secrecy** als dritter Wert — Entdeckung: **−75 auf Success Chance**; entdeckte Agenten erhöhen Ziel-Resistenz; Abbruch = **10 Jahre Cooldown**. Agenten-Beiträge nach Nähe: Spymaster +75, Ehepartner/Guardian/Best Friend +50, Lover/Court Physician +30, Councillor +25, mächtiger Vasall/Nemesis +15, sonstige +10. — [CK3 Wiki: Schemes](https://ck3.paradoxwikis.com/Schemes), [GameWatcher: CK3 Schemes, Secrets, Hooks](https://www.gamewatcher.com/crusader-kings-3-schemes-secrets-hooks-intrigue)
- **Secrets → Hooks**: Vergehen erzeugen versteckte Secrets (spymaster „Find Secrets" deckt auf); Optionen: **Exposen** (Ruf zerstört) oder **Erpressen** = Hook. Schwaches Vergehen → **Weak Hook** (einmalig, 10 Jahre); kriminelles → **Strong Hook** (wiederholbar bis Ablauf, **blockiert feindselige Aktionen des Opfers gegen dich**). Hooks erzwingen: Council-Posten, Ehen, Vertrags-Änderungen ohne Tyranny, Stimmen in Wahlen; Perk „Golden Obligations": Hooks für bis zu 300 Gold zurückverkaufen. — [GameWatcher: CK3 Intrigue Guide](https://www.gamewatcher.com/crusader-kings-3-schemes-secrets-hooks-intrigue)
- **Stress als Moral-Ressource**: Mitgefühl/Gerechtigkeit/Ehrlichkeit-Traits zahlen Stress für Folter, Hinrichtung, Erpressung, Mord-Schemes (Mental Breaks bei 100/200/300) — **die Figur selbst hat ein Gewissen-Konto**; Charaktere ohne diese Traits zahlen nichts. Das ist die CK3-Antwort auf „die Moral liegt beim Spieler": Wer einen sadistischen Charakter spielt, *darf* ohne Selbstkosten schrecken. — [Steam Guide: Trait effects on Stress](https://steamcommunity.com/sharedfiles/filedetails/?id=2868962445)
- **Übernahme**: (a) REC-3 (Haken-Ökonomie) ist schon vorgemerkt; diese Vertiefung liefert die Zahlen: schwach = einmalig + 10 Jahre, stark = wiederholbar + **Aktions-Blockade des Opfers** (für uns: Fraktionsführer mit Strong Hook kann nicht gegen den Präsidenten intrigieren). (b) **Dread als eigener Wert „Einschüchterung"** neben Legitimität: staatliche Härte (Prozesswelle, Notstand, Festnahmen) füllt es; es senkt Putsch-/Parteiputsch-/Protest-Bereitschaft über Schwellen (+20/+45-Logik); es driftet zurück (0,5/Monat-Analog: Halbwertszeit ~1 Jahr) und blockiert gleichzeitig „weiche" Ressourcen (echte Koalitionsangebote, EU-Annäherung). (c) **Stress-Muster für die Präsidenten-Figur**: optionale Gewissens-Kosten je nach gewähltem Präsidenten-Profil (Prolog) — macht den dunklen Pfad charakterabhängig statt frei verfügbar.

---

## 11. Power & Revolution

Eversims Geopolitical Simulator ist das „alles ist ein Regler"-Gegenmodell: Maximale Optionen, minimale Dramaturgie — wertvoll als Vollständigkeits-Checkliste dessen, was ein Staatschef alles *darf*, und als Warnung vor dem Interface-Preis davon.

- **Funktionsweise**: Staatschef steuert den **Ministerialhaushalt bis auf Unterpositionen** — die offizielle Feature-Liste nennt explizit: Polizei-IT, **Sicherheitsdienste für das Staatsoberhaupt**, **Counter-Spy-Dienste**, Personaleinstellung und Gehälter der Verwaltung (Polizei inkl.). Bei Unruhen: Polizei-Brigaden auf der Stadtkarte manövrieren, **Ausnahmezustand, Martial Law, Nationalgarde** deklarierbar. — [Power & Revolution: Game Description (offiziell)](https://www.power-and-revolution.com/presentation.php?langue=en)
- **Geheimdienst**: Die Oppositions-/Terror-Seite zeigt den Spiegel: Infiltration von Machtzirkeln, Putsch-Versuche, politische Attentate, Netzwerke gegen feindliche Geheimdienste absichern — der Staatschef hat dieselbe Werkzeugpalette aus Sicht der anderen Seite; Gesetze müssen durch ein reales Parlament, UN-Denunziation kann Interventionsmandate erzeugen. — [Power & Revolution: Game Description (offiziell)](https://www.power-and-revolution.com/presentation.php?langue=en)
- **Indizes**: P&R führt Länder-Realdaten-Blätter mit Dutzenden Indikatoren (u. a. Pressefreiheits-Kenngrößen in der Länderakte — exakte Ausprägung/Skala in der aktuellen Version **[unverifiziert]**, da keine Wiki-Quelle erreichbar; die Feature-Logik „echte Länderdaten als Spielwerte" ist durch die offizielle Beschreibung belegt).
- **Lehre (positiv wie negativ)**: Die Komplett-Liste zeigt, dass „Polizei-Budget", „Counter-Intelligence", „Ausnahmezustand", „Zensur" als Einzelregler existieren *können* — aber ohne die dramaturgische Einbettung (Suzerain) oder Netz-Kopplung (D4) bleiben sie folgenarme Slider. Für uns: Die Regler existieren bei uns schon (9-Regler-Haushalt); der Mehrwert liegt in **Konsequenz-Ketten**, nicht in mehr Reglern.

---

## 12. Rebel Inc.

Rebel Inc. (Ndemic) modelliert Korruption als **Latenz-Phänomen** — und beherbergt die vielleicht wichtigste Einzelzelle dieses Reports: **die Journalistin als Anti-Korruptions-Waffe.**

- **Funktionsweise**: Fast jede Initiative (Ausgabe) erhöht **Corruption Risk** (das Cap); die tatsächliche **Corruption** wächst langsam dem Cap entgegen. Schaden: `Support-Level-Verlust ≈ 1,15 × c²` (quadratisch!) und `Reputations-Verlust/Monat ≈ (c/3,6) × 6`. Reputation = 0 → Spielende. Schwierigkeitsgrad skaliert die Wachstumsgeschwindigkeit brutal (Brutal/Mega-Brutal: „peak in a blink of eye"). — [Rebel Inc. Wiki: Core Game Concepts](https://rebelinc.wiki.gg/wiki/Core_Game_Concepts), [Villains Wiki: Corruption (Rebel Inc.)](https://villains.fandom.com/wiki/Corruption_(Rebel_Inc.))
- **Gegenmittel**: 4 Anti-Corruption-Initiativen-Stufen (senken Risiko um `Schwierigkeit × Effektivität`, je Team +0,005); **Effective Procurement** senkt *Entstehung* (macht Beschaffung teurer/langsamer — ehrlicher Trade-off statt „Korruption abschaffen"-Knopf); **Corruption Purges** resetten den Stock, erhöhen aber dauerhaft zivile Preise (Säuberung kostet Systemkapazität). Warlord-Einheiten erzeugen das meiste Risiko; der Smuggler-Gouverneur *lebt* von Korruption und verliert mehr Support. — [Rebel Inc. Wiki: Core Game Concepts](https://rebelinc.wiki.gg/wiki/Core_Game_Concepts), [Steam Guide: How Not to Fail at Rebel Inc](https://steamcommunity.com/sharedfiles/filedetails/?id=1971611915)
- **Die Presse-Zelle**: Der Berater **„Investigative Reporter" multipliziert die Effektivität der Anti-Korruptions-Teams** (~×1,02 bei 1 Team bis ×1,2 bei 4 Teams) — unabhängiger Journalismus als messbarer Verstärker der Aufklärungskapazität. — [Rebel Inc. Wiki: Core Game Concepts](https://rebelinc.wiki.gg/wiki/Core_Game_Concepts)
- **Inflation als Zwilling**: Schnelles Kaufen treibt Preise (Formel dokumentiert, Decay −5 %/Zug, aber Rundung hinterlässt +$1 dauerhaft je Kauf) — **Tempo selbst ist die Sünde**: Wer schnell regiert, erzeugt Korruption UND Inflation.
- **Übernahme**: (a) Bereits in RECHERCHE_VERTIEFUNG_WIRTSCHAFT als Übernahme Nr. 9 vorgemerkt (Risiko-Cap-Modell); diese Vertiefung ergänzt die Formeln (c²-Schaden, Purge-Preis). (b) **Pressefreiheit als Effektivitäts-Multiplikator der Korruptions-Aufklärung** — das ist die mechanisch exakte Antwort auf das Auftraggeber-Beispiel: Presse einschränken senkt den Multiplikator → Korruptions-Stock wächst unbemerkt → Schaden c² erst später, dafür größer. Kurzfristig nützlich (keine Skandale), langfristig teuer (größeres c, RSF-Beobachtung, EU-Dimension). (c) **Tempo-Preis**: Unsere Schnell-Erlasse (doppelter Preis existiert) könnten zusätzlich ein kleines Korruptions-Risiko-Cap heben — Eile ist käuflich, aber käuflich ist korruptibel.

---

## 13. Kurzporträts

### 13.1 Floor 13 (1991, Virgin) — das UR-Spiel der Überwachung

- **Funktionsweise**: Der Spieler ist Director General einer britischen Schatten-Agentur; täglich Reports mit potenziellen Skandalen, die die **Popularität der Regierung** gefährden; 8 Abteilungen als Werkzeuge: **Surveillance, Wire-Tapping, Search & Loot (Hausdurchsuchung), Interrogation (mit grafischer Folter-Textausgabe), Disinformation (Presse-Diskreditierung), Infiltration, Heavy Assault (Kommando), Assassination**. Personen/Gruppen haben Ratings: **Prominenz, Macht, Haltung zur Regierung** — sie bestimmen Erfolgschancen und die öffentliche Reaktion auf Aktionen gegen sie. — [Wikipedia: Floor 13](https://en.wikipedia.org/wiki/Floor_13_(video_game)), [MobyGames: Floor 13](https://www.mobygames.com/game/6067/floor-13/)
- **Der eingebaute Rückschlag**: Wer zu eifrig „black hat" arbeitet, erregt Aufmerksamkeit — **„Mr. Garcia"** sorgt dafür, dass laute Director Generals aus dem Bürofenster fallen. Der Apparat schützt sich selbst vor seinem Chef. — [MobyGames: Floor 13](https://www.mobygames.com/game/6067/floor-13/)
- **Übernahme**: (a) **„Eliminate vs. Discredit" als Optionspaar** für Geheimdienst-Aktionen gegen Personen (harte vs. weiche Neutralisation mit je eigenem Blowback: Attentat = Märtyrer-Risiko; Diskreditierung = Ruf-Kampf über unsere Medien-Kanäle). (b) **Mr. Garcia als Apparat-Immunsystem**: MİT-Direktor als PERSONEN-Figur mit eigenem Risiko-Konto; bei zu vielen/riskanten Operationen kippt der Dienst (Leck an die Presse, Denunziation vor AYM, „Verdacht auf Eigenmächtigkeit") — die Geheimhaltungs-Währung bekommt eine *Verfall-Front von innen*. (c) Prominenz/Macht/Haltung als dreidimensionale Zielbewertung für jede Operation (hohe Prominenz × harte Aktion = internationaler Skandal).

### 13.2 Papers Please (2013, Lucas Pope) — Dokumentenkontrolle als Schleife

- **Funktionsweise**: Grenzbeamter in Arstotzka; täglich neue Regeln (Karteikarten-Regelwerk wächst); pro korrekt abgefertigter Person **5 Credits**; **Zwei Verwarnungen frei, ab der 3. Citation −5 Credits**; Tagesende: Miete, Essen, Heizung für die Familie — zu wenig Geld → Familie wird krank → Medizin-Kosten-Kaskade → Delinquency-Ende (Schuldner-Knast). Der Entwickler hat „alle ablehnen/alle annehmen" bewusst mit eskalierenden Strafen bis Game-Over gepatcht. — [Digital Storytelling: Vigilance in Papers, Please](https://digitalst0rytelling.wordpress.com/2016/02/19/vigilance-in-papers-please/), [Lucas Pope: Papers Please Devlog](https://fguillen.github.io/PapersPleaseDevlogScrap/), [Kafer (UChicago Dissertation, S. zu Grenz-Spielen)](https://knowledge.uchicago.edu/record/7628/files/Kafer_uchicago_0330D_16796.pdf)
- **Lehre**: Kontrolle wird **als Zeitdruck-Ökonomie** erlebt (Genauigkeit vs. Durchsatz vs. Familie) — die Bürokratie der Repression ist selbst die Mechanik; Moral-Entscheidungen (EZIC, verzweifelte Einreisende) kosten Durchsatz. Für uns als UI-/Kosten-Vorlage für den **Alltag des Ausnahmezustands**: REC-2 kann Sicherheits-Durchsatz (Kontrollen, Festnahme-Quoten) gegen Verwaltungskraft und Fehlerquote (Citation-System: falsche Festnahme = Legitimität + EGMR-Ticket) tauschen lassen.

### 13.3 Not for Broadcast (2022, NotGames) — Propaganda-Schnitt in Echtzeit

- **Funktionsweise**: Spieler = Sende-Regisseur der National Nightly News; Vision Mixer (Kamera wählen), **2-Sekunden-Delay** für den **Zensur-Knopf** (Bleep), Interferenz-Wellenform, Publikums-Meter (0 = Level-Fail); zwischen den Segmenten: **Wahl von 3 Werbespots und Schlagzeilen** — diese steuern die Unterstützung für Regierung (Advance) vs. Widerstand (Disrupt) und die eigenen Aktien-Einnahmen; 14 Epiloge. Später: Manipulation der Sendung für den Umsturz (für oder gegen Advance) — **der Cutter entscheidet Geschichte**. — [Wikipedia: Not for Broadcast](https://en.wikipedia.org/wiki/Not_For_Broadcast), [Phenixx Gaming: NfB Review](https://phenixxgaming.com/2022/02/08/not-for-broadcast-pc-review/)
- **Lehre**: Zensur ist hier **Handwerk unter Zeitdruck** (Bleep-Timing) plus **Strategie in der Werbepause** (welche Realität bekommt das Publikum?). Für uns: Wenn das Medien-System (REC-4) eine Live-Dimension bekommen soll (TV-Duell, Krisen-Pressekonferenz), ist das 2-Sekunden-Modell die Vorlage für „der Präsident als Kurator der Live-Realität" — alternativ abstrakt: Schlagzeilen-Wahl nach Großereignissen als wiederkehrende Mikro-Entscheidung.

---

## 14. Der Preis der Kontrolle — eine Taxonomie

### 14a. Typologie: Wie Spiele Kontrolle bepreisen

Die 15 untersuchten Spiele bepreisen Repression/Überwachung/Medienkontrolle in fünf wiederkehrenden Preis-Architekturen. Keine davon reicht allein; die realistischsten Spiele kombinieren zwei bis drei.

| Typ | Mechanik | Vorbild | Stärke | Schwäche |
|---|---|---|---|---|
| **T1: Einstiegspreis (Aktionswährung)** | Kontrolle kostet beim (Ver)Stärken PC; Preis skaliert mit Kontroverse; Abschaffen separat bepreist | D4 (Introduce/Raise/Lower/Cancel), Tropico (Edikt-$) | Sofort verständlich, zügige Entscheidung | Einmalzahlung „vergisst" die Maßnahme danach — D4 löst das über laufende Gruppen-Effekte |
| **T2: Laufender Unterhalt (Legitimität/Beziehungen/Freiheits-Drain)** | Solange aktiv, tickt der Preis: Fraktions-Standing (Tropico: Martial Law −15 alle), Liberty (Medien-Modi 40→10), Demokratie-Wert (D4 Press Freedom) | Tropico 6, D4, CitK | Realistisch („Dauerzustand kostet dauernd") | Braucht sichtbaren Zähler, sonst Blackbox |
| **T3: Latentes Risiko-Konto (Cap + Füllung + Schwelle)** | Maßnahmen füllen ein Risiko-Cap (Korruption, Radikalisierung, Civil-Uprising-Input), das verzögert und nichtlinear (x², x⁴, x⁶, x^10) auszahlt | Rebel Inc. (Corruption Risk), D4 (Terrorism x^4, Corruption x^6, Security x^10) | Erzeugt „schleichend-teuer" und die berühmte D4-Kurve „erst nichts, dann alles" | Spieler brauchen Mentorin/Tooltips, um die Latenz zu verstehen |
| **T4: Entdeckungs-Blowback (Wahrscheinlichkeit × Schaden × Eskalation)** | Verdeckte Aktionen tragen Chance auf Aufdeckung; Aufdeckung hat eigenes Preisschild (Casus Belli, −75 Success, Impeachment, Mr. Garcia) | Civ 6 (Spy Discovery), CK3 (Secrecy), Suzerain (ACP-Eigenexposition), Floor 13 | Einziger ehrlicher Preis für Geheim-Operationen | RNG-Frust ohne Telemetrie (Chancen müssen sichtbar sein, Civ-6-Briefing!) |
| **T5: Einbahnstraße / Linien-Flag (Irreversibilität + Endabrechnung)** | Manche Stufen sind nicht zurücknehmbar oder markieren die Partie dauerhaft (Hope→Obedience, Crossing the Line, Golden Path verloren) | Frostpunk, CK3 (Tyranny-Zerfall 0,25/Monat als *teilweise* reversible Variante) | Moralisches Gewicht; „Exit kostet mehr als Eintritt" wird Existenzfrage | Unfair-Gefühl bei fehlender Vorwarnung (Frostpunk-Debatte!) |

**Querschnitts-Befunde** (über alle Typen):

1. **Asymmetrie ist die Norm**: Öffnen billiger als Schließen (D4 Press Freedom 10/30), harte Maßnahmen leichter abbaubar als aufbaubar (Detention 50/16) — die *Richtung* der Asymmetrie trägt die politische Aussage. Staatsräson muss pro Maßnahme entscheiden, welche Richtung realistisch ist (TR-Realität: Zensur aufbauen war 2015–2020 billig, Abbau wäre heute teuer → bei uns: Einführung mittel, **Rückbau teuer**, plus RSF-/EGMR-Beobachtung).
2. **Wer jubelt, ist immer eine Minderheit**: D4 belohnt nur Patriots; Tropico nur Militarists (+30) bei −15 für *alle anderen*; CK3 erzeugt Dread (kein Jubel, nur Schweigen). Kein ernstes Spiel lässt die Mehrheit für Repression jubeln — das wäre Propaganda, keine Simulation.
3. **Die Gegenmaßnahme existiert immer**: D4 „besänftige die Ursprungsgruppe"; Tropico „Policy of Detente" (50 % der Rebellen kehren zurück); Rebel Inc. Anti-Corruption-Teams; Frostpunk Faith-Pfad als Alternativ-Architektur. Kontrolle darf nie die einzige Antwort auf das Problem sein, das sie löst.
4. **Der Apparat hat Eigeninteressen**: Beholder (Ministerium bestraft nur Gemeldetes), Suzerain (SSP gehört faktisch Lileas Graf), Floor 13 (Mr. Garcia), CitK (KGB als Fraktion mit eigener Agenda). Ein Geheimdienst ohne Eigenleben ist ein Gratis-Werkzeug — unrealistisch und langweilig.
5. **Sichtbarkeit ist eine Design-Entscheidung mit Preiswirkung**: D4 versteckt Security/Terrorism; Civ 6 zeigt Erfolgs-/Entdeckungs-% im Briefing; Frostpunk macht die Linie unsichtbar (und erntet dafür Kritik UND Ruhm). Für Staatsräson: **Risiken sichtbar, Bilanzen versteckt** — Entdeckungschancen im Briefing (Civ 6), das Linien-Konto nur über Mentorin-Andeutungen (Frostpunk/Suzerain).

### 14b. Das dreistufige Kontroll-Modell für Staatsräson

Empfehlung: Jede Kontrollmaßnahme (Gesetz, Erlass, Edikt-artige Sicherheitsanweisung, Medien-Eingriff, Geheimdienst-Operation) bekommt drei explizite Preis-Komponenten:

**(a) Einführungspreis** — sofort, sichtbar:
- Politisches Kapital (bestehend; Erlass = Doppelpreis existiert), ggf. Parlamentsstimmen (301) oder Verfassungsrang (AYM-Anfechtungsrisiko je Sitze-Stand).
- Einmal-Effekt auf 1–2 Wählergruppen (D4-Muster: Liberale-Äquivalent sofort −, Patrioten-Äquivalent sofort +) — über unsere 11-Gruppen-Ursachenketten.
- Bei Geheim-Operationen: stattdessen **Geheimhaltungs-Aufwand + Entdeckungs-Briefing** (Civ-6-Form: Erfolg % / Entdeckung % / Preisliste bei Entdeckung).

**(b) Laufender Unterhalt** — pro Monat, teils verdeckt:
- Legitimitäts-Drain klein aber konstant (Tropico-Standing-Analog; bei uns: 4D-Beziehungsmatrix EU/USA-Dimension „Werte" sinkt schleichend; RSF-Score wandert → Rangliste-Event 1×/Jahr als sichtbarer Tropfen).
- Medien-Modi: Propaganda-Modus senkt Pressefreiheit und die **Korruptions-Enthüllungsrate** (Rebel-Inc.-Multiplikator; D4-x^6-Kurve) — der unsichtbarste und teuerste Unterhalt.
- Risiko-Caps füllen sich: Protest-Radikalisierung (D4-Civil-Uprising-Kanten), EGMR-Akten (22.566 anhängig als Bestandsgröße!), Haft-Überfüllung (142 % → Haftrevolte-Event existiert schon).

**(c) Exit-Preis** — beim Zurücknehmen, *höher als (a)*:
- PC-Multiplikator **1,5–2× der Einführung** (D4-Asymmetrie umgekehrt zur realen TR-Richtung), plus **Cynicism-Grudge** (D4: Flip-Flop-Strafe) auf beiden Seiten: Die einen sehen Verrat, die anderen trauen dem Rückbau nicht (Hysterese-Regel: „Situationen haben Momentum").
- Glasnost-Stapel (CitK-Muster): Öffnung entlädt das Aufklärungs-Backlog als Skandal-Serie — Rückbau kostet kurzfristig MEHR Meinung als der ursprüngliche Aufbau.
- Institutionen-Gedächtnis: Einmal gleichgeschaltete AYM-/HSK-Sitze kehren nicht zurück (Richter haben Amtszeit) — Exit ist hier *generational* (CK3-Tyranny-Zerfall als Vorbild: 0,25/Monat-Abklingen = ~33 Monate für volle Rückbildung eines Rufs).
- Bei Einbahn-Stufen (Notstand-Endstufe, Todesstrafe-Wiedereinführung, Sender-Schließung): Linien-Konto-Eintrag (Frostpunk) + internationale Rote-Linie-Flags, die bestehende Verträge/Ausstrahlung tangieren.

### 14c. Zahlenrahmen (Kalibrierungs-Vorschlag, alle Werte = Spielparameter, keine Tatsachen)

Bezugsgrößen: PC-Start 60, Einkommen ~3,5/Monat, Max 150, Überziehung −20; Legitimität 0–100 (Sturz < 25 über 6 Monate); RSF-Score 27,94 (Rang 163/180); Beziehungs-Dimension „Werte/Rechtsstaat" EU 0–100.

| Maßnahme (Beispiel) | (a) Einführung | (b) Unterhalt/Monat | (c) Exit |
|---|---|---|---|
| Internet-Sperrgesetz (Stufen: Einzelfall → Plattform → Drosselung → Sperrregister) | 8/14/22/30 PC je Stufe (D4: Internet Censorship ~Raise-Bereich) | RSF-Score −0,3/−0,8/−1,5/−2,5; Jugend-Gruppe −0,5/Monat; Tech-/FDI-Knoten −leicht (D4: −Technology) | 1,5× Stufen-PC + Aufklärungs-Stapel 2–4 Events + Cynicism-Grudge 6 Monate |
| Ausnahmezustand (REC-2) | 20 PC + Parlament 301 (oder AYM-Deal: Geheimhaltung 15) | Legitimität −0,4; EU-Werte −0,6; Wirtschafts-Knoten −0,2 (Tourismus/FDI); Blocker aus = Nutzen | Parlament-Widerruf möglich (Suzerain-Votum); Abgewöhnung 6–12 Monate „Rückstellungs-Rechnung" (MIL-2-Prinzip) |
| Sender-/Zeitungs-Schließung | 12 PC + Justiz-Interaktion (AYM-Anfechtung) | RSF −2; Umfrage-Fehler +3 % (Blindflug!); Korruptions-Enthüllungsrate ×0,9 | 2× PC; Wiedereröffnung erzeugt Märtyrer-Medium (Blowback-Event); Linien-Konto +1 |
| MİT-Operation (Überwachungspaket / Desinfo / Kompromat) | Geheimhaltung 8–15 je Tiefe + Briefing (Erfolg 60–85 %, Entdeckung 10–30 %) | Geheimhaltung-Regeneration blockiert teils; Apparat-Vertrauen ± | Entdeckung: Beziehung −10 bis −20 (Zielland), EU-Werte −5, Rote-Linie-Flag; Gefangenen-/Personal-Folgekrise (Civ-6-Handel) |
| Haft-Verschärfung (Prison Regime → Harsh) | 6 PC (D4: kostenlos bis 18) | Haftauslastung +0,3 %/Monat (142 % → Revolte-Schwelle); EGMR-Akten +200/Monat | 1,5× + Richter-Trägheit (Effekt läuft 12 Monate nach — Inertia) |
| Anti-Korruptions-Kommission (Suzerain-ACP) | 10 PC + Justiz-Budget | löst 1–2 fremde Affären; eigene offene Affären: Entdeckungswurf je Quartal | kein Exit nötig — aber Abbau = Verdachts-Event („warum jetzt?") |

**Balancing-Regeln dazu**: (1) Keine Kontrollmaßnahme ohne mindestens eine **Gegenmaßnahme ohne Kontroll-Charakter** (Beschwichtigung, Reform, Amnestie — Tropico Detente als Skript-Vorlage). (2) Unterhalt darf nie größer wirken als die Summe aus Einführung über 24 Monate, sonst fühlt sich T2 als Abzocke (Faustregel aus D4/Tropico-Verhältnissen abgeleitet). (3) Jede Einbahn-Stufe braucht eine **Warnung in eigener Sprache** (Frostpunks „Some people will feel compelled to fight this law. Some of them will die.") — Mentorin oder Justizminister sagt sie aus. (4) Linien-Konto erscheint vollständig nur im Geschichtsbuch am Amtsende — nie als Live-Balken (Frostpunk-Lektion: Live-Balken macht Moral zum Optimierungsziel).

---

## 15. Top-15-Übernahmen

Sortiert nach Wert/Aufwand (Wert = Design-Hebel für Staatsräson, Aufwand S < 1 Tag, M = 1–3 Tage, L > 3 Tage). Verweise auf vorhandene Plan-IDs.

| # | Übernahme | Quelle | Wert | Aufwand | Dockt an |
|---|---|---|---|---|---|
| 1 | **Pressefreiheit-Regler mit x^6-Korruptions-Enthüllung + Entdeckungs-Malus auf Geheimoperationen** (Auftraggeber-Beispiel, mechanisch exakt) | D4 1.1 + Rebel Inc. 12 | sehr hoch | M | REC-4, Geheimhaltung, Korruptionsregeln |
| 2 | **Preis-Asymmetrie als politische Aussage** (Einführung/Unterhalt/Exit je Maßnahme, Exit 1,5–2× + Cynicism-Grudge + Glasnost-Stapel) | D4 1.1/1.2, CitK 8 | sehr hoch | M | Gesetz/Erlass, REC-2 |
| 3 | **Medien als steuerbare Akteure mit Modi** (unabhängig/regierungsnah/Propaganda; 25 %-Conversion-Analog; Sättigung je gleichgerichtetem Kanal; Zielgruppen-Matrix TV/Online) | Tropico 6 2.2 | sehr hoch | M–L | REC-4, UI-1 (Zeitung) |
| 4 | **Zensur als Ergebnis-Dämpfer mit Flag** („media censored" multipliziert Event-Schaden; schützt nicht vor Verfahren) | Suzerain 3.1 | hoch | S–M | Ereignismotor, Umfrage-Fehler |
| 5 | **Ermittlungs-Instrument prüft das eigene Konto** (ACP-Regel: Kommission löst fremde Affären, würfelt auf eigene) | Suzerain 3.2 | hoch | M | Korruptionsregeln (4 Affären), Justiz |
| 6 | **Entdeckungs-Briefing für jede Geheimoperation** (Erfolg % / Entdeckung % / Preisliste bei Entdeckung: Beziehung, Casus-Belli-Flag, Personal-Krise) | Civ 6 9 | hoch | M | MIL-5, Geheimhaltung, Verhandlungstisch |
| 7 | **Dread/Einschüchterung als eigenes Konto mit Schwellen** (+20/+45-Logik: eingeschüchterte Akteure verzichten auf Gegenaktion; driftet zurück; blockiert weiche Ressourcen) | CK3 10 | hoch | M | PERSONEN, Partei (INN-7), Militär |
| 8 | **Repressions-Policies als Inputs in die Situation, die sie bekämpfen** (Racial-Profiling-Kante: direkte Senkung, indirekte Erhöhung über Spannung) | D4 1.3/1.5 | hoch | S–M | Politiknetz (INN-1 Kantenformel), GTI-Knoten |
| 9 | **Linien-Konto + Endabrechnung im Geschichtsbuch** (kein Live-Balken; Warnung in eigener Sprache; „Golden Path" als stiller Erfolg) | Frostpunk 4 | hoch | S–M | Bilanz/Geschichtsbuch, REC-2 |
| 10 | **Apparat mit Eigeninteressen** (MİT-Chef als Figur; zu viele Operationen → Leck/Denunziation von innen; „Mr. Garcia"-Immunsystem) | Floor 13 13.1, Suzerain 3.2 | hoch | M | MIL-5, PERSONEN, Geheimhaltung-Verfall |
| 11 | **Haken aus Geheimnissen, zweistufig** (schwach = einmalig/10 Jahre; stark = wiederholbar + **blockiert feindselige Aktionen**; Entdeckung −75) | CK3 10 | mittel–hoch | M | REC-3, Stimmenkauf |
| 12 | **Radikalisierungs-Kette mit Besänftigungs-Alternative** (Gruppe → Pressure Group → Terror; Besänftigung der Ursprungsgruppe als bester Preis) | D4 1.3 | mittel–hoch | M | 11 Wählergruppen, GTI |
| 13 | **Deutungs-Chunks bei Ermittlungen** (Präsident wählt Beweis-Deutung; falsche Deutung = Justizirrtum-Event mit Spätfolgen) | Orwell 6 | mittel | M | Justiz-Ereignisse, Lernkonzept |
| 14 | **Amnestie/Deeskalation als Kaufoption** („Policy of Detente": 50 % der Radikalisierten kehren zurück, konservative Gruppe −15, langer Cooldown) | Tropico 6 2.1 | mittel | S | Ereignismotor, Lösung für Protest-Spiralen |
| 15 | **Citation-System für Sicherheits-Durchsatz im Notstand** (Fehlerquote: falsche Festnahme = EGMR-Ticket + Legitimität; Durchsatz vs. Genauigkeit vs. Verwaltungskraft) | Papers Please 13.2 | mittel | S–M | REC-2, Verwaltungskraft (REC-5) |

Knapp nicht in den Top 15 (Ersatzbank): Tropicos „Early Elections"-Timing-Spiel (haben wir als 360-Stimmen-Regel schon); Westports Redakteure-mit-Grenzen (Teil von Nr. 3); Not for Broadcasts Schlagzeilen-Wahl nach Großereignissen (Teil von UI-1); Civ-6-Gefangenen-Handel als Verhandlungsklausel (Teil von Nr. 6); Beholders „Überwachung erzeugt Akten" (Teil von Nr. 10).

---

## 16. Unsicherheiten

1. **D4-Koeffizienten-Stichtag**: Die Pressefreiheit-Gleichungen stammen aus einem Foren-Post vom Januar 2022 (von cliffski nicht widersprochen, aber bewusst als Balance-Beschwerde gerahmt); spätere Patches können Koeffizienten geändert haben. Die PC-Preise der Policies stammen aus dem Democracy-Wiki (D3-/D4-Mischbestand; Wire Tapping ist explizit D3). **Empfehlung: echten D4-Datendump ziehen** (Spiel besitzen → `policies.csv`/`simulation.csv`), bevor wir unsere Zahlen final kalibrieren — steht schon als Gap in RECHERCHE_NOTIZEN_MECHANIKEN/democracy4.md.
2. **„Press Muzzling" existiert in D4 nicht** als Situation; die Funktion decken Media Monopoly (senkt Democracy) und Fake News (treibt Racial Tension) ab — falls der Auftraggeber eine bestimmte Textstelle meinte, ist das zu klären.
3. **Crisis in the Kremlin 2017 / Ostalgie**: Kein erreichbares Wiki mit Regler-Zahlen; die Mechanik-Beschreibungen (Wahlmanipulation, Propaganda-Anpassung, Politbüro-Votum) beruhen auf Store-Texten, TV Tropes und Community-Threads — Details als **[unverifiziert]** behandeln.
4. **Power & Revolution**: Pressefreiheits-Index als spielbare Modellgröße ist plausibel, aber in dieser Runde nicht aus einer Wiki-Quelle verifiziert — als **[unverifiziert]** markiert; die offizielle Feature-Liste (Counter-Spy-Budget, Martial Law, Ausnahmezustand) ist belegt.
5. **Suzerain-Zahlen** (PO −3/−10, +1/0/−10) stammen aus einem Community-Walkthrough (Neoseeker) mit exakten Flag-Bedingungen — als zuverlässig eingestuft, aber ohne Entwickler-Bestätigung.
6. **Tropico-6-Edikt-Werte** variieren teils je nach Patch/DLC; die zitierten Tabellen entsprechen dem aktuellen Fandom-Wiki-Stand (2026).
7. **Frostpunk „Crossing the Line"-Auslöser**: Offiziell Wiki-belegt sind Pledge of Loyalty/Forceful Persuasion (Order) und Protector of the Truth/Righteous Denunciation (Faith); Community-Debatten zeigen Unschärfe bei Randfällen (Temple, Prison) — für unser Linien-Konto: Schwelle lieber explizit designen als von Frostpunk abzulesen.
8. Alle Zahlenrahmen in 14c sind **Kalibrierungs-Vorschläge aus den Vorbild-Verhältnissen abgeleitet**, keine gemessenen Werte — sie müssen den WIR-1-/ZEI-4-Testlauf durchlaufen.

---

*Ende der Vertiefung. Schwesterbände: RECHERCHE_VERTIEFUNG_MACHT_KAPITAL.md (Währungen: Geheimhaltung, Haken, Dread bereits als Währungen behandelt — dieser Band ergänzt die Kontroll-Mechaniken und deren Preisarchitektur).*
