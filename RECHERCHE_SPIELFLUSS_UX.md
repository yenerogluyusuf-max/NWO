# RECHERCHE: Spielfluss und Spielgefühl

**Was macht ernste, langsame Strategiespiele flüssig und gut spielbar statt zäh?**

Stand: 30. September 2026. Ergänzt (und dupliziert nicht) `VERBESSERUNGSPLAN_2026-09-30.md` und `ANALYSE_SPIELBARKEIT_2026-09-29.md`: Der Plan sagt bereits *was* gebaut wird (ZEI-1 Ereignis-Wettbewerb, ZEI-3 Sitzungsbogen, UI-1 Zeitung, UI-2 kausale Tooltips, INN-2 Implementierungsbalken); diese Recherche liefert die *externe Evidenz* dafür, warum genau diese Dinge den Unterschied zwischen „Simulation" und „gut spielbar" ausmachen, plus einen konkreten Tages-/Sitzungsrhythmus („Der flüssige Tag", Kapitel 6).

Methode: Web-Recherche (Designer-Interviews, Dev Diaries, GDC-Berichte, Reviews, Metacritic-/Steam-User-Reviews, Steam-Achievement-Statistiken, Reddit-/Foren-Diskussionen, eine ACM-Studie). Quellen je Abschnitt am Ende des Abschnitts; Gesamtverzeichnis in Kapitel 8. Quellen sind markiert mit **[Q]**. Einschätzungen und Übertragungen sind als solche erkennbar (keine Quelle = unsere Ableitung).

---

## Inhaltsverzeichnis

1. Leitbefunde (Zusammenfassung in 10 Sätzen)
2. Feld 1 — Pacing & Sitzungsbogen
3. Feld 2 — Informations-Architektur
4. Feld 3 — Reibungs-Verluste (friction) konkret im Genre
5. Feld 4 — Spielgefühl & Belohnungs-Rhythmus
6. Feld 5 — Onboarding & Lernkurve ohne Tutorial-Festung
7. **Der flüssige Tag** — Design-Vorschlag für den Spielrhythmus von Staatsräson
8. Top-15-Maßnahmen (Wert/Aufwand)
9. Unsicherheiten und offene Fragen
10. Quellenverzeichnis

---

## 1. Leitbefunde

1. **Abschlussquoten sind niedrig, aber der Abbruchpunkt ist der Anfang, nicht die Länge.** Bei Suzerain beenden 91,2 % der Steam-Spieler den Prolog, aber nur 52,6 % Kapitel I — und wer Kapitel I geschafft hat, beendet zu ~70 % die Partie (Kapitel IV: 36,8 % aller Spieler). Die erste Stunde entscheidet, nicht die zehnte. **[Q: Steam-Achievements Suzerain]**
2. **„One more turn" ist kein Zufall, sondern Architektur:** viele kleine, sich überlappende Countdowns (Wunder fertig in 4 Runden, Fokus fertig in 70 Tagen), sodass immer genau *eine Sache* kurz vor dem Abschluss steht. Sid Meiers GDC-Grundsatz: „You cannot reward and reflect progress too much." **[Q: GameSpot/Wired/Situated Research, GDC 2010]**
3. **Echtzeit-Pause-Spiele leben von der Garantie „Vorspulen endet immer bei etwas Interessantem"** — und sterben an Pausen ohne Entscheidung (unser eigener Befund vom 29.09.: die Zinssitzung als Pause war „das Einzige, das passiert, und das Uninteressanteste"). HOI4-Spieler klagen über 70-Tage-Fokusse, die „einfach warten" bedeuten. **[Q: r/hoi4; HOI4-Wiki]**
4. **Die „nested tooltip"-Revolution (CK3, 2020) hat die Lernkurve des Genres demokratisiert:** Erklärung dort, wo die Frage entsteht, beliebig tief stapelbar, ohne das Spiel zu verlassen. Victoria 3 hat das System direkt übernommen. Das ist die einzeln meistgelobte UI-Innovation des Genres der letzten Jahre. **[Q: The Verge, PCGamer, VG247, PCGamesN]**
5. **Alert-Design ist Mengenlehre:** Meldungen, die sich stapeln, werden ignoriert (Victoria-3-Launch-Kritik: „endless deluge of pop-ups … made me ignore pop-ups altogether"); Meldungen, die priorisiert sind und direkt zur Entscheidung führen, werden gelobt (Tropico 6: „alerts … don't stack up so you don't know what's important"). **[Q: Metacritic-User-Reviews Vic3; Skeezix-Blog Tropico 6]**
6. **Das Suzerain-2.0-UI-Debakel ist der teuerste UI-Fehltritt des Genres:** Torpor baute die PC-Oberfläche auf Mobile-Tauglichkeit um und erntete einen Shitstorm („seems as if the UI has been revamped for something like a mobile game"); erst Patch 2.0.4 mit weniger Benachrichtigungen und altem Schriftbild beruhigte die Lage. Lehre: Informationsdichte und Immersion der Desktop-Spieler nicht der Einheitlichkeit opfern. **[Q: Steam-Diskussion „Thoughts on the new UI"; r/suzerain]**
7. **Belohnung in langsamen Spielen = sichtbarer Abschluss + Inszenierung.** HOI4-Fokus-Ping nach 70 Tagen, Civ-Wunderfilm, Tropico-6-Panorama nach Missionsende. Umgekehrt erzeugt Vic3s „Bauqueue beobachten und alle 3 Minuten die Produktionsmethode prüfen" die berühmte Midgame-Leere. **[Q: Metacritic Vic3; HOI4-Wiki; Niche Gamer/Hey Poor Player Tropico 6]**
8. **Delegation funktioniert nur mit Preis und Profil, nie als kostenloser Autopilot.** Supreme Ruler (seit 2005!) delegiert Ressorts an Kabinettsminister mit eigenen Prioritäten; Vic3s autonomer Investitionspool wurde erst gefeiert, dann als Designbruch diskutiert („breaks the Investment Pool design"). **[Q: IGN/GameSpot/Manual Supreme Ruler; Paradox DD #71; r/victoria3]**
9. **Mentorfiguren wirken, wenn sie (a) auf Anfrage statt per Push sprechen, (b) im Moment der Relevanz erscheinen, (c) verschwinden dürfen.** Das Clippy-Anti-Muster (unaufgefordert, generisch, nicht abschaltbar) ist in der Forschung und in der Praxis (WoW-Crabby-Parodie, Civ-Advisor-Kritik) gut dokumentiert. CK3: „you'll learn about bringing up a child only when you have one." **[Q: TheGamer CK3; Engadget; diva-portal-Studie]**
10. **Re-Entry ist ein ungelöstes Genre-Problem und eine Chance.** Die einzige akademische Studie dazu (ACM 2021) zeigt: kaum ein Spiel hilft beim Wiedereinstieg in einen alten Spielstand; Witcher-3-Ladescreen-Zusammenfassungen sind die Ausnahme. Wer eine 20-Stunden-Partie nach drei Tagen Pause nicht mehr versteht, bricht ab. Unser Schreibtisch + Chronik können das besser als alle Referenzspiele. **[Q: ACM Digital Library, Hammad 2021]**

---

## 2. Feld 1 — Pacing & Sitzungsbogen

### 2.1 Zeitmodelle der Referenzspiele im Vergleich

| Spiel | Zeitmodell | Struktureinheit | Partie-Länge (typisch) | Pacing-Instrument |
|---|---|---|---|---|
| **Suzerain** | diskret | Prolog + **12 Turns à 4 Monate** + Epilog + Bilanz (4 Jahre Amtszeit) | **11,5 h** Hauptspiel, 36,5 h komplett (HowLongToBeat) | Feste Dramaturgie: jeder Turn hat Pflicht-Beats (Haushalt, Verfassung, Wahl); kein freies Vorspulen |
| **Democracy 4** | rundenbasiert | 1 Zug = 1 Quartal; Politisches Kapital je Zug (Maximum = 2× Quartalseinkommen, zwingt zum Ausgeben) | endlos; Ende nur durch Abwahl oder Attentat | Kapital-Knappheit je Quartal erzwingt Priorisierung; Minister erzeugen Kapital |
| **HOI4** | Echtzeit, pausierbar | Stunden-Ticks; **5 Geschwindigkeiten + Pause**; Fokus = **70 Tage** (70 PP à 1/Tag) | 8–10 h je Kampagne (Community-Schätzung); Tag ≈ 3,5 s auf Maximal-Tempo (Steam-Deck-Messung, 1939) | Fokus-Countdown als Herzschlag; Alert-Reihe oben; Pause jederzeit erlaubt |
| **Civ 6** | rundenbasiert | 1 Zug; Rundenlänge variabel (Schnell … Marathon) | 20–40 h je Partie | „One more turn": überlappende Countdowns (Wunder, Tech, Einheit fertig) |
| **Crusader Kings 3** | Echtzeit, pausierbar | Tages-Ticks; 5 Tempi + Pause; Partie 867–1453 möglich (586 Jahre ≈ 213.890 Ticks) | praktisch nie „beendet"; Spieler setzen eigene Ziele | „One More Crisis Syndrome" (PC Gamer): immer brennt irgendwo etwas |
| **Victoria 3** | Echtzeit, pausierbar | 4 Ticks/Tag; 1836–1936 (≈ 146.000 Ticks) | Kampagnen-Ende erreichen fast keine Spieler (Paradox-Forum: „people hardly ever reach the end of the campaign in any PDX game at all") | Bauqueue + Diplomatic Plays als Taktgeber; Linsen-Wechsel |

**Muster:** Es gibt zwei erfolgreiche Grundmodelle — (a) **diskrete Dramaturgie** (Suzerain, D4): die Zeit ist knapp und jedes Intervall hat Pflicht-Entscheidungen; (b) **fließende Zeit mit Herzschlag** (HOI4, CK3, Vic3, Civ): die Zeit ist reichlich, aber ein System aus Countdowns, Alerts und Schwellen erzeugt künstliche Knotenpunkte. Staatsräson (pausierbare Tage, 5 Jahre) gehört zu (b), braucht also *künstliche Knotenpunkte* — genau das, was die Analyse vom 29.09. als fehlend diagnostiziert hat („nichts rückt näher").

### 2.2 Die Suzerain-Trichter-Statistik (Steam-Achievements, abgerufen 30.09.2026)

Globale Freischaltquoten (Anteil aller Besitzer):

| Station | Achievement | Quote |
|---|---|---|
| Prolog abgeschlossen | „Prologue: Rise to Power" | **91,2 %** |
| Kapitel I abgeschlossen | „Chapter I: President Rayne" | **52,6 %** |
| Kapitel II | „Chapter II: A New Sordland" | 45,5 % |
| Kapitel III | „Chapter III: Victim of Changes" | 40,0 % |
| Kapitel IV abgeschlossen (≈ Partie zu Ende gespielt) | „Chapter IV: Checkmate" | **36,8 %** |
| Verfassung geändert (Midgame-Großprojekt) | „The Constitution of '56" | 27,4 % |
| 10 Gesetze unterschrieben | „Lawmaker" | 22,7 % |

Lesart:

- **42 % aller Spieler, die den Prolog beenden, brechen innerhalb von Kapitel I ab** (91,2 → 52,6). Der Übergang von der geführten Vorgeschichte in die offene Präsidentschaft ist der kritische Punkt — dort muss das Spiel zeigen, *was man tut und warum es sich lohnt*.
- Wer Kapitel I übersteht, bleibt: 52,6 → 36,8 = **70 % Durchhaltequote über vier Kapitel**. Das Kernspiel trägt; der Einstieg ist die Baustelle.
- Ein Großprojekt (Verfassung) erreicht nur gut die Hälfte der Durchhalter (27,4 %): lange Vorhaben brauchen eigene Dramaturgie, sonst werden sie nicht erlebt.
- HowLongToBeat ergänzt: Hauptspiel 11,5 h; bei 1,5 h/Tag ≈ 11 Tage. Eine Suzerain-Partie ist also faktisch eine **Sitzungs-Serie von ~8–12 Sitzungen à 60–90 Minuten** — das passt exakt zu unserem Designziel 30–60 Min/Sitzung bei etwas längerer Gesamtpartie.

### 2.3 „One more turn"-Psychologie

- Sid Meier, GDC-2010-Keynote „The Psychology of Game Design (Everything You Know Is Wrong)": Spieler wollen **konstanten Fortschritt, keine Berg-und-Tal-Realität** — „Players don't want peaks and valleys, they want constant progress — that's what the Civilization franchise is about. *You cannot reward and reflect progress too much in a game.*" **[Q: Situated Research]**
- Belohnung wird nicht hinterfragt: „When you reward the player, the player gladly accepts it. He doesn't ask, 'Did I deserve that?'" **[Q: GameSpot]**
- Zufall erzeugt Paranoia; nach einem Missgeschick sollten die Chancen verdeckt zugunsten des Spielers gebogen werden („sweeting the odds after a setback"). **[Q: Wired]**
- Der „Winner Paradox": In Spielen gewinnt fast jeder — und niemand beschwert sich. Für ein Härte-Spiel wie Staatsräson heißt das: Härte ja, aber Niederlagen müssen *erklärt und inszeniert* werden, nicht nur numerisch eintreten.
- Zum Ganzen passt Meiers spätere Selbstkritik (2020): „It asks a lot of the player, and takes a while to work it out. You have to play it once in order to understand what's going on." Selbst Civ gilt heute als zu fordernd im Einstieg. **[Q: PC Gamer / The Independent]**
- Ergänzend aus der Motivationsforschung: Spiele liefern „constant feedback, clear goals, and predictable rewards" — das fehlt im echten Leben und ist der Kern der Sogwirkung (Jamie Madigan). Der Zeigarnik-Effekt (offene Aufgaben bleiben mental präsent) erklärt, warum **sichtbare, unvollendete Vorgänge** (Quest-Log, Bauqueue, laufendes Gesetz) binden. **[Q: VICE/Madigan; psychologyofgames.com]**

### 2.4 Der 30–60-Minuten-Sitzungsbogen in einem 5-Jahre-Spiel

Ableitung aus den Daten:

1. **Sitzungs-Länge der Referenz:** Suzerain ≈ 1–1,5 h natürliche Sitzung (HLTB-Tagesschätzung); HOI4-Kampagne 8–10 h in typischerweise mehreren Sitzungen; Paradox-Spieler berichten von 6-Stunden-Nächten („I played nearly 6 hours last night and advanced 20 years"), aber das ist die Hardcore-Spitze, nicht das Designziel. **[Q: Paradox-Forum „Hourly Ticks"]**
2. **Ein Sitzungsbogen braucht Anfang, Mitte, Abschluss.** Civ löst das mit Runden-Eskalation; Suzerain mit Turn-Beats; HOI4 mit Fokus-Abschlüssen. Für Staatsräson liegt der natürliche Bogen im **Tag/Woche**: Morgen-Briefing (Ankommen) → Entscheidungen (Handeln) → Karte (Sehen) → Laufzeit mit Auto-Stopps (Geschehen) → Abend-Chronik (Abschließen, Speicher-Anlass). Ausführlich in Kapitel 7.
3. **Zeitbudget-Rechnung für Staatsräson:** 5 Jahre = ~1.825 Tage = 260 Wochen = 60 Monate. Ziel 30–60 Min/Sitzung und ≥3 bedeutungsvolle Entscheidungen (Tor B des Verbesserungsplans). Bei realistischer Verweildichte (Entscheidungsmomente alle 1–3 Spielwochen) ergibt sich eine Partie von **10–16 Sitzungen à ~45 Min ≈ 8–12 Stunden** — deckungsgleich mit Suzerain (11,5 h) und HOI4 (8–10 h). Das ist belegbar richtig dimensioniert.
4. **Abbruch-Prävention am Anfang:** Nach dem Suzerain-Trichter muss der erste Spieltag (a) drei konkrete, drängende Vorgänge liefern (steht schon in ENTSCHEIDUNGEN E, war 29.09. noch nicht umgesetzt), (b) in den ersten 30 Minuten mindestens eine *spürbare* Wirkung einer eigenen Entscheidung zeigen (Früherfolg), (c) den Zeitrahmen kommunizieren („Sie haben 5 Jahre. Das sind ~60 Monate. Hier ist Ihr Kalender.").

### Übertrag auf Staatsräson (Feld 1)

- **Vorhandene Assets:** Tagesschritte mit 5 Tempi (Pause / ruhig / zügig / schnell / **„bis zum nächsten Ereignis"**, `Stage.tsx`), Auto-Stopps, Staatskalender, 10 Amtsziele, Fortschrittsbilanz/Geschichtsbuch, Schreibtisch-Tagesbriefing (537 Zeilen, `briefing.ts` mit Kennzahlen/Fälligkeiten/Warnungen/Ratschlägen, jeder Eintrag mit Ziel-Knopf), 68 Ereignisvorlagen, 8 Regierungsprogramme (36 Schritte) als Fokusbaum-Analog.
- **Konsequenz 1:** „Bis zum nächsten Ereignis" (Tempo 5) ist unser HOI4-Herzschlag-Äquivalent und sollte das **beworbene Standard-Schnelllauf-Verhalten** sein — es *ist* die Garantie „Vorspulen endet bei etwas Interessantem". Damit das stimmt, muss die Ereignis-Definition von „Stopp" breit sein: nicht nur Popup-Ereignisse, sondern auch Fälligkeiten, Schwellen-Crossings, Vorgangs-Abschlüsse (s. Auto-Stopp-Taxonomie, Kap. 7.5).
- **Konsequenz 2:** Die 8 Programme (36 Schritte) sind unser Fokusbaum: Jeder Programm-Schritt braucht **sichtbaren Fortschritt mit erwartetem Abschlussdatum** (HOI4-Fokus-Muster: 70-Tage-Balken). Aktuell unsichtbarer Baum (Plan-Befund 3.5, INN-Sektion).
- **Konsequenz 3:** Kapital-Taktung wie D4 übernehmen: Unser Politisches Kapital mit Überziehung existiert; fehlt die *Kommunikation* des Rhythmus („Diesen Monat kommen X Kapital dazu — Y ist verplant"). D4s Deckel (max 2× Einkommen) verhindert Horten und erzeugt Ausgabedruck; prüfen, ob unser Kapital-Hort-Problem existiert (Telemetrie ZEI-3).
- **Konsequenz 4:** Sitzungs-Messung konkretisieren (ZEI-3): Eine Sitzung zählt als „gelungen", wenn ≥3 Entscheidungen mit Konsequenz UND ≥1 sichtbarer Abschluss (Fertigstellung, Abstimmung, Gespräch mit Ergebnis) passiert sind. Dev-Telemetrie schreibt Sitzungsbögen als CSV (passt zum Balance-Dashboard aus Plan §7.4).

**Quellen Feld 1:** Steam-Achievement-Statistik Suzerain (steamcommunity.com/stats/1207650/achievements); HowLongToBeat Suzerain (howlongtobeat.com/game/83906) und Kingdom of Rizia (/game/148118); Suzerain Wiki, „Turn" (suzerain.fandom.com/wiki/Turn); Neoseeker-Walkthrough (Kapitelstruktur); Sid Meier GDC 2010 (gamespot.com/articles/meier-on-crafting-the-epic-journey…/1100-6253256; wired.com/2010/03/sid-meier-gdc; situatedresearch.com/2010/03/gdc-sid-meiers-lessons-on-gamer-psychology); PC Gamer zu Meier 2020 (pcgamer.com/sid-meier-doubts-he-could-make-civilization-today…); VICE zu Belohnungssystemen/Madigan (vice.com/en/article/when-your-day-job-is-also-your-favorite-video-game); HOI4-Wiki „National focus" und „User interface" (hoi4.paradoxwikis.com); r/hoi4 zu 70-Tage-Fokussen (reddit.com/r/hoi4/comments/1dupa1w/…, /8fwfcm/…); Paradox-Forum „Hourly Ticks" (Tick-Zahlen, Kampagnenlängen) und „Playing HOI4 on Steam Deck" (3,5 s/Tag); r/Democracy4 „Political capital maximum"; Steam-Guide „Democracy 4 Basic Gameplay"; southwestshadow.com zu D4-Ende.

---

## 3. Feld 2 — Informations-Architektur

### 3.1 Die „nested tooltip"-Revolution (CK3, 2020)

Das Muster des Jahrzehnts im Genre:

- **Mechanik:** Jeder farblich markierte Begriff in jedem Text/Tooltip öffnet bei Hover einen Kurz-Tooltip (75–100 Wörter, Polygon-Messung), in dem wiederum Begriffe markiert sind — beliebig tief stapelbar („tooltips inside tooltips"). Dazu eine durchsuchbare Enzyklopädie und ein jederzeit abrufbares Tutorial-Menü. **[Q: Forbes/Polygon; PC Gamer; The Verge]**
- **Designer-Begründung (UI-Designerin Wickerström bei The Verge):** Frühere Paradox-Tooltips wurden riesig, weil alles in einen Tooltip musste („the tooltips got very big"), bis jemand fragte: „Why can't I just move my mouse inside the tooltip?" Effekt laut Verge: „you can functionally teach yourself all the gameplay terminology you need without ever leaving the program." **[Q: The Verge]**
- **Programmierer Matthew Clohessy:** Ziel war, dass die Schwierigkeit aus Strategie entsteht, „instead of things like looking for a number you need, bringing up the tooltip to get some information, or googling what a particular term means". **[Q: Gamepressure]**
- **Rezeption:** PC Gamer: „Even the tooltips have tooltips … like stepping through a portal into a dimension constructed purely out of tips." bigbossbattle: „one of the smartest ways that a game has reminded me of its mechanics as gameplay continues — 4X games could definitely learn something from it." Victoria 3 hat das System explizit übernommen, damit Spieler „kein Wirtschaftsstudium" brauchen. **[Q: PC Gamer; bigbossbattle; PCGamesN]**
- **Wichtiges Detail (Konsole):** Auf der PS5/Xbox-Portierung sind gerade die verschachtelten Tooltips der Schmerzpunkt — das Muster ist mausgetrieben. Für uns (Desktop-first) kein Problem, aber eine Markierung der Grenze. **[Q: TheGamer]**

### 3.2 Linsen und Ebenen (Civ 6, Vic3) — und unsere 11 Ebenen

- **Civ 6 Lenses:** neun Karten-Überlagerungen (Appeal, Continent, Government, Political, Religion, Settler, Tourism, Empire, Loyalty). Entscheidend: **Auto-Aktivierung im Kontext** — Distrikt-Platzierung aktiviert die Platzierungs-Lens, Siedler-Auswahl die Siedler-Lens (grün = Frischwasser, grau = keins, rot = unbesiedelbar). Die Lens erscheint *im Moment der Entscheidung*, nicht im Menü. Civ 7 baut das weiter aus (Radial-Ruler-Overlay zum Zählen von Kachel-Abständen). **[Q: Civilopedia; palain.com; 2K-Update-Notes]**
- **Victoria 3:** fünf Linsen als untere Leiste (Produktion, Politik, Diplomatie, Militär, Handel) — die Linse ist gleichzeitig **Handlungsmodus**: Bauen, Dekrete, Diplomatie laufen über die jeweils aktive Linse. Rechts daneben der **Outliner**: automatisch angepinnte „Situationen" (Gesetz im Gang, Diplomatic Play, Revolution im Anzug) plus manuell anpinnbar; Feed unten rechts mit **konfigurierbaren Message-Settings**. **[Q: Vic3-Wiki „User interface"; Steam-UI-Guide]**
- **HOI4 Drei-Zonen-UI:** oben Lage-Zusammenfassung (PP, Manpower, Stabilität, Weltspannung), links nationale Verwaltung, rechts Militär; **Alert-Reihe oben** („alert tabs will appear at the top of the screen as a warning of things that need attention"). **[Q: HOI4-Wiki „User interface"]**

Gemeinsames Muster: **Ein Bildschirm, viele Bedeutungen — gewechselt per Kontext, nicht per Menü-Tiefe.** Die Information liegt als Schicht *über* derselben Karte, statt in Fenstern *neben* der Karte.

### 3.3 Alerts, Notifications, Alert-Fatigue

- **Victoria-3-Launch (2022) als Negativ-Lehrstück:** „I was receiving an endless deluge of pop-ups for so many countries and events that had no impact or effect on me … it took up a lot of screen space and ultimately made me ignore pop-ups altogether, though some were helpful." Gleichzeitig das Umgekehrte: „it took serious detective work to figure out why I couldn't take an action" — zu viele irrelevante Meldungen UND zu wenig Erklärung bei Blockern. **[Q: Gamecritics-Review Vic3; Metacritic-User-Reviews]**
- **Tropico 6 als Positiv-Beispiel:** „There's a noticeable sound, and they don't stack up so you don't know what's important and what's not (**which is a crime Paradox often commits**). Alert windows generally give you all the information you need to make a decision — there are relatively few instances where you click something without knowing what, exactly, it's going to do." **[Q: Skeezix-Blog]**
- **CK3 Issues-Widget/Suggestions:** oberhalb des Bildschirms eine priorisierte Liste dessen, „was gerade möglich/dringend ist" (Anspruch drückbar, Heirat möglich, Thronfolger außerhalb der Dynastie als härtere Stufe). IGN: „a Suggestions widget as your constant companion"; VICE/Fåhraeus: „a personal assistant … a virtual page". **[Q: Forbes/IGN; VICE; RPS „ten things"]**
- **UX-Fachliteratur bestätigt die Genre-Erfahrung:** Meldungen müssen *actionable* sein (direkter Sprung zur richtigen Ansicht oder Inline-Aktion; IBM-Carbon-Regel: maximal eine Inline-Aktion), an einem konsistenten Ort leben, und granular vom Nutzer konfigurierbar sein — sonst werden sie stummgeschaltet oder ignoriert. **[Q: Eleken; Setproduct]**

### 3.4 Progressive Disclosure und die Blackbox-Frage

- Cliff Harris (Democracy 4) verteidigt Überforderung als Design („Overcomplexity is a feature, not a bug … You are the president and you have a LOT of things to pay attention to") — und verliert damit bewusst einen Teil des Publikums („I definitely lose players, and generate refunds"). **[Q: Cliffskis Blog]**
- Die Quarter-to-Three-Diskussion dazu benennt die Grenze präzise (Forumsteilnehmer TheWombat, gekürzt): „In reality, most people tasked with a job like overseeing a nation's naval program … are going to have tools (or people …) to collate, summarize, present, and interpret all of that data. Making a single player process what an entire staff or even bureau would do is silly." — **Überforderung darf die Rolle simulieren, darf aber nicht die Arbeit des Stabes auf den Spieler abwälzen.** Genau dafür hat Staatsräson den Schreibtisch und die Mentorin. **[Q: Quarter To Three]**
- D4s Stärke trotzdem: Wirkungslinien zwischen Icons (Pfeilgeschwindigkeit = Wirkungsstärke), und jede Politik zeigt auf dem Hauptbildschirm, ob man sie sich leisten kann (GeekTyrant lobt: „you can see what you can afford with each policy instead of clicking into each one"). **[Q: GeekTyrant]**

### 3.5 Re-Entry: „Was ist neu seit meiner letzten Sitzung?"

- **Das Genre hat hier fast nichts.** Die einzige akademische Arbeit zum Thema (Hammad et al., CHI 2021, „Exploring Returns to Long-Term Single Player Games") stellt fest: Es gibt praktisch keine Forschung und kaum Design-Unterstützung für die Rückkehr in lange Spielstände; bekannteste Ausnahme sind Witcher-3-Ladescreen-Zusammenfassungen („akin to 'Previously on…' segments for TV shows"), die aber nur die *narrative* Lage erfassen, nicht den Systemzustand. **[Q: ACM Digital Library]**
- Community-Befund deckt sich: Paradox-Spieler berichten regelmäßig, alte Kampagnen nicht fortzusetzen, weil sie den Überblick verloren haben („played the tutorial, and still had no idea what I was doing" ist die Einstiegsvariante desselben Problems). **[Q: r/paradoxplaza]**
- **Chance für Staatsräson:** Unser Spiel hat mit Chronik, Bilanz und Tagesbriefing schon die drei Rohstoffe für einen **„Previously on"-Bildschirm beim Laden**: (1) drei Sätze Lage (aus Kennzahlen-Deltas seit letzter Sitzung berechenbar), (2) offene Fäden (Fälligkeiten, laufende Vorgänge, Zusagen), (3) „zuletzt beschlossen Sie …" aus dem Beschlussbuch. Kein Referenzspiel kann das; es ist eine billige Alleinstellung (Daten liegen vor).

### Übertrag auf Staatsräson (Feld 2)

- **Tooltips (UI-2 im Plan, hier untermauert):** Unser „Jede Zahl beantwortet Warum" + Treiber-Zerlegung ist technisch schon da; das CK3-Muster heißt: **kurzer Tooltip → verschachtelter Tooltip → Enzyklopärie/Netz**. Konkret: Kennzahlen-Tooltip Ebene 1 = Wert + Trend + Top-3-Treiber; Ebene 2 = Kanten-Warum-Sätze (412 vorhanden!); Ebene 3 = Sprung in den Netz-Graph an die richtige Stelle. Der NetGraph zeigt heute nur 1 Knoten + 8 Nachbarn (Befund 4.3) — als *Vertiefungs-Ziel* von Tooltips ist das ok, als Einstieg nicht.
- **Ebenen als Lenses formalisieren:** Unsere 11 Ebenen (`ebenen.ts`) sind faktisch Civ-Lenses. Fehlt: **kontextuelle Auto-Aktivierung** (Civ-Muster): Bei Baubeschluss → Bau-Ebene mit Standort-Hinweisen; bei Provinz-Klick nach Ereignis → Problem-Ebene; bei Haushalt → Wirtschafts-Ebene. Dazu Plan-Item INF-6 (Platzierungs-Lens) konsistent.
- **Alerts:** Tropico-Regel übernehmen als harte UI-Regel: **Meldungen stapeln sich nie ohne Priorität**; jede Meldung führt per Klick zur Entscheidung (unser `Ziel`-/`Knopf`-System im Briefing macht genau das schon — auf *alle* Meldungen ausdehnen, inkl. `Meldungen.tsx`-Feed); Vic3-Lehre: Blocker müssen ihren Grund nennen („Geht nicht, weil: Koalitionspartner lehnt ab" — CK3-Faktorenlisten-Muster, im Plan für AUS/UI teils vorgesehen).
- **Issues-Widget-Äquivalent:** Die 5 Ratschläge des Tagesbriefings sind unser CK3-Suggestions-Widget. Ergänzen um **Dringlichkeits-Stufen** (normal/dringend, CK3 hat zwei Stufen) und um den Agenda-Fortschritt (ZEI-2, bleibt).
- **Re-Entry-Bildschirm** als neuer Punkt (s. Top-15, Maßnahme 3): Beim Laden einer alten Partie zuerst ein „Stand der Dinge"-Blatt, *bevor* die Zeit weiterläuft.

**Quellen Feld 2:** The Verge „The hellish design of the Crusader Kings video games" (theverge.com/games/23653870/…); PC Gamer CK3-Review (pcgamer.com/crusader-kings-3-review/); VG247 CK3-Preview; Forbes CK3-Preview (Polygon-/IGN-Zitate); Gamepressure (Clohessy-Zitat); bigbossbattle CK3-Review; TheGamer CK3-Console-Review; CK3 Dev Diary #16 (forum.paradoxplaza.com, nur Abstract abrufbar); PCGamesN zu Vic3-Tooltips; Vic3-Wiki „User interface" (vic3.paradoxwikis.com); HOI4-Wiki „User interface" (hoi4.paradoxwikis.com); Civilopedia „Lenses" (civilopedia.net); palain.com Civ-VI-Lenses; 2K Civ-VII-Update-Notes (Radial Ruler); Gamecritics Vic3-Review; Metacritic Vic3-User-Reviews; Skeezix-Blog Tropico 6; Eleken „Notification UX"; Setproduct „Notifications UI design"; Cliffskis Blog „Democracy 4's overcomplexity is by design" (positech.co.uk); Quarter To Three Forum (Rule-the-Waves-3-Thread mit D4-Diskussion); ACM DL 10.1145/3411764.3445357 (Hammad 2021); r/paradoxplaza „My experience with Paradox games as an outsider".

---

## 4. Feld 3 — Reibungs-Verluste konkret im Genre

Was Reviews und Communities an den Vergleichstiteln tatsächlich kritisieren — destilliert nach wiederkehrendem Muster, dann Spiel für Spiel.

### 4.1 Democracy 4 — der „Excel/Icon"-Vorwurf

- Klage: „The main screen of the game, with all those icons, is very hard to get used to." (Reddit-Feedback-Thread) — die berühmte Icon-Wolke ist der Einstiegshügel. **[Q: r/Democracy4]**
- Entwickler-Antwort (Harris): bewusste Designhaltung, „You have to play the game in a different way … go with your gut and make emotional rather than analytical decisions very often because there simply is TOO MUCH data." **[Q: Cliffskis Blog]**
- **Destillat:** Überforderung als *Thema* ist legitim; Überforderung als *Parsing-Problem* (welches Icon ist was?) ist es nicht. D4 wird trotzdem gelobt, weil jede Kante eine Richtung hat und die Kosten sichtbar sind. Für uns: Netz-Graph darf komplex *aussehen*, aber die Einstiegsfrage „Was genau kann ich jetzt tun?" muss in <5 Sekunden beantwortbar sein — dafür sind Ampeln + „was bringt am meisten"-Vorschläge (beide vorhanden) gedacht; sie müssen im UI Vorrang vor der Graph-Optik haben.

### 4.2 Victoria 3 — UI-Tiefe und Mikro-Hölle

- Launch-User-Reviews (Metacritic, User-Score 5,7): „Watching your building queue, and then check your building type config every 3 min. Just urgs." / „Shallow economic gameplay … repetitive, boring, and micro hell." **[Q: Metacritic]**
- Popup-Flut und gleichzeitige Erklärungsarmut bei Blockern (Zitate s. 3.3). **[Q: Gamecritics]**
- Krieg = AFK: „I was able to be AFK for several minutes during major conflicts with no consequence … waiting on some dice rolls to play out." **[Q: Gamecritics]**
- **Destillat:** (a) Wiederkehrende Pflicht-Mikro-Entscheidungen ohne Neuigkeitswert (Produktionsmethoden-Check) sind die reinste Form von Zähigkeit — jede Aktion, die der Spieler alle N Minuten *routine*-mäßig wiederholen muss, gehört automatisiert, delegiert oder abgeschafft. (b) Information *warum etwas nicht geht* ist wichtiger als Information *was alles passiert*. (c) Abstraktion ohne Entscheidung (Krieg) fühlt sich wie Würfel-Warten an — direkt relevant für unser MIL-1-Design (Krieg als politischer Vorgang muss Entscheidungspunkte haben, sonst wird er Vic3).

### 4.3 HOI4 — der Einstieg

- Community-Konsens: Das Spiel lernt man nicht im Spiel, sondern über YouTube, Wiki, Reddit, Freunde. Selbst der offizielle Community-Guide sagt: „I enjoy this game very much but I HATED it when I played my first game — tutorial Italy." **[Q: Steam-Community-Guide „I'm new. What nation should I play?"]**
- Quora-Antwort zum Lernen führt Wiki, Community-Spreadsheets, Multi-Stunden-YouTube-Serien und „Learning path" in 5 Stufen auf — alles *außerhalb* des Spiels. **[Q: Quora]**
- **Destillat:** HOI4 ist das Anti-Modell für Onboarding (Details in Feld 5). Aber: Die enorme Community-Doku zeigt auch, dass Spieler Komplexität verzeihen, wenn die *Fantasie* stark genug ist („incredibly engaging and fun. Especially when you win your first war, very rewarding"). Für uns kein Freifahrtschein — wir haben keine bestehende Fangemeinde, die YouTube-Tutorials produziert.

### 4.4 Suzerain — das 2.0-UI-Debakel (der wichtigste Einzelfall)

Faktenlage (Steam-Diskussion „Thoughts on the new UI", August 2023; r/suzerain-Threads):

- Torpor ersetzte mit 2.0 „Amendment" (31.07.2023) die PC-UI durch eine an Mobile/Switch angelehnte: vertikale Scroll-Bäume statt Horizontal-Übersicht, randlos-schwarze Dialogspalte über den ganzen Bildschirm, vom Porträt gelöste Menüknöpfe, „rubbery scrollbar", zu große Fonts, zu viel Leerraum. **[Q: Steam-Diskussion; RPS]**
- Spieler-Stimmen: „it seems as if the UI has been revamped for something like a mobile game" (Thread-Eröffner); „the immersion suffers a lot with the presentation. the newspaper reports, the laws and other decisions with the graphical style no longer fit the time in which the game is set"; ein Spieler mit Autismus-Spektrum: „the new UI is a LOT more visually overwhelming — especially at the start of Turn II, when the screen is cluttered with bubbles and arrows going every which-way … If Suzerain had looked like this originally, I don't know if I would have bought it." **[Q: Steam-Diskussion]**
- Auflösung: Patch 2.0.4 wenige Wochen später — „the 2.0.4 update has been a vast improvement. On-screen notifications are no longer so chaotic, **thanks in part to there being fewer of them overall**; and having the option to go back to the old sans-serif typeface was much appreciated." **[Q: Steam-Diskussion]**
- **Destillat (vier Lehren):** (1) Desktop-Dichte ist ein Feature — wer für Touch umbaut, verliert die Kernschicht. (2) Immersion hängt an Konsistenz: eine „Zeitung", die aussieht wie eine App, zerstört die Illusion (direkt relevant für unsere Papier-/Messing-Sprache und die geplante Zeitung UI-1). (3) **Benachrichtigungs-Menge ist ein Regler mit Abbruch-Kante** — die Reparatur bestand zuerst aus *weniger* Meldungen, nicht besseren. (4) Options-Rettung: alt/groß, Schrift wählbar — Konfigurierbarkeit entschärft Design-Konflikte.
- Positiv-Seite (was Suzerain richtig macht und Reviews loben): das Schreiben. RPS: „This is a game that had me covering my mouth with disappointment at a betrayal, howling in triumph at cross-examining some legislation, and saying aloud to an imaginary billionaire 'Threaten me again son and I will nationalise your shit'." Figuren mit eigenen Karten und Privatleben; Zeitungen und Berichte spiegeln den Weltzustand in-character. Auch gelobt: kein freies Speichern im Original (Commitment-Zwang; erst 2.0 führte mit dem „Torpor Mode" manuelles Speichern nach dem ersten Durchspielen ein). **[Q: RPS „best game you missed"; RPS 2.0; TheXboxHub]**

### 4.5 Tropico 6 — Alerts gut, Information anfangs dünn

- Gelobt: Alert-Design (s. 3.3), Schreiben und Penultimo-Humor („Penultimo gets all the best lines"), Missions-Abschluss-Panoramen. **[Q: Skeezix; Niche Gamer; Hey Poor Player]**
- Geklagt: Zum Launch fehlte Info, *warum* Gebäude effizient sind und warum man Geld verliert (Revenue-Screen zeigt nur 12 Monate, Schiffe kommen alle 4–6 Monate → Anzeige täuscht); Quest-Spam („sometimes quests can get spam-y"); einzelne Quest-/Belohnungs-Bugs. **[Q: Skeezix; Niche Gamer; SideQuesting]**
- **Destillat:** Selbst das „entspannte" Genre-Mitglied zeigt dieselben zwei Achsen: Erklärung der Kausalität (warum verliere ich Geld?) und Meldungs-Disziplin. Beides sind bei uns Kernversprechen („Warum?"-Sätze; ZEI-1).

### 4.6 Realpolitiks (1/II/3) — die Warnung aus der direkten Nische

- Realpolitiks 3 (2025, 37 % bei tech-gaming): „a dreadful user interface, a shortage of explanations, and dodgy causality undermine the experience"; „the interface … isn't always intuitive … Even experienced strategy gamers may find the lack of clarity frustrating." **[Q: tech-gaming]**
- Realpolitiks II: „The game offers little guidance … the interface … often struggles to display information clearly"; „both systems are somewhat opaque. Outcomes aren't always clearly explained, and failures can seem random." **[Q: Game Critix]**
- Realpolitiks (Mobile): Spieler sehen rohe Entwickler-Strings (`SPY_RELATION_PLAYER_FAIL`) statt Text — Vertrauensbruch par excellence; dazu „war mechanics … wars to last forever, >1hr real time, even against substantially weaker opponents" (Pacing-Fehler). **[Q: game-solver]**
- **Destillat:** Das ist unser direkter Wettbewerber in der Nische „modernes Land regieren" — und er scheitert an genau den drei Dingen, die unsere Analyse vom 29.09. ebenfalls gefunden hatte (Blackbox, fehlende Erklärung, zähe Abläufe). Die Nische straft UI-Schwäche kommerziell ab; sie belohnt Erklärbarkeit (Suzerain 91 % positiv bei 8.281 Reviews) überproportional. **[Q: Steambase Suzerain]**

### 4.7 Bonus-Befund: Football Manager 26 (2025)

„A Brilliant Game Trapped in a Clunky Shell": „FM has always been a game played mostly inside menus. When the menus fight you, it affects everything." — Beweis, dass auch eine 30-jährige Serie mit perfekter Simulation an einem UI-Umbau (der die Navigation verlangsamt) kippt. **[Q: Operation Sports]**

### 4.8 Destillat: Die acht wiederkehrenden UX-Klagen des Genres

1. **Parsing statt Spielen:** Icon-/Menü-Flut ohne Priorisierung (D4-Hauptscreen, Vic3, Realpolitiks).
2. **Blackbox-Kausalität:** „Warum passiert das / warum geht das nicht?" unbeantwortet (Vic3-Blocker, Tropico-Launch, Realpolitiks, HOI4-Kampfmechanik).
3. **Meldungs-Flut ohne Priorität → komplette Ignorierung** (Vic3, Paradox allgemein; Suzerain 2.0 vor 2.0.4).
4. **Routine-Mikro ohne Neuigkeitswert** (Vic3-Produktionsmethoden, D3-Minister-Management).
5. **Warten ohne Anlass** (HOI4-70-Tage-Fokusse mit Mini-Ertrag: „You wait two months to get 2 dockyards"; Vic3-Midgame).
6. **Pausen ohne Entscheidung** (unser eigener Zins-Popup-Befund vom 29.09.; Vic3-AFK-Krieg).
7. **Plattform-Vergewaltigung der UI** (Suzerain 2.0 Mobile-Look; Realpolitiks-Switch-Mauszeiger; CK3-Konsole verschachtelte Tooltips).
8. **Einstieg verlangt Fremd-Ressourcen** (HOI4, EU4, Vic2 — „spielbar erst nach Wiki/YouTube").

Und das Lob-Gegenstück, ebenfalls wiederkehrend: (a) **Schreiben/Figuren mit Folgen** (Suzerain), (b) **Tooltips, die sich selbst erklären** (CK3), (c) **sichtbarer Abschluss mit Inszenierung** (Civ-Wunderfilm, Tropico-Panorama), (d) **„ich sehe sofort, was ich mir leisten kann"** (D4), (e) **Alerts, die zur Entscheidung führen** (Tropico 6).

### Übertrag auf Staatsräson (Feld 3)

- Die Analyse vom 29.09. hatte unsere Reibungen schon gemessen (Vorschau 3.358 ms, „kaum Unterschied"-Vorschau, Kopfleisten-Umbruch, Graph zeigt nur 8 Nachbarn, Zins-Pause). Davon behoben/laufend laut Plan 30.09.: Vorschau-Performance (Web Worker), Ereignismotor, E2E. **Neu aus dieser Recherche als harte Regeln:**
  - **Regel F1 (aus Vic3/Suzerain-2.0):** Jede Pause/Meldung braucht (1) Neuigkeitswert, (2) einen Klickpfad zur Entscheidung, (3) Konfigurierbarkeit pro Kategorie. Ohne alle drei → keine Pause (in Chronik umleiten).
  - **Regel F2 (aus Vic3-Blockern/CK3-Faktorenlisten):** Jede gesperrte Aktion nennt ihre Blocker im Klartext. Bei uns heißt das: „Einbringen nicht möglich — Koalitionspartner lehnt ab (−38 Haltung), Sachkoalition duldet nicht, 301 nicht erreicht (aktuell 276)". Die Daten existieren (`stimmenSicht`, Fraktionsübersicht); es ist eine Darstellungsaufgabe.
  - **Regel F3 (aus Vic3-Mikro-Hölle):** Kein UI-Element darf Routine-Wiederholung erzwingen. Kandidaten bei uns: monatliche Minister-Wirkung prüfen, Baupflege, Regler-Nachjustieren. → Delegations-/Automations-Angebot oder Sammelansicht im Briefing.
  - **Regel F4 (aus Suzerain-2.0):** Keine Dichte-Reduktion zugunsten von „Luft". Unsere Papier-Ästhetik bleibt textdicht; Skalierung über Schriftgrößen-Option, nicht über Informationsentzug.
  - **Regel F5 (aus Realpolitiks):** Niemals Entwickler-Strings/Platzhalter im Spieler-UI. Das ist bei 335 Tests ein Testfall wert (Snapshot-Test: kein `[A-Z_]{4,}` im gerenderten UI).

**Quellen Feld 3:** r/Democracy4 „Some feedback on the game"; Cliffskis Blog; Metacritic Vic3-User-Reviews (metacritic.com/game/victoria-3/user-reviews/); Gamecritics Vic3-Review (gamecritics.com/mitch-zehe/victoria-3-review/); Steam-Guide HOI4 „I'm new…" (steamcommunity.com/sharedfiles/filedetails/?id=2375223271); Quora HOI4-Tutorial; Steam-Diskussion „Thoughts on the new UI" (steamcommunity.com/app/1207650/discussions/0/3806156528939612945/); r/suzerain „Unpopular opinion: 2.0 is a disaster" und „…new full scroll vertical cutout is way better"; RPS zu Suzerain 2.0 und „best game you missed in December 2020"; TheXboxHub-Suzerain-Review; Skeezix-Blog Tropico 6; Niche Gamer Tropico 6; SideQuesting Tropico 6; Hey Poor Player Tropico 6; tech-gaming Realpolitiks-3-Review; Game Critix Realpolitiks-II-Review; game-solver Realpolitiks-Mobile-Reviews; Operation Sports FM26-Review; Steambase Suzerain (steambase.io/games/suzerain/info).

---

## 5. Feld 4 — Spielgefühl & Belohnungs-Rhythmus

### 5.1 Belohnungszyklen in langsamen Spielen

Das Genre bezahlt den Spieler nicht in Adrenalin, sondern in **Abschlüssen, die man kommen sah**:

| Spiel | Belohnungs-Muster | Takt |
|---|---|---|
| Civ 6 | Wunderfilm bei Fertigstellung; „X fertig in N Runden" überall (Tech, Bau, Einheit, Grenzwachstum) | mehrere überlappende Countdowns pro 10 Runden |
| HOI4 | Fokus-Abschluss nach 70 Tagen mit Sound/Effekt; 10-Tage-Kulanzfrist: ungenutzte Tage nach Abschluss gehen nicht verloren (PP akkumulieren in den nächsten Fokus) — **die Wartezeit ist nie „verloren"** | ca. alle 2–3 Min Realzeit (bei Tempo 5) ein Abschluss |
| Vic3 | Bauqueue-Abschlüsse; Diplomatic-Play-Ergebnis | Launch-Kritik: zu wenig davon im Midgame |
| Suzerain | Gesetzes-Durchgang als Szene (Abstimmung!), Zeitungs-Reaktionen, Turn-Ende-Bilanz | je Turn 2–4 große Beats |
| Tropico 6 | Missionsende mit Panoramaflug über die eigene Insel; Penultimo-Kommentar | je Mission (1–3 h) |

- HOI4-Detail (Wiki): „When completed, the player may go up to 10 days without picking a new focus and still have those days … count towards the new focus." — **Kulanz gegen Verschleißgefühl**: Wer gerade nicht hinschaut, wird nicht bestraft. **[Q: HOI4-Wiki]**
- Gegenprobe HOI4-Reddit: 70-Tage-Fokusse mit trivialem Inhalt werden als „slog" empfunden; die Verschiebung neuerer DLCs zu kürzeren (35-Tage), wirkungsvolleren Fokussen wird ausdrücklich begrüßt: „The shift to shorter more impactful focuses has made the new countries really interesting." **Belohnung pro Wartezeit muss stimmen.** **[Q: r/hoi4]**
- Meier-Regel (GDC 2010, s. 2.3): Fortschritt spiegeln, so oft wie möglich. Dazu Vic3-Gegenprobe: „watching your building queue" ohne Ereignis ist die Leere, die wir vermeiden müssen („Warten auf den Monatstag").

### 5.2 Sound und Mikro-Feedback

- UI-Audio-Fachpraxis: Mikrointeraktions-Sound (Hover, Klick, Bestätigung) entscheidet über die **gefühlte Reaktionsfähigkeit** — „its absence can make the same game feel sluggish and disconnected"; Nintendo-Switch-„Click" als Referenz. Frequenz-Trennung: schwere Bestätigungen tief (200–500 Hz), Informationen mittel (1–5 kHz), Alarme hoch (8 kHz+). „Sound bible" mit Konsistenz-Test (UI mit geschlossenen Augen bedienbar?). **[Q: sfxengine]**
- Civ 7 hatte 2026 einen eigenen GDC-Audio-Vortrag („Civilization VII Mixing: A Sound Strategy") — Beweis, dass selbst das rundenbasierte Flaggschiff Audio als Game-Feel-Disziplin behandelt. **[Q: asoundeffect GDC26]**
- Tropico 6 wird für Musik/Voice gelobt („fun voice acting", kubanische Musik hält das Blut in Wallung) — Klang trägt die Langsamkeit. **[Q: Niche Gamer]**

### 5.3 Kamera und Inszenierung

- Tropico 6: Panorama der eigenen Insel nach Missionsende („you get some nice panoramic shots of your island"). **[Q: Hey Poor Player]**
- Civ: Wunderfilm als Genre-Kanon seit Civ 1; Meier-Prinzip der Imagination („dancing bears"-Anekdote: Ein Satz Text ersetzt Assets, die Fantasie macht den Rest) — für ein Text-studio wie unseres ist das die billigste Inszenierung überhaupt. **[Q: Situated Research]**
- Suzerain: Die *Abstimmungsszene* selbst ist die Inszenierung (Cross-Examination eines Gesetzes); Abschluss = Bilanz-Montage des Lebens nach der Amtszeit (Endings mit weitreichenden Epilog-Karten). **[Q: RPS; Suzerain-Wiki „Endings"]**

### 5.4 Warten-Leere vermeiden

Die Vic3/HOI4-Kritik zeigt: Leere entsteht, wenn (a) nichts Sichtbares läuft oder (b) das Laufende nichts kostet/nichts bedeutet. Gegenmittel aus den Referenzen:

1. **Immer mindestens ein sichtbarer Countdown** (HOI4-Fokus, Civ-Queue). Nie einen Zustand, in dem „nichts aussteht".
2. **Wartezeit muss Fortschritt zeigen**, nicht nur vergehen: Balken mit erwartetem Datum (unsere geplanten Implementierungsbalken, INN-2) statt „Dauer: 24 Monate" im Kleingedruckten.
3. **Zwischenstände als Inhalt:** HOI4 meldet Fokus-Bypass; Suzerain meldet Zeitungs-Reaktionen zwischendurch. Unser Analog: Baustellen-Fortschritt auf der Karte + Zeitungs-Zwischenbericht („Kanal-Baustelle: 60 %, ein Skandal, ein Termin").
4. **Ruhe ist erlaubt, wenn sie gewählt ist** (CK3-Fåhraeus: „It's more relaxing in the sun … You can pause, you're probably not going to get wiped out") — aber nur als *Spieler-Wahl*, nie als Default-Leere.

### 5.5 Delegation und Autoplay — wann ist sie gut?

- **Supreme Ruler (BattleGoat, seit 1982/2005) — das Vorbild:** „Control any department within your government or delegate decisions to your Cabinet Ministers" (IGN-Featureliste). Konkret (Ultimate-Manual): Auto-Produktion je Teilstreitkraft an/aus, **Military Initiative** als Regler je Teilstreitkraft (niedrig = Spieler steuert alles, hoch = Generäle handeln autonom), Auto-Deploy, Battle Zones/Theater mit Prioritäten Offensive/Defensive in fünf Stufen, „Defense minister highlights hotspots". SR 2030 (2023) fasst die Philosophie zusammen: „Government ministers are there to assist players, allowing them to **manage what they want, and automate less important decisions**." **[Q: IGN; GameSpot-Preview; SR-Ultimate-Manual; combatsim]**
- **Vic3 Autonomous Investment (Patch 1.2, Dev Diary #71):** private Akteure bauen aus dem Investitionspool je nach Wirtschaftsgesetz — als Antwort auf die Klage, der Spieler müsse jede Fabrik selbst klicken. Aber: „we are **never going to take construction out of the hands of the player entirely**". Spätere Community-Debatte: „Autonomous Investment breaks the Investment Pool design" — zu viel Autonomie entkernte eine Kernschleife. **[Q: Paradox DD #71; r/victoria3]**
- **D4:** Minister *erzeugen* Kapital und Loyalität, handeln aber nicht selbst — Delegation als Ressourcen-Frage, nicht als Autopilot.
- **Destillat — die Delegations-Regel:** Gut ist Delegation, wenn sie (a) **granular** ist (pro Ressort, nicht global), (b) ein **Profil/Preis** hat (Minister-Stil, Fähigkeit, Loyalität — unser PERSONEN-System hat genau das: Leistung = 60 % Fähigkeit + 40 % Loyalität), (c) **widerruflich** bleibt und (d) **berichtet** („Minister Yildiz hat die Straßenbaupriorität in den Osten verlagert" — Briefing-Eintrag). Schlecht ist sie als kostenloser „löse alles"-Knopf, der die Kernschleife entwertet (Vic3-Debatte).

### Übertrag auf Staatsräson (Feld 4)

- **Belohnungslandkarte bauen:** Jede Vorgangsart bekommt einen definierten „Abschluss-Moment": Gesetz → Abstimmungs-Szene + Siegel-Animation + Chronik-Eintrag (Sound: Siegel-Stempel); Bau → Kamerafahrt zur Baustelle + Wunder-Bild (`WunderFenster` existiert; INF-2/UI-5 im Plan); Programm-Schritt → HOI4-Ping-Analog (kleiner Ton + Balken-Sprung); Verhandlung → Unterschrifts-Sequenz; Wahl → Wahlabend (existiert). Das ist kein neues System, sondern **ein konsistentes „Abschluss-Protokoll" über vorhandene Bausteine**.
- **Kulanz-Regel übernehmen (HOI4):** Wer eine Meldung/Fälligkeit verpasst, weil er gerade in einer Akte las, verliert nichts — Fristen pausieren, während ein Entscheidungsfenster offen ist (verhindert das Gefühl „das Spiel straft mich fürs Lesen").
- **Anti-Leere konkret:** s. Kapitel 7.4 (harte Regeln).
- **Delegation bei uns:** Minister-Autonomie als P2-Kandidat mit Profil: Je Amt ein Regler „Eigeninitiative" (niedrig: fragt vor jeder Maßnahmen-Änderung an; hoch: handelt im Rahmen des Regierungsprogramms selbst), sichtbar gebunden an Fähigkeit/Loyalität/Stil. Berichtspflicht ins Tagesbriefing. **Explizit nicht** für: Gesetze, Verhandlungen, Zusagen (die drei Dinge, die unsere Alleinstellung tragen).
- **Sound (UI-6, Plan P2) priorisieren innerhalb von P2:** Mikro-Sounds (Papier, Siegel, Ping) sind der billigste Game-Feel-Hebel überhaupt und brauchen keine Musik-Stilfrage.

**Quellen Feld 4:** HOI4-Wiki „National focus"; r/hoi4 „Terrible 70-day focuses…" und „70 day-long focuses take too much time"; Situated Research (Meier GDC 2010); sfxengine „Best Practices for Game UI Sounds"; asoundeffect.com GDC-2026-Programm; Niche Gamer / Hey Poor Player / Skeezix (Tropico 6); Metacritic/Gamecritics (Vic3); IGN „Supreme Ruler 2020 Features" (ign.com/articles/2008/01/11/…); GameSpot „Supreme Ruler: Cold War Preview"; Supreme-Ruler-Ultimate-Manual (cdn.steamstatic.com/…/Supreme_Ruler_Ultimate.pdf); combatsim.com zu SR 2030; Paradox Dev Diary #71 (paradoxinteractive.com/games/victoria-3/news/dev-diary-71-autonomous-investment-in-1-2); r/victoria3 „Autonomous Investment breaks the Investment Pool design"; VICE CK3 (Fåhraeus „gardening").

---

## 6. Feld 5 — Onboarding & Lernkurve ohne Tutorial-Festung

### 6.1 Was die Forschung hergibt

- Drei Tutorial-Typen (Green et al. 2018, zitiert in einer schwedischen Masterarbeit mit Vergleichsstudie): **Instruktion** (Text/Bild erklärt), **Beispiel** (Figur/Objekt zeigt es), **sorgfältig designte Erfahrung** (das Spiel zwingt zum Lernen durch Anwendung). Zentrale Variable: **Kontext-Sensitivität** (Andersen et al. 2012) — Anleitung im *bedeutungsvollen Moment* schlägt Front-Loading. Überraschendes Nebenergebnis (Whittinghill & Herring 2017): In einem Fighting-Game schnitt die Tutorial-Version **ohne** Text in allen Messungen *besser* ab als die mit Text — Text konkurriert mit dem Geschehen um Aufmerksamkeit. **[Q: diva-portal.org, Masterarbeit „UI-based, NPC-guided or No Tutorial at All?"]**
- Schwierigkeitskurven-Lehre: Hybrid-Modell als Empfehlung für Strategiespiele — „a thin, optional Approach-A tutorial … with placement-based progression … Civilization VI takes roughly this approach: an opt-in tutorial … with the game's tooltips and contextual prompts doing further teaching". **[Q: socratopia, Kap. 5]**

### 6.2 Die drei Referenz-Modelle

1. **CK3 — das Leitmodell:** (a) Geführtes Irland-Tutorial („tutorial island", bewusst kleiner Start); (b) jederzeit abrufbares Tutorial-Menü; (c) Issues-Widget („was ist gerade möglich/dringend"); (d) verschachtelte Tooltips + Enzyklopädie; (e) **Relevanz-Trigger:** „you'll learn about bringing up a child only when you have one" (TheGamer) — Hilfe erscheint, wenn der Fall eintritt, nicht vorher; (f) Achievements, die das Ausprobieren neuer Systeme belohnen. Ergebnis: „the friendliest of the bunch … shed none of its complexity, but it's much better at showing how everything is connected" (PC Gamer). **[Q: RPS; PC Gamer; TheGamer; Forbes]**
2. **HOI4 — das Anti-Modell:** Tutorial-Italien vermittelt UI, nicht Strategie; Lernen passiert de facto über YouTube/Wiki/Freunde. Es funktioniert kommerziell trotzdem — aber mit Jahren an Community-Infrastruktur, die ein neues Spiel nicht hat. **[Q: Steam-Guide; Quora]**
3. **Civ 6/7 — das Advisor-Modell:** Opt-in-Tutorial plus **Advisor**, der Neulingen Bau-/Forschungsempfehlungen gibt (Civ 6); Civ 7: vier Advisor-Typen (Wirtschaft/Militär/Kultur/Wissenschaft) als Embleme an Optionen — „Advisors are simply offering advice rather than required mandates … For your first campaign, following the Economic Advisor's suggestions is recommended." **[Q: Civ-Fandom-Wiki; 2K-Beginner-Guide]**

### 6.3 Mentor-/Ratgeberfiguren — Erfolg und Clippy-Problem

- **Erfolgsfaktoren** (aus den Referenzen destilliert): (a) **Charakter mit Eigenschaften** — Penultimo (Tropico) ist inkompetent, feige, loyal und komisch; er trägt Tutorial UND Ton („Penultimo gets all the best lines"). (b) **Relevanz-Trigger statt Timer** (CK3-Kinder-Beispiel). (c) **Rat statt Befehl** (Civ-7-Advisor: „advice rather than required mandates"). (d) **Abschaltbar/ignorierbar ohne Strafe.**
- **Das Clippy-Anti-Muster:** Microsofts Office-Assistent ist der Genre-Running-Gag; Blizzard parodierte ihn 2011 mit „Crabby, the Dungeon Helper" („Crabby is everywhere. At all times. He is omnipresent and omniscient … the ability to remove Crabby has been disabled") — die Parodie funktioniert nur, weil das Original so verhasst war: **unaufgefordert, generisch, nicht entfernbar, im Weg.** **[Q: Engadget/WoW Archivist]**
- Schlechter NPC-Ratgeber in der Praxis: Angelica Weaver (Adventure) — eine animierte Figur, die „bei jeder Aktion zunickt" und Voice-Kommentare gibt; die Rettung der Rezensentin war die Option, sie stummzuschalten. **[Q: Caught Me Gaming]**
- **Old World (Soren Johnson) als Tooltip-Philosophie:** „The tooltips tell you everything you need to know. What you're lacking is context that comes with experience … You get that context by playing the game." — Erklärung im Spiel, *Bedeutung* durch Erfahrung. Dazu Old Worlds Undo-System (Orders zurücknehmen) als Lern-Sicherheitsnetz. **[Q: Quarter To Three; r/OldWorldGame]**
- **Frostpunk:** Keine Figur, aber ein Prinzip-Satz als Kompass — „The City Must Survive" war von Anfang an die Design-Referenz, an der jede Mechanik gemessen wurde (Marszał, 11 bit). Ein einziger verinnerlichter Leitsatz ersetzt hundert Einzel-Tipps. **[Q: TechRaptor]**

### Übertrag auf Staatsräson (Feld 5)

Unsere Lage: kein Tutorial; Mentorin designt (Defne Arslan + 2 weitere Figuren, `mentor.ts`, LERNKONZEPT mit 7 Prinzipien: Folgen statt Vorlesung, Erklären im Moment der Neugier, sie entscheidet nicht, Ehrlichkeit über Unsicherheit, Vorhersagen, Nachbesprechung, Notizbuch). Das Lernkonzept deckt sich erstaunlich gut mit der Forschung — die Recherche schärft die **Umsetzungs-Regeln**:

1. **Mentorin = On-Demand plus Relevanz-Push, nie Timer-Push.** Push nur bei: erstem Kontakt mit einem System (CK3-Kinder-Muster: „Das erste Mal, dass ein Gesetz scheitert, erklärt sie Mehrheiten"), großen Entscheidungen (LERNKONZEPT „Standardmodus: nur bei großen Entscheidungen"), gemessener Verwirrung (z. B. Spieler öffnet 3× dieselbe Akte ohne Aktion). Niemals: wiederkehrende ungefragte Tipps.
2. **Anti-Clippy-Kodex** (als Test dokumentierbar): Jede Mentorin-Meldung ist (a) kontextgebunden an das sichtbare Element, (b) in einem Satz haltbar mit „Mehr?"-Tiefe, (c) für diese Partie abwendbar („Nicht mehr dazu"), (d) global stummschaltbar, (e) nie modal-blockierend.
3. **Prolog als Irland:** Unser Prolog existiert und verändert echten Zustand — ihm fehlt die Tutorial-Funktion. CK3-Muster: Der erste Spieltag enthält 3 geführte Vorgänge (steht in ENTSCHEIDUNGEN E), die nacheinander Briefing → Akte mit Vorschau → Karte einführen. Danach Ruhe — kein dauerhaftes Hilfs-Overlay.
4. **Advisor-Embleme (Civ 7) für unsere Ratschläge:** Die 5 Briefing-Ratschläge könnten Herkunfts-Icons tragen (Mentorin = neutral, Kabinett = parteiisch) — macht die LERNKONZEPT-Lektion „Berater sind selten neutral" zur UI-Konvention.
5. **Undo als Lern-Netz (Old World):** Wir haben Vorschau (deterministisch!) — ergänzend: Beschlüsse unter Kostenlos-Schwelle innerhalb desselben Tages rückgängig machen („Widerruf vor Bekanntgabe") — realistisch UND lernfreundlich; passt zu Kapital-Logik (Widerruf nach Bekanntgabe kostet Kapital = Suzerain-Commitment bei den großen Dingen).
6. **Leitsatz statt Wiki:** Frostpunk-Muster — ein Satz, den jede Systementscheidung prüft. Kandidat aus unserem Design: „Jede Zahl beantwortet Warum" ist schon der interne; spielerseitig könnte die Mentorin einen Satz etablieren („Der Staat ist ein Netz aus Versprechen"), der in der Chronik wiederkehrt.

**Quellen Feld 5:** Masterarbeit diva-portal.org/smash/get/diva2:1426470/FULLTEXT01.pdf; socratopia.app/library/game-design-en/chapter-5; RPS „Crusader Kings 3 … ten things we know"; PC Gamer CK3-Review; TheGamer CK3-Console-Review; Forbes CK3-Preview; Steam-Community-Guide HOI4; Quora HOI4; Civilization-Fandom-Wiki „Advisor (Civ6)"; 2K „Civilization VII Beginners Guide"; tropico.fandom.com „Penultimo"; Engadget „WoW Archivist: Blizzard's April Fool's jokes" (Crabby); caughtmegaming.wordpress.com (Angelica Weaver); forum.quartertothree.com Old-World-Thread (Soren Johnson, Tooltips/Undo); r/OldWorldGame „Soren Johnson's designer notes"; TechRaptor „How 11 Bit Studios Created … Frostpunk".

---

## 7. Der flüssige Tag — Design-Vorschlag für den Spielrhythmus von Staatsräson

Dieser Abschnitt ist unsere Ableitung aus Feldern 1–5, aufgeschrieben gegen die realen Module: Schreibtisch mit Tagesbriefing (`schreibtisch/briefing.ts`: Kennzahlen, Fälligkeiten, Warnungen, Ratschläge — jeder Eintrag führt per Knopf zu einer Entscheidung), 5 Geschwindigkeiten inkl. „bis zum nächsten Ereignis" (`Stage.tsx`), Auto-Stopps, 11 Kartenebenen (`ebenen.ts`), Politiknetz-Graph (`NetGraph.tsx`), Chronik (`Chronik.tsx`) und Bilanz/Geschichtsbuch (`bilanz.ts`, `BilanzFenster.tsx`), Beschlussbuch (`Beschlussbuch.tsx`), Meldungen-Feed (`Meldungen.tsx`), Mentorin (`mentor.ts`), Programme (`programme.ts`), 335 Tests.

### 7.1 Leitprinzipien

1. **Der Spieltag ist die Grundeinheit des Genusses, nicht der Tick.** Niemand erzählt von „Tick 4.782"; man erzählt von „dem Tag, an dem die Lira fiel" (Suzerain-Prinzip: Geschichten, die man weitererzählt). Jeder Spieltag bekommt eine erkennbare Form: Ankommen → Handeln → Sehen → Geschehen → Abschließen.
2. **Keine Pause ohne Entscheidung, keine Entscheidung ohne Kontext.** (Vic3/Suzerain-2.0-Lehre, unser Zins-Popup-Befund vom 29.09.)
3. **Immer läuft etwas Sichtbares.** (HOI4-Fokus-/Civ-Queue-Lehre: überlappende Countdowns.)
4. **Der Spieler beendet die Sitzung, nicht das Spiel.** Der Abend gehört dem Spieler als Ausstiegspunkt; das Spiel unterbricht eine Sitzung nie *zwischen* Briefing und Chronik mit unlösbarem Ballast.
5. **Rückkehr ist ein Feature.** Jede geladene Partie beginnt mit „Stand der Dinge" (Re-Entry, ACM-Befund — Alleinstellungspotenzial).

### 7.2 Der Spieltag im Detail (Referenz-Taktung)

**① Morgen — Schreibtisch & Tagesbriefing (2–4 Minuten Realzeit)**

- Das Tagesbriefing öffnet den Tag (bei Tagen mit Inhalt) mit **maximal 5 Einträgen**: 1 Lage-Kennzahl (mit Trend-Pfeil und Ton), 1–2 Fälligkeiten (mit Resttagen), 0–1 Warnung, 1 Ratschlag des Stabes, 1 Agenda-Fortschritt (ZEI-2). Mehr Inhalt → „3 weitere im Stapel" (CK3-Issues-Widget-Muster: priorisiert, nicht gestapelt).
- Jeder Eintrag hat seinen Knopf (vorhandenes `Knopf`-System: gehe / einbringen / gespräch). **Kein Eintrag ohne Knopf.**
- Montage (= jeder 7. Spieltag) bekommen eine kompaktere Wochenlage: „Diese Woche fällig: …; diese Woche endet: Bau X (60 % → 100 %), Gesetz Y 2. Lesung". Das ist der HOI4-Fokus-Countdown als Kalender.
- Bei Re-Entry (geladene Partie): zuerst das „Stand der Dinge"-Blatt — 3 Sätze Lage-Delta seit letzter Sitzung, offene Fäden, letzter Beschluss. Erst danach läuft die Zeit.

**② Vormittag — Entscheidungen (5–15 Minuten)**

- Akten/Fenster öffnen aus dem Briefing. Vorschau vor jedem Beschluss (vorhanden, `vorschau.ts`). Ghost-Slider/Implementierungsbalken zeigen Zielstand und Umsetzungsdauer (INN-2).
- Blockierte Aktionen nennen ihre Blocker im Klartext (Regel F2, Feld 3).
- Mentorin nur bei Erstkontakt oder Großentscheidung (Feld-5-Regeln).

**③ Mittag — Karte (3–8 Minuten)**

- Nach einem Beschluss mit Ortsbezug: **Kamerafahrt** zur betroffenen Provinz/Baustelle (Kamera-System existiert) — der Civ-Wunderfilm in Miniatur: Der Beschluss bekommt einen *Ort und ein Bild*.
- Kontext-Linse: Der Beschluss aktiviert die passende der 11 Ebenen automatisch (Civ-Auto-Lens-Muster). Die Karte beantwortet „Wo fehlt was?" (Kernforderung der Analyse 29.09.) — jetzt auch *im Moment der Entscheidung*.
- Der Netz-Graph ist Vertiefung, nicht Pflicht: Einstieg über Tooltips (Top-3-Treiber), wer will, steigt in den Graphen ab.

**④ Nachmittag — Laufzeit mit Auto-Stopps (frei, 0–20 Minuten)**

- Spieler wählt Tempo. „Bis zum nächsten Ereignis" ist der beworbene Schnelllauf.
- Auto-Stopps folgen der Taxonomie in 7.5. Nicht-Stopp-würdiges landet lautlos in Chronik und Meldungen-Feed.
- Laufende Vorgänge zeigen Fortschrittsbänder mit erwartetem Datum (im Briefing sichtbar, auf der Karte als Baustellen-Balken).

**⑤ Abend — Chronik & Abschluss (1–3 Minuten)**

- Tagesende (sobald der Spieler pausiert oder der letzte Stopp des Tages erreicht ist) bietet das **Abend-Blatt**: drei Zeilen — „Bewegt:" (Kennzahl-Deltas des Tages), „Beschlossen:" (eigene Beschlüsse), „Wartet:" (Fälligkeiten morgen/diese Woche). Aus `Chronik`/`bilanz.ts` berechenbar.
- Bei Großereignissen und monatlich: **Zeitungs-Frontseite** (UI-1) statt nüchternem Abend-Blatt — Regierungs- und Oppositionsblatt lesen dieselbe Lage verschieden (dockt an Medien-System REC-4).
- Das Abend-Blatt endet mit dem natürlichen **Speicher-Anlass**: „Sitzung beenden? — Fortschritt gespeichert." (Suzerain-Checkpoint-Prinzip, aber freundlich: wir haben Speichern/Laden.)

### 7.3 Sitzungsdramaturgie (30–60 Minuten)

Eine Sitzung = 1–3 Spielwochen. Drei Takte:

| Sitzungs-Takt | Inhalt | Spielzeit | Realzeit |
|---|---|---|---|
| **Kurz (30 Min)** | 1 Spielwoche: Morgen-Briefing, 2–3 Entscheidungen, 1 Karten-Akt, 1× Schnelllauf, Abend-Blatt | ~7–10 Spieltage | 30 Min |
| **Normal (45 Min)** | ~2 Spielwochen + ein Vorgangs-Abschluss (Bau fertig, Gesetz verabschiedet, Gespräch mit Ergebnis) | ~14–20 Spieltage | 45 Min |
| **Lang (60 Min)** | 1 Spielmonat + Großereignis (Zeitungs-Ausgabe, Verhandlung, Wahltermin im Staatskalender) | ~30 Spieltage | 60 Min |

Zielmetrik (ZEI-3, schärfer gefasst): **≥3 bedeutungsvolle Entscheidungen UND ≥1 sichtbarer Abschluss pro 30 Minuten.** Partie-Gesamtlänge: 60 Monate ≈ 10–16 Sitzungen ≈ 8–12 h (deckt sich mit Suzerain 11,5 h und HOI4 8–10 h — belegt, nicht geschätzt).

Dramaturgische Leitplanke (Meier): Jede Sitzung endet mit mindestens einem *offenen, kurz vor Abschluss stehenden* Faden („Die Brücke ist zu 90 % fertig — morgen"), damit der Zeigarnik-Effekt für uns arbeitet, nicht gegen uns (Abbruch-Gefühl). Der Staatskalender liefert die langen Fäden (Haushalt im Oktober, Wahl), die Vorgänge die kurzen.

### 7.4 Anti-Leere-Regeln (hart, testbar)

Diese Regeln gehören als Langpartie-Tests in die Suite (335 Tests — die Infrastruktur dafür existiert; ZEI-4 zeigt das Muster):

- **R1 (Informations-Maximum):** Nie mehr als **7 Spieltage** ohne briefing-relevante Neuigkeit (Kennzahl-Trendwechsel, Fälligkeit, Warnung, Ratschlag). Messbar: Zähler auf Briefing-Einträge.
- **R2 (Entscheidungs-Maximum):** Nie mehr als **21 Spieltage** ohne Entscheidungsangebot (Ereignis, Vorschlag, Gespräch, Verhandlung). Messbar: Zähler auf Entscheidungsfenster. (Kalibrierungshinweis: R1/R2 sind Design-Zielwerte; über Langpartie-Tests an 2019/2021/2023-Lernfällen justieren, nicht raten.)
- **R3 (Leere-Wächter):** Läuft „bis zum nächsten Ereignis" 30 Spieltage ohne Stopp, wird **kein** künstliches Popup erzeugt (Suzerain-2.0-Lehre: Meldungs-Inflation ist schlimmer als Ruhe), sondern der Lauf endet am nächsten Monatsersten mit dem **Monats-Blatt** (Kurz-Bilanz + „nichts Dringendes — die Republik arbeitet"). Ruhe wird *benannt und inszeniert*, nicht vertuscht.
- **R4 (Immer-ein-Countdown):** Es existiert zu jedem Zeitpunkt mindestens ein sichtbarer Vorgang mit Fortschrittsband und erwartetem Datum (Bau, Gesetz, Programm-Schritt, Verhandlung, Kalender-Termin). Test: Invariante über Langpartie — `vorgaengeAktiv >= 1` nach dem ersten Spielmonat (sonst ist es ein Inhalts- oder Balance-Bug, den der Test meldet).
- **R5 (Ereignis-Deckel):** Maximal 2–3 Entscheidungs-Ereignisse pro Spielmonat (ZEI-1 Ereignis-Wettbewerb nach Dringlichkeit; der Rest eskaliert still mit Chronik-Haken). D4-Vorbild: Event-Konkurrenz verhindert Flut; Suzerain-2.0.4-Vorbild: *Weniger* Meldungen war die Reparatur.
- **R6 (Wirkungs-Frühnachweis):** Jede Maßnahme zeigt spätestens **14 Tage** nach Beschluss ein erstes sichtbares Signal (Baustelle auf der Karte, Zeitungs-Meldung, Treiber-Zerlegung-Eintrag) — auch wenn die Netz-Wirkung erst in Monaten kommt (Hysterese). Bekämpft das „kaum Unterschied"-Gefühl der Analyse 29.09. ohne die Simulation zu verwässern.

### 7.5 Auto-Stopp-Qualitätskriterien (Taxonomie)

Drei Klassen, alle pro Kategorie in den Einstellungen konfigurierbar (HOI4-Message-Settings-/Vic3-Feed-Muster; Tropico-Regel: nie ungewichtet stapeln):

| Klasse | Verhalten | Aufnahmekriterium (Qualitätstor) | Beispiele |
|---|---|---|---|
| **A — Entscheidung** | Pause + Fenster am Schreibtisch | Erfordert eine Wahl mit Konsequenz UND Frist/Verfall; Fenster enthält die Entscheidung selbst (keine Weiterleitungs-Hürde) | Gesetzes-Abstimmung endet, Koalitionskrise, Angriff/Eskalation, Verhandlungs-Gegenangebot läuft ab, Zusage wird fällig |
| **B — Wendepunkt** | Kurz-Pause + Banner + Eintrag im Briefing | Zustand ändert sich dauerhaft oder Schwelle wird gekreuzt; eine Option („ansehen"/„ignorieren") genügt | Vorgang abgeschlossen (Bau/Gesetz/Programm-Schritt), Inflation über Schwelle, Minister-Rücktritt, Umfrage-Sprung |
| **C — Umlauf** | Keine Pause; Chronik + Feed | Reine Information ohne Handlungsbedarf heute | Zinssitzung zur Kenntnis (unser 29.09.-Problem!), Statistik-Veröffentlichung, Auslands-News ohne Anschluss |

**Harte Regeln für alle Klassen:**
1. Keine A-Pause ohne mindestens zwei echte Optionen (sonst ist es ein B). „Zur Kenntnis genommen" ist kein Knopf, der eine Pause rechtfertigt (29.09.-Befund, jetzt als Regel).
2. Dasselbe Ereignis pausiert nie zweimal hintereinander ohne neuen Informations-Gehalt (Eskalations-Stufe muss sich geändert haben).
3. Jede Pause nennt ihre Klasse nicht dem Spieler — aber die *Einstellungen* listen jede Kategorie mit Beispiel („Was hält das Spiel an?").
4. Klasse-A-Dichte ist gedeckelt: max. 1 A-Stopp pro 3 Spieltage im Median über eine Langpartie (testbar). Mehr heißt: Kampagne eskaliert — dann ist die Flut *inhaltlich* gerechtfertigt und wird als solche inszeniert (Krisen-Modus: Briefing wird zur Lage-Zentrale).

### 7.6 Messung (dev-Telemetrie, ZEI-3 konkret)

Pro Sitzung lokal mitschreiben (CSV, kein Netzwerk): Sitzungsdauer, verstrichene Spieltage, Anzahl A/B/C-Stopps, Entscheidungen mit Konsequenz, Abschlüsse erlebt, längste Leerstrecke (Tage ohne Eintrag/Stopp), Abbruchpunkt (wo wurde beendet/gespeichert?). Auswertung gegen die Tore: ≥3 Entscheidungen/30 Min, ≥1 Abschluss/30 Min, R1/R2-Verletzungen ≈ 0, A-Stopps-Median ≤ 1/3 Tage. Das macht „fluent, nice to play" zu einer Messgröße statt einer Meinung — dieselbe Beweisführung wie bei der Spielbarkeitsanalyse vom 29.09.

---

## 8. Top-15-Maßnahmen (Wert/Aufwand)

Wert: erwarteter Beitrag zu „flüssig, gut spielbar" (1–5). Aufwand: S < 1 Tag, M = 1–3 Tage, L > 3 Tage (Konvention aus dem Verbesserungsplan). Plan-Bezug: vorhandene IDs aus VERBESSERUNGSPLAN_2026-09-30.md, wo die Maßnahme dort schon steht; „NEU" = kommt aus dieser Recherche dazu.

| # | Maßnahme | Wert | Aufwand | Plan-Bezug | Kernbeleg |
|---|---|---|---|---|---|
| 1 | **Auto-Stopp-Taxonomie A/B/C** mit Regeln „keine Pause ohne Entscheidung", Kategorie-Einstellungen, Zinssitzung → Klasse C | 5 | S | teils ZEI-1 | Vic3-Popup-Kollaps; Tropico-Lob; eigener Befund 29.09. |
| 2 | **Abend-Blatt** (Bewegt/Beschlossen/Wartet) aus Chronik + Speicher-Anlass als Sitzungs-Klammer | 5 | S–M | NEU | Sitzungsbogen-Forschung; HLTB-Sitzungsdaten Suzerain |
| 3 | **„Stand der Dinge"-Re-Entry-Blatt** beim Laden (3 Sätze Lage-Delta, offene Fäden, letzter Beschluss) | 5 | M | NEU | ACM-Studie Hammad 2021 (Genre-Lücke = Alleinstellung) |
| 4 | **Anti-Leere-Regeln R1–R6 als Langpartie-Tests** (Informations-/Entscheidungs-Maxima, Countdown-Invariante) | 5 | S | ZEI-3/ZEI-4-Familie | Vic3-Midgame-Kritik; HOI4-70-Tage-Debatte |
| 5 | **Verschachtelte kausale Tooltips flächendeckend** (Wert+Trend+Top-3-Treiber → Warum-Sätze → Sprung ins Netz) | 5 | M | UI-2 | CK3-Revolution (Verge/PCGamer); Vic3-Übernahme |
| 6 | **Fortschrittsbänder mit erwartetem Datum für alles Laufende** (Implementierung, Bau, Gesetz, Verhandlung, Programm-Schritt) | 5 | M | INN-2/INF-3 | HOI4-Fokus; Civ-Queue; Vic3-Gegenprobe |
| 7 | **„Bis zum nächsten Ereignis" als Standard-Schnelllauf etablieren** + Stopp-Definition erweitern (Fälligkeiten, Schwellen, Abschlüsse) | 4 | S | NEU (Tempo 5 existiert) | HOI4/CK3-Vorspul-Praxis; Steam-Deck-Messung |
| 8 | **Blocker-Nennung im Klartext** bei jeder gesperrten Aktion (Faktorenlisten-Muster) | 4 | S | NEU | Vic3-„detective work"-Klage; CK3-Annahme-Faktoren |
| 9 | **Ereignis-Wettbewerb mit Dringlichkeit** (max. 2–3/Monat, Rest eskaliert still mit Chronik-Haken) | 4 | S | ZEI-1 | D4-Event-Wettbewerb; Suzerain-2.0.4 („fewer of them") |
| 10 | **Kontext-Linsen**: Beschluss/Ereignis aktiviert passende der 11 Ebenen + Kamerafahrt zum Ort | 4 | M | INF-6 ergänzt | Civ-6-Auto-Lens; „Wo fehlt was?"-Befund 29.09. |
| 11 | **Zeitung als weiches Dashboard** (monatlich/bei Großereignis; Regierung vs. Opposition) | 4 | M | UI-1 | Suzerain-Lob (RPS); Suzerain-2.0-Immersions-Klage als Warnung |
| 12 | **Abschluss-Protokoll**: jede Vorgangsart bekommt Inszenierung (Siegel-Ton, Kamerafahrt, Wunder-Bild, Wahlabend) | 4 | M | INF-2/UI-5 | Civ-Wunderfilm; HOI4-Ping; Tropico-Panorama; Meier-Regel |
| 13 | **Mentorin nach Anti-Clippy-Kodex** (Relevanz-Trigger, On-Demand-Tiefe, abwendbar, nie modal) + Advisor-Herkunfts-Icons im Briefing | 4 | S | PER-4 angrenzend | CK3-Relevanz-Trigger; Crabby/Clippy; Tutorial-Forschung |
| 14 | **Geführter erster Spieltag** (3 Vorgänge: Briefing → Akte mit Vorschau → Karte), danach Ruhe | 4 | M | NEU (ENTSCHEIDUNGEN E einlösen) | Suzerain-Trichter (91→53 %); CK3-Irland; Meier-2020-Warnung |
| 15 | **Mikro-Sound-Paket** (Siegel, Blättern, Ping bei Abschluss, dezentes Karten-Rauschen) vor Musik | 3 | M | UI-6 vorgezogen | UI-Audio-Fachpraxis (sfxengine); Civ-7-GDC-Vortrag |

Bewusst NICHT in den Top 15 (mit Begründung): **Minister-Delegation mit Eigeninitiative** (gut belegt, aber P2-reif: braucht kalibriertes PERSONEN-System, sonst Vic3-Autobau-Falle „Kernschleife entkernt"); **Torpor-Modus/Ironman** (Suzerain beweist Reiz, aber Speicher-Design ist eine eigene Entscheidung); **In-Character-Labels statt Zahlen** (UI-3, bleibt P2: Kalibrierung zuerst).

---

## 9. Unsicherheiten und offene Fragen

1. **Suzerain-Trichter-Lesart:** Die Achievement-Quoten (91,2/52,6/45,5/40,0/36,8 %) sind Steam-global und vermischen Käufer, die nie spielten. Die Aussage „42 % brechen in Kapitel I ab" gilt relativ zur Prolog-Quote; absolut könnte die tatsächliche Abbruchstelle früher liegen. Richtung und Größenordnung sind belastbar, die exakte Stelle nicht.
2. **Kampagnenlängen HOI4/EU4 (8–10 h / 30–50 h)** stammen aus einem Paradox-Forumspost (Community-Schätzung, kein offizieller Datensatz). Als Orientierung gut, als Zitat mit Vorsicht.
3. **Victoria-3-Befund ist Launch-zeitnah (2022/23).** Das Spiel wurde seitdem mehrfach überarbeitet (1.5, Lens-Fixes etc.); die *Muster* (Popup-Flut, Mikro-Hölle, Warte-Leere) sind dokumentiert und bleiben lehrreich, der heutige Zustand von Vic3 ist nicht Gegenstand dieser Recherche.
4. **Suzerain-2.0-UI:** Die negativsten Stimmen stammen aus den ersten 2–3 Wochen nach Release (Aug. 2023); 2.0.4 hat viel entschärft, spätere Stimmen sind gemischt bis positiv (vertikale Scroll-Ansicht hat auch Fans). Die Lehre „Desktop-Dichte nicht opfern, Meldungen reduzieren, Optionen anbieten" bleibt; „2.0 war ein Desaster" war nie Konsens.
5. **„One more turn"-Psychologie:** Die Meier-Zitate sind GDC-2010-Mitschrift-Dritter (GameSpot/Wired/Situated Research), keine offizielle Transkript-Quelle; Kernzitate decken sich über die drei Quellen.
6. **Tages-Taktung R1/R2 (7/21 Tage)** sind von uns gesetzte Design-Zielwerte aus den Referenz-Dichten abgeleitet (Suzerain: 12 Turns mit je mehreren Beats; HOI4: Fokus alle 70 Tage), **nicht** aus einer Quelle — sie gehören über die geplanten Lernfall-Tests kalibriert.
7. **Sitzungslängen-Annahme 30–60 Min:** HLTB liefert 1,5 h/Tag als Rechengröße für Suzerain (Community-Meldungen, Selbstauskunft). Unser 30–60-Min-Ziel ist ambitionierter/kürzer und vom Auftraggeber vorgegeben; die Recherche widerspricht ihm nicht, beweist es aber auch nicht.
8. **Nicht recherchiert (bewusst):** konkrete Zahlen zu durchschnittlichen Steam-Sitzungslängen des Genres (Steam publiziert sie nicht öffentlich); Frostpunk-/CK3-spezifische Abbruchstatistiken; nicht-englischsprachige Communities (türkische Spielerschaft als Zielgruppe wäre eine eigene Recherche wert).

---

## 10. Quellenverzeichnis

**Primärquellen Entwickler/Studien**
- Sid Meier, GDC 2010 Keynote (Mitschriften): gamespot.com/articles/meier-on-crafting-the-epic-journey-full-keynote-video-inside/1100-6253256/ · wired.com/2010/03/sid-meier-gdc/ · situatedresearch.com/2010/03/gdc-sid-meiers-lessons-on-gamer-psychology/
- Sid Meier 2020 (The Independent, via): pcgamer.com/sid-meier-doubts-he-could-make-civilization-today-or-that-hed-even-play-if-it-he-did/
- Cliff Harris (Positech), „Democracy 4's overcomplexity is by design": positech.co.uk/cliffsblog/2023/02/19/democracy-4s-overcomplexity-is-by-design/
- Paradox, CK3 Dev Diary #16 „Tutorials and Tooltips and Encyclopedias, oh my": forum.paradoxplaza.com/forum/threads/….1345581/
- Paradox, Victoria 3 Dev Diary #71 „Autonomous Investment in 1.2": paradoxinteractive.com/games/victoria-3/news/dev-diary-71-autonomous-investment-in-1-2
- Torpor Games / Fellow Traveller, Suzerain 2.0 „Amendment" Ankündigung: rockpapershotgun.com/suzerains-20-update-is-a-massive-overhaul-to-the-already-excellent-political-rpg · fellowtraveller.games/blog/announcing-a-major-free-update-and-the-first-premium-expansion-for-suzerain
- Ata Sergey Nowak Interviews: avclub.com/suzerain-interview · int-magazine.com/interview/ata-sergey-nowak-of-suzerain/ · berlin.de/gamescapital (Interview 2025)
- TechRaptor, „How 11 Bit Studios Created Society Survival Simulator Frostpunk": techraptor.net/gaming/features/how-11-bit-studios-created-society-survival-simulator-frostpunk
- Supreme Ruler: ign.com/articles/2008/01/11/supreme-ruler-2020-features · gamespot.com/articles/supreme-ruler-cold-war-preview/1100-6302248/ · Supreme Ruler Ultimate Manual (cdn.steamstatic.com/steam/apps/314980/manuals/Supreme_Ruler_Ultimate.pdf) · combatsim.com (SR 2030)
- Hammad et al. 2021, „Exploring Returns to Long-Term Single Player Games" (CHI): dl.acm.org/doi/fullHtml/10.1145/3411764.3445357
- Masterarbeit Tutorial-Vergleich (diva-portal): diva-portal.org/smash/get/diva2:1426470/FULLTEXT01.pdf

**Wikis/Referenzen**
- HOI4-Wiki: „User interface", „National focus" (hoi4.paradoxwikis.com)
- Victoria-3-Wiki: „User interface" (vic3.paradoxwikis.com)
- Suzerain-Wiki: „Turn", „Endings" (suzerain.fandom.com)
- Civilization: civilopedia.net (Lenses) · civilization.fandom.com „Advisor (Civ6)" · civilization.2k.com (Civ-VII-Beginner-Guide, Update-Notes 1.5)
- tropico.fandom.com „Penultimo"

**Reviews/Kritik**
- CK3: theverge.com/games/23653870/crusader-kings-3-design-ui · pcgamer.com/crusader-kings-3-review/ · vice.com (Fåhraeus-Interview) · vg247.com · forbes.com/sites/erikkain/… · gamepressure.com · bigbossbattle.com · thegamer.com (Console Edition)
- Suzerain: rockpapershotgun.com/the-best-game-you-missed-in-december-2020-suzerain · PC Gamer (Len Hafer, via Wikipedia-Referenzen) · gamecritix.co.uk/suzerain-review/ · saveorquit.com/2020/12/22/review-suzerain/ · thexboxhub.com/suzerain-review/
- Victoria 3: metacritic.com/game/victoria-3/user-reviews/ · gamecritics.com/mitch-zehe/victoria-3-review/ · pcgamesn.com/victoria-3/nested-tooltip-system
- Tropico 6: skeezixblogs.wordpress.com/2020/10/24/is-tropico-6-still-worth-playing/ · nichegamer.com/reviews/tropico-6-review/ · sidequesting.com/2019/04/review-tropico-6/ · heypoorplayer.com/2019/03/29/tropico-6-review-pc/
- Realpolitiks: tech-gaming.com/realpolitiks-3/ · gamecritix.co.uk/realpolitiks-ii-review/ · xpnnetwork.com/post/realpolitiks-ii-review-xbox · game-solver.com/realpolitiks-mobile/
- Football Manager 26: operationsports.com/football-manager-26-review-a-brilliant-game-trapped-in-a-clunky-shell/

**Community/Statistik**
- Steam-Achievements Suzerain: steamcommunity.com/stats/1207650/achievements (Abruf 30.09.2026)
- Steam-Diskussion „Thoughts on the new UI": steamcommunity.com/app/1207650/discussions/0/3806156528939612945/
- r/suzerain: „Unpopular opinion: 2.0 is a disaster for Suzerain" (…/15z9kaa/) · „How long is a playthrough" (…/1b5kz1q/)
- r/hoi4: „Terrible 70-day focuses…" (…/1dupa1w/) · „70 day-long focuses take too much time" (…/8fwfcm/)
- r/Democracy4: „Some feedback on the game" (…/jcfsvs/) · „Political capital maximum." (…/18jfg5v/)
- r/victoria3: „Autonomous Investment breaks the Investment Pool design" (…/18twtpv/)
- r/paradoxplaza: „My experience with Paradox games as an outsider" (…/18m65i3/)
- Paradox-Foren: „Hourly Ticks" (Tick-Zähler-Vergleich CK3/EU4/V3/HoI4/EU5, Kampagnenlängen) · „Playing HOI4 on Steam Deck" (Sekunden/Tag-Messung)
- HowLongToBeat: Suzerain (howlongtobeat.com/game/83906), Kingdom of Rizia (/game/148118)
- Steam-Community-Guides: HOI4 „I'm new. What nation should I play?" (id=2375223271) · D4 „Basic Gameplay Guide" (id=2242836711) · Vic3 „Understanding the User Interface" (id=2879790246)
- Quarter To Three: Rule-the-Waves-3-Thread mit D4-Overcomplexity-Diskussion · Old-World-Thread (Soren Johnson, Tooltips/Undo)

**UX-Fachliteratur (Benachrichtigungen/Audio)**
- eleken.co/blog-posts/notification-ux · setproduct.com/blog/notifications-ui-design
- sfxengine.com/blog/best-practices-for-game-ui-sounds · asoundeffect.com/gdc26/ (GDC-2026-Audio-Programm, Civ-VII-Mixing-Vortrag)

*Ende der Recherche. Erstellt 30.09.2026; Methodik: WebSearch/FetchURL über die oben gelisteten Quellen; Zahlen ohne Quellenangabe sind Ableitungen aus den genannten Daten (als solche im Text markiert).*
