# Suzerain (Torpor Games) — Systemdesign-Bestandsaufnahme für NWO

Stand: September 2026. Scope: ausschließlich Systemdesign/UI/Entscheidungsstruktur; keine Handlungsinhalte. Entscheidungstypen werden abstrakt benannt (z. B. „wirtschaftliche Entscheidungen", „Personalentscheidungen"). „Spielerwissen" = aus Gameplay-Erfahrung/Wikis der Community, nicht von der Entwicklerseite bestätigt. Zahlen, wo dokumentiert.

---

## 1. Spielschleife: Zeitstruktur und Turn-Ablauf

### Takeaway
Suzerain ist turn-basiert: Prolog + 12 Turns à 4 Monate (= eine 4-jährige Amtszeit) + Epilog + Summary-Screen. Jeder Turn bündelt 1–3 große Entscheidungscluster (Berichte → Gespräche → Dekrete/Verträge/Gesetze); es gibt keine Echtzeit-Timer, Druck entsteht aus Erzähltempo und Turn-Sequenz.

### Cited Findings
- Struktur: Prolog, zwölf normale Turns, Epilogue, Summary; jeder normale Turn deckt vier Monate der vierjährigen Amtszeit ab — [Suzerain Wiki (wiki.gg): Turn](https://suzerain.wiki.gg/wiki/Turn)
- Prolog als Charakter-Setup: Herkunftswahl setzt Startwerte — arm (hohe Public Opinion, 1 Personal Wealth), mittel (durchschnittliche PO, 2 PW), wohlhabend (schlechte PO, 3 PW, bessere Oligarchen-Beziehung) — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn)
- Prolog-Studiengang als Skill-Bonus: Geschichte = bessere Außenverhandlungen, Jura = Verfassungsreform, Ökonomie = Rezessionsbekämpfung + Oligarchen-Standing — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn)
- Prolog-Gruppenwahl als Startbonus: Student Council = +1 Economic Development zu Beginn; Debate Group = stärkere Reden; Human Rights Group = bessere internationale Reputation — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn)
- Turn-Ablauf (dokumentiert an Turn I–II): öffentliche Erklärung → Treffen mit Akteuren (Oligarchen, Medien) → Vertragsvergabe/Dekret → danach in späteren Turns: Budgetrunde, Gesetze, Verhandlungen, Dekrete — [Steam-Guide: Economy and Government Budget Management](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Kernloop: Dialog mit Ministern/Beratern, multiple-choice-Prompts zur Reaktion; ergänzt durch Karten, laufenden Berichts-/Zeitungs-Feed, Budget-/Ressourcen-Statistiken und eine Codex-Bibliothek (Personen, Orte, Geschichte) — [Wikipedia: Suzerain (video game)](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Sekundäre, nicht narrative Schnellentscheidungen neben den narrativen Großentscheidungen — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Umfang: ca. 450.000 Wörter; Zusatztext (Codex/Berichte) ist optional; Basis-Spiel in unter 12 Stunden durchspielbar — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)) (Wortzahl laut Entwicklern via [Der Spiegel](https://www.spiegel.de/netzwelt/games/suzerain-im-test-das-vielleicht-realistischste-spiel-ueber-politik-a-330cc6b0-6159-4b87-8c81-8b82f065f86d))
- Abschluss: Results-Screen mit Position auf einem im-Spiel-universum-Politkompass und Statistikliste der Leistungen — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))

### Inferences
- Die „Runde" ist kein starrer Kalender-Slot, sondern ein Kapitel mit thematischem Fokus (z. B. Turn III = Budgetrunde, Turn VII = Verstaatlichung/Privatisierung, Turn VIII–IX = Gesetzesflut). NWO kann das als Kapitelstruktur mit 2–3 Leitentscheidungen pro Monat/Runde kopieren.
- Spielerwissen: Innerhalb eines Turns ist die Reihenfolge der Szenen weitgehend fix; der Spieler hat keinen „Aktionspunkt"-Pool, sondern erlebt eine Abfolge von Szenen mit Entscheidungen. Freiheit entsteht durch Optionswahl, nicht durch Szenenauswahl.

### Gaps
- Exakte Szenen-/Entscheidungsanzahl pro Turn ist nicht dokumentiert (Wiki-Turn-Seite für Turns 3–12 ist „TBA").
- Keine offizielle Aussage zum Sitzungs-/Kalender-UI (Arbeitskalender vs. reine Kapitelabfolge) gefunden.

---

## 2. Entscheidungsdesign: Optionen, Labels, Folgen, Flags

### Takeaway
Entscheidungen sind multiple-choice-Prompts im Dialog (Antwortsätze der Spielfigur, keine Meta-Labels), oft 2–4 Optionen mit klarer Tonalität/Achse (z. B. sign/veto, fund/maintain/defund, 3 Bauunternehmen). Folgen werden überwiegend verzögert über Berichte/Zeitung und spätere Flag-Verzweigungen kommuniziert; Budgetkosten sind als ganze Punktwerte (−1, −2, +3 …) die sichtbarste Konsequenz.

### Cited Findings
- Grundform: multiple-choice-Prompts, wie die Figur reagiert — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Typische Optionszahlen (dokumentiert): Megaprojekt = 2 Optionen (Autobahn vs. Bahn); Bauvergabe = 3 Optionen (Staatskonzern, Privatfirma teuer/professionell, Privatfirma billig/mittel); jeder Ministerialhaushalt = 3 Stufen (fund/maintain/defund, jeweils −1 bis +1 Budget); Privatisierung = 3 Stufen (Minderheits-, Mehrheits-, Vollprivatisierung: +2/+3/+3 Budget) — [Steam-Guide: Economy and Government Budget Management](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Gesetze als binäre Kernentscheidung sign/veto mit teils bedingtem Erscheinen (z. B. „Less Smoke Bill" nur bei Defizit, „Security Act" nur bei Unrest, „Citizens' Mobility Act" nur bei Überschuss) — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Präsidentendekrete als dritte Entscheidungsart (wirkungsgesetzeskraft, aber verfassungsunterworfen und gerichtlich überprüfbar; Parlament kann durch Gesetze überstimmen) — [Suzerain Wiki: Constitution](https://suzerain.wiki.gg/wiki/Constitution)
- Flag-/Bedingungssystem: spätere Optionen hängen an früheren Wahlen — z. B. Handelskonditionen abhängig von vorherigen außenpolitischen Entscheidungen; Baufirma Taurus kostenlos, wenn zuvor ein bestimmtes Gesetz vetiert wurde; frühere Investitionen entscheiden über spätere Bonus-Events — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Ausgelagerte Beweise für ein formales Trigger/Condition/Effect-System: Datenbank-Tool, das Dialogoptionen, Bedingungen, Effekte, Trigger, Entscheidungen und Dekrete aus den Spieldateien ausliest — [GitHub: Shayrin2/Suzerain-DB](https://github.com/Shayrin2/Suzerain-DB)
- Spielerwissen: Antwortlabels sind durchgehig In-Character-Sprechzeilen (Tonlage: höflich, direkt, drohend, ironisch), selten Meta-Beschreibungen wie „(Attacke)"; es gibt keine Countdowntimer, Druck ist narrativ („der Botschafter wartet"); Budgetkosten werden bei vielen Optionen direkt im Optionslabel angezeigt (z. B. „(−1 Budget)"), Stat-Folgen dagegen meist nicht.

### Inferences
- Das Design arbeitet mit „unsichtbaren" und „sichtbaren" Konsequenzen: Geldkosten sofort sichtbar, Beziehungs-/Stabilitätsfolgen verschleiert — genau das erzeugt den Realismus-Anspruch und den Wiederspielwert. Für NWO: Kosten transparent, Stimmungsfolgen bewusst indirekt.
- Bedingtes Erscheinen von Gesetzen (Defizit/Überschuss-Trigger) ist eine elegante Art, den Systemzustand als Angebotsfilter statt als Zahl sichtbar zu machen.

### Gaps
- Keine dokumentierte durchschnittliche Wörterzahl pro Entscheidung (Schätzung Spielerwissen: 1–3 Sätze Prompt + kurze Optionen; einzelne Reden länger).
- Ob es eine explizite „Folgen-Vorschau"-UI gab (z. B. Hover-Tooltips) — nicht dokumentiert; Spielerwissen: nein, außer Kostenklammern.

---

## 3. Statistiken: Welche Werte das Spiel führt

### Takeaway
Das sichtbare Zentrum ist ein ganzzahliger Regierungsbudget-Pool (Bewegungen meist ±1–4) plus abgeleitete Lagen (Economic Development, Living Standards, Unrest). Daneben laufen unsichtbare Gruppen-Meinungen (Oligarchen, Konservative, Minderheitsgruppen, Frauen, Nationalisten/Sozialisten), die über Zeitungs-/Berichts-Feedback indirekt sichtbar werden.

### Cited Findings
- Government Budget als Hauptressource: dokumentierte Entscheidungskosten/Erträge von −4 bis +4 (z. B. Infrastruktur −1, Verstaatlichung −2, Privatisierung +3, Steuererhöhungen +1 bis +3) — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Economic Development (ED): steigt durch Investitionen, Handel, manche Dekrete; fällt durch Unruhen, Notstand, bestimmte Steuern/Gesetze — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Public Opinion (PO): Startwert aus Prolog-Herkunft; beeinflusst durch Wohlfahrt, Reden, Medienkontrolle; Unpopularität erzeugt Unruhen, die wiederum ED kosten — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn); [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Personal Wealth (PW): 1–3 Punkte aus Prolog, begrenzt Privatinvestitionen im Spielverlauf — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn)
- Living Standards: abgeleiteter Wert aus Gesundheit, Bildung, Infrastruktur, Steuern; zahlt auf Popularität vor der Wahl ein („relieved welfare system" / „overburdened welfare system" als Status-Modifier) — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Weitere geführte Größen (als Modiﬁer/Gruppenmeinung): Oligarchen-Meinung, konservative Unterstützung, Meinung von Minderheitsgruppen, Frauen-Meinung, nationalistisches vs. sozialistisches Standing, Produktion, Infrastruktur (im Economy-Overview als grüne/rote Zustände), Steuerhinterziehung als Problem-Modifier, Unrest/Notstand — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764); [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn)
- Sichtbarkeit: konstanter Feed mit Berichten und Zeitungsartikeln + Statistik für verfügbaren Budget und Ressourcen + Karten — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- 3.1-Update: „improved resource modifier display" (bessere Anzeige von Ressourcen-Modifiern) — [Torpor Games: Sovereign Update](https://www.torporgames.com/press-releases-new/2025/5/13/sovereign-update)
- Spielerwissen: Es gibt kein vollständiges Live-Dashboard aller Werte; das „Overview"-Panel zeigt Etat/Economy grob, viele Werte (Oligarchen-Meinung etc.) sind verdeckt und nur an Reaktionen ablesbar. Wirtschaftliche „grüne/rote" Felder (Produktion, Infrastruktur) bilden Ausnahme.

### Inferences
- Das Statdesign ist bewusst „dünne UI, dicke Simulation": Wenige sichtbare Zahlen, viele verdeckte Zustände — erzwingt Aufmerksamkeit für Textsignale statt Optimierung auf Zahlen. Für NWO relevant, wenn wir ein freies Sprachbefehl-System haben: Dashboard darf interpretierbar bleiben, nicht nur Optimierungsziel.
- Ganzzahlige Budgetpunkte (keine Komma-Ökonomie) halten Entscheidungen vergleichbar und lesbar — bewährt für politische Spiele.

### Gaps
- Exakte Wertebereiche (z. B. Skala PO −100…100?) nirgends offiziell dokumentiert.
- Konkrete Formel, wie PO/ED in Wahlausgang übersetzt wird, nicht dokumentiert.

---

## 4. Figurenmechanik: Beziehungen, Kabinett, Gespräche

### Takeaway
Figuren sind der Hauptspielraum: Gespräche mit Ministern/Beratern sind das Kern-Interface, Beziehungen sind verdeckt und werden über Gesprächston, spätere Loyalitätshandlungen und (im DLC) sichtbare Gunstwerte abgebildet. Das Kabinett berät je nach Ressort und Ideologie; Loyalität kann erkauft (Gefallen, Posten) oder verspielt werden.

### Cited Findings
- Gameplay primär Charakterdialog mit Ministern, Beratern und weiteren Figuren — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Kabinett: Präsident ernennt Minister aus den gewählten Parlamentsmitgliedern (verfassungsrechtlich verankert, erzwingt Fraktions-/Koalitionslogik) — [Suzerain Wiki: Constitution](https://suzerain.wiki.gg/wiki/Constitution)
- Beraterprofile: Ressortchefs bringen je eigene Agenda in Briefings ein (Wirtschaftsminister vs. Innenministerin vs. Entwicklungsberater schlagen unterschiedliche Optionen vor, z. B. Marktwirtschaft vs. Planwirtschaft) — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764); [Suzerain Wiki: Decision](https://suzerain.fandom.com/wiki/Decision)
- Figuren als Informations-UI: Codex-Bibliothek mit Kurzinfos zu Personen, Orten, Geschichte — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Beziehungs-Deals als Mechanik: Medienmogul bietet Medienhilfe gegen zwei Gefallen an; Oligarchen bieten Bestechung/Bauauftrag — spätere Loyalitäts-/Verratsfolgen sind Flags — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn); [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- UI-Buttons (2.0): „Overview, Connections, Codex, Journal" — es gibt also ein dediziertes „Connections"-Panel und ein Journal/Notizsystem — [Steam-Diskussion: Thoughts on the new UI](https://steamcommunity.com/app/1207650/discussions/0/3806156528939612945/)
- Rizia: explizite Gunst-Verwaltung der drei königlichen Häuser („balancing the favor of Rizia's three royal houses"); 3.1 fügt Szenen hinzu, die Beziehungen vertiefen und Storylines mit größerem Einfluss aufs Outcome freischalten — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)); [Torpor Games: Sovereign Update](https://www.torporgames.com/press-releases-new/2025/5/13/sovereign-update)
- Prolog-Mentoring: Universitäts-Dozenten-Vorlesungen formen die spätere Kompetenz der Figur (Verhandlung/Verfassung/Wirtschaft) — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn)
- Kampagnen-Übergreifender Figuren-Import: Rizia-DLC kann einen Sordland-Savefile auslesen, um die Figur des dortigen Präsidenten am Spieler-Verlauf auszurichten (sonst Archetyp-Wahl) — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Spielerwissen: Im Basisspiel gibt es keine sichtbaren Vertrauens-/Loyalitätsbalken; Loyalität zeigt sich an Reaktionen (Zustimmung, Obstruktion, Wechsel, Putschversuch). Das „Connections"-Panel zeigt Verbindungen/Status, aber keine Zahlenwerte.

### Inferences
- „Verdeckte Beziehungsstatistik + sichtbare Verhaltensreaktionen" ist das Herzstück des Erzählerfolgs: Spieler müssen Figuren lesen lernen. Für NWO mit Ziel/Schwäche-Mechanik: Profile können sichtbar sein (Codex), der aktuelle Gunstwert sollte es nicht (oder optional).
- Der Save-Import ist ein starkes, kopierbares Feature für eine Kampagnenreihe (Mentorin/Figurenkontinuität über „Kapitel" hinweg).
- Gefallen-Ökonomie (Medienhilfe gegen Zusagen) ist die Brücke zwischen Beziehungs- und Statistik-System — in NWO als „Politisches Kapital/Verpflichtungen" denkbar.

### Gaps
- Keine offizielle Dokumentation, wie viele Flags pro Figur intern geführt werden.
- Entlassung/Ernennung von Ministern als Mechanik: nur verfassungsrechtlich dokumentiert (Ernennung aus Parlament); ob im Spiel Entlassung möglich ist — Spielerwissen: kaum/keine freie Kabinettsumbildung im Basisspiel; nicht belegt.

---

## 5. Außenpolitik-System: Verhandlungen, Verträge, Reputation

### Takeaway
Außenpolitik ist ein Vertrags-/Exklusivitäts-Netzwerk: Handelsabkommen kosten/bringen Budgetpunkte und Regionaleffekte, schließen aber Partner aus (Wer mit A handelt, verliert B). Supermacht-Nähe bringt Geld, erhöht aber Putsch-/Sanktionsrisiko. Reputation wird über „international standing" als verdeckten Wert geführt.

### Cited Findings
- Handelsabkommen als Budget- und Regionaltreiber: dokumentierte Effekte (z. B. +2 Budget/Regionsverbesserung für einen Deal, −1 für einen anderen; Deals an Vorbedingungen geknüpft wie Einwanderungs- oder Gebietsfragen) — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Exklusivitätslogik: bestimmte Handels- und Bündniskombinationen schließen sich gegenseitig aus (Wer den einen Partner wählt, wird vom anderen sanktioniert) — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Supermacht-Hilfe: Finanzhilfe (+1 Budget) gegen Annäherung, erhöht Putschrisiko, schließt Handel mit dem jeweils anderen Lager aus (Bündnisblöcke ATO/CSP) — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Reputation: „international standing" als verdeckter Wert; Menschenrechts-Hintergrund im Prolog mildert spätere diplomatische Strafen; internationale Ächtung als mögliches Szenario — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn); [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Verhandlungskompetenz an Figur gekoppelt: Geschichtsstudium erleichtert Verhandlungen mit Staatsoberhäuptern — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn)
- Militär/Infrastruktur-Kopplung: Infrastrukturprojekte beeinflussen die Effektivität von Alliierten im Konfliktfall (z. B. Bahnlinie für Truppenbewegung) — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- Rizia: optionales interaktives Kriegskapitel mit Aufstellung von Streitkräften; 3.1 erweitert Kriegsmechanik (Luftwaffensystem, „smarter enemy AI"), dynamische Wirtschaft mit Tourismus, Handel, Schmuggel-Dynamiken — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)); [Torpor Games: Sovereign Update](https://www.torporgames.com/press-releases-new/2025/5/13/sovereign-update)

### Inferences
- Das Vertragsdesign mit harten Exklusivitäten erzwingt strategische Lagerwahl ohne Weltkarte-Gameplay — ideal für ein politisches Desktop-Spiel mit wenig Mikromanagement.
- Kopplung Außenpolitik ↔ Innenpolitik (Handel wirkt auf Regionen, Meinungen, Budget) verhindert, dass Diplomatie ein eigenständiges Minigame bleibt.

### Gaps
- Keine dokumentierte Gesamt-„Reputationsanzeige" (wie z. B. ein OMEC-Statusbalken) — nur narrative Rückmeldung.
- Vertragswerkzeuge (Dauer, Kündigung, Vertragsverletzung) nicht dokumentiert; Verträge wirken als einmalige Flags.

---

## 6. Wahlen und Parlament: Umfragen, Wahlkampf, Gesetzgebung

### Takeaway
Das Parlament ist ein Mehrheiten-System mit 10%-Sperrklausel und Verfassungsänderungen, die Zweidrittelmehrheit plus Gerichtszustimmung brauchen. Mehrheiten werden nicht über ein Voting-Minigame, sondern über Dialogverhandlungen mit Parteiführern, Posten und Zugeständnisse beschafft. Der Wahlkampf am Amtszeitende ist im Wesentlichen das Ergebnis der kumulierten Statistik (PO, Living Standards, Wirtschaft).

### Cited Findings
- Wahlsperrklausel: Parteien brauchen mindestens 10% der nationalen Stimmen für Parlamentssitze; Stimmen unterhalb der Sperrklausel werden proportional umverteilt — [Suzerain Wiki: Constitution](https://suzerain.wiki.gg/wiki/Constitution)
- Verfassungsänderung: Antrag mit mindestens 150 Unterschriften im Parlament; Zweidrittelmehrheit in der Grand National Assembly plus einfache Mehrheit im Obersten Gericht — [Suzerain Wiki: Constitution](https://suzerain.wiki.gg/wiki/Constitution)
- Absolutes Präsidialveto gegen Gesetze (Art. 77/82); Parlament kann Präsidentendekrete durch eigene Gesetzgebung überschreiben — [Suzerain Wiki: Constitution](https://suzerain.wiki.gg/wiki/Constitution)
- Minister aus der Mitte der gewählten Parlamentarier → Exekutive ist parlamentsabhängig — [Suzerain Wiki: Constitution](https://suzerain.wiki.gg/wiki/Constitution)
- Wahlkampf-Finanzierung als Regelwerk: „Electoral Campaign Finance Bill" — nur Parteien über einer Stimmschwelle erhalten Staatsgeld (Sign/Veto-Entscheidung des Spielers) — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn)
- Wahlausgang als Endgame: Wiederwahl ist Ziel der Amtszeit; PO, Living Standards und Wirtschaftslage entscheiden; Ergebnis-Screen zeigt Leistungsstatistik — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764); [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Spielerwissen: Das Parlament hat 250 Sitze; für Verfassungsänderungen sind rund Zweidrittel (ca. 167 Stimmen) nötig. Mehrheiten werden über Szenen mit Fraktionschefs verhandelt (Zugeständnisse wie Kabinettposten, Gesetzesänderungen, Regionsprojekte); es gibt eine Sitzungsszene mit Abstimmungsauszählung, aber kein taktisches Whip-Minigame. Umfragewerte werden über Zeitungsartikel und Berater-Reports kommuniziert (kein Umfrage-Dashboard).

### Inferences
- Das System belohnt „Mehrheiten bauen durch Beziehungen", nicht durch Zahlenoptimierung — genau die Brücke zu NWOs Politiknetz (Figuren mit Zielen/Schwächen als Hebel für Parlamentsmehrheiten).
- Die Kombination Veto + Verfassungsgericht + Parlamentsüberschreibung schafft Checks-and-Balances als Gameplay-Spannung ohne separates Gerichts-Minigame.

### Gaps
- Sitzzahlen der Fraktionen und exakte Abstimmungs-Schwellen sind in den ausgewerteten Quellen nicht dokumentiert (hier Spielerwissen, siehe oben — bitte gegen Wiki „Assembly"-Seite verifizieren).
- Wahlkampf-Phase als eigene Mechanik (Reden-Tournee o. Ä.) nicht belegt; sie scheint narrativ in die letzten Turns eingebettet.

---

## 7. UI und Präsentation: Aufteilung, Zeitung, Feedback, Rezeption

### Takeaway
Die UI ist minimalistisch (Porträts, Menüs, Text, symbolische Bilder) mit einem festen Layout aus Dialogfläche, Karte, Berichts-/Zeitungs-Feed und Seitenpanels (Overview, Connections, Codex, Journal). Die Zeitung ist der zentrale Feedback-Kanal für Stat-Veränderungen. Rezeption lobt Tiefe und Konsequenzen, kritisiert Textlast, Tutorial und (nach dem 2.0-UI-Redesign) eine mobile-Game-Optik.

### Cited Findings
- Layout-Bestandteile: politische Karten, laufender Feed mit Berichten und Zeitungsartikeln, Budget-/Ressourcen-Statistiken, Codex-Bibliothek; Zusatztext muss nicht gelesen werden — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Visueller Stil: minimalistisch, aber effektiv; Porträts, Menüs, Textinterfaces, gelegentlich symbolische Bilder; Fokus liegt auf Entscheidungen und Konsequenzen — [Game Critix: Suzerain Review](https://gamecritix.co.uk/suzerain-review/)
- UI-Lob: sauberes Layout, das viele gleichzeitige Elemente gut handhabt — [3rd-strike: Suzerain Review](https://3rd-strike.com/suzerain-review/)
- UI-Kritik (kleine Presse): Dialoginterface zu sparsam (Personen am Tisch, Sprechblasen, Ortsbilder würden „textual monotony" brechen) — [Impulse Gamer: Suzerain PC Review](https://www.impulsegamer.com/suzerain-pc-review/)
- Oyungezer (7,5/10): Worldbuilding, Charakterdesign, Wiederspielwert gelobt; Tutorial und UI verbesserungswürdig, Musik repetitiv — via [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Steam-Community zum 2.0-UI-Redesign (2023): Rückenwind gegen „Mobile-Game-Optik" — vertikales Scrollen im Intro, Dialogbox ohne Rahmen über die ganze Höhe, Buttons rechts; Kritik an Überreizung (visuelle Überforderung), „rubbery" Scrollbar, zu großen Schriften; Lob für Regionalkarte und erreichbare Seitenpanels; Patch 2.0.4 milderte Benachrichtigungs-Chaos und bot alte Schrift optional — [Steam-Diskussion: Thoughts on the new UI](https://steamcommunity.com/app/1207650/discussions/0/3806156528939612945/)
- 3.1-UI-Pflege: klarere Dekret-Kategorien, bessere Ressourcen-Modifier-Anzeige, flüssigere Story-Auswahl — [Torpor Games: Sovereign Update](https://www.torporgames.com/press-releases-new/2025/5/13/sovereign-update)
- Presse-Einordnung: Der Spiegel „vielleicht das realistischste Spiel über Politik"; Rock Paper Shotgun: detaillierte Welt, insgesamt „superb"; PC Gamer: „fascinating“, „truly unique“; Vice: scharfer historischer Kommentar — via [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Bewertungen: Metacritic PC 81/100; Steam über 8.000 Reviews, 93% positiv (Stand Mai 2025); Auszeichnungen u. a. Deutscher Computerspielpreis „Bestes Expertenspiel" 2021, Games for Change People's Choice 2021, Berlin Tech Award 2024, „Best Story" German Dev Awards 2024 — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)); [Torpor Games: Sovereign Update](https://www.torporgames.com/press-releases-new/2025/5/13/sovereign-update)
- Nachrichten-System als Content-Masse: „Amendment"-Update (Juli 2023) fügte u. a. mehrere hundert News-Events hinzu; von RPS als „massive overhaul" beschrieben — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)); [Rock Paper Shotgun](https://www.rockpapershotgun.com/suzerains-20-update-is-a-massive-overhaul-to-the-already-excellent-political-rpg)
- Textmenge pro Entscheidung: Spielerwissen — Prompt meist 2–6 Sätze, Optionen je 1 Satz; längere Ausnahmen bei Reden/Verhandlungsdialogen. Spielfluss: Basis-Kampagne unter 12 Stunden, entspanntes Lesetempo, kein Time-Pressure-UI.

### Inferences
- Die Zeitung als „softes Dashboard" ist das wichtigste kopierbare Element: Sie übersetzt Stat-Änderungen in erzählerische Rückmeldung und bleibt damit im Ton. NWO kann sie als Türkei-spezifische Pressevielfalt mit Tendenz-Richtungen (staatlich/oppositionell) nutzen — das wäre sogar eine Steigerung gegenüber Suzerains weitgehend einheitlichem Feed.
- Die UI-Kritikgeschichte (2.0) ist eine Warnung: Ein für Mobile optimiertes Redesign kann die Desktop-Immersion beschädigen; Notifications und Typografie müssen auf Desktop priorisiert werden (NWO ist Desktop-first).
- Lobschwerpunkt der Reviews liegt auf Konsequenzen-Dichte und Realismus, nicht auf Optik — NWO muss in Entscheidungstiefe investieren, nicht in Grafik.

### Gaps
- GameStar-Test: kein eigener Test im Recherchefund (nur allgemeine Website-Treffer); deutsche Fachpresse ist mit Spiegel-Test abgedeckt, GameStar-Fundstelle fehlt.
- Steam-Review-Texte zu System-/UI-Schwerpunkten nur stichprobenartig über Diskussionen; keine quantifizierte Auswertung aller Reviews.

---

## 8. Rizia-DLC und Erweiterungen 2024–2026

### Takeaway
Kingdom of Rizia (März 2024) führte Rohstoff-/Ressourcenmanagement (Energie, Autorität), Häuser-Gunst, königliche Dekrete und optionale Kriegsmechanik ein; das 3.1-„Sovereign"-Update (Mai 2025) vertiefte Wirtschaft, Unstabilität und Krieg. 2026 wurden zwei neue DLC (Galmland, The Neutral Lens) angekündigt; außerdem entstehen zwei Ableger-Spiele.

### Cited Findings
- Kingdom of Rizia, 25. März 2024 (erste Erweiterung); Mobile + 2.0-Update 11. Dez. 2024; Konsolen 11. Nov. 2025 — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Neue Ressourcen: „energy and authority" als Managementspielraum; Adelshäuser-Gunst als Beziehungssystem; Themenkomplexe Religion, Familie, als Interaktionsarten — [Nintendo-Store: Kingdom of Rizia DLC](https://www.nintendo.com/en-gb/DLC/Suzerain-Kingdom-of-Rizia-2904735.html)
- Königliche Dekrete als erweiterte Entscheidungsart (Bauprojekte, Gesetze, Wohlfahrt) — [Torpor Games: Sovereign Update](https://www.torporgames.com/press-releases-new/2025/5/13/sovereign-update)
- 3.1 „Sovereign" (7. Mai 2025): ein Dutzend neuer Szenen, neuer Turn mit tiefen Epilogen; erweiterte Dekrete (religiös, Wohlfahrt, Ordnung); überarbeitete nationale Instabilität, religiöse Unruhen, Sabotage; Kriegs-Mechanik mit vollem Luftwaffensystem und smarterer KI; dynamische Wirtschaft (überarbeiteter Handel, Tourismus, Drogenkriminalität, „religious happiness"); UI-Pflege; Torpor-Account mit Cloud-Saves, Achievements, Level-System; 30+ neue Achievements — [Torpor Games: Sovereign Update](https://www.torporgames.com/press-releases-new/2025/5/13/sovereign-update)
- 3.1 überarbeitete die Rizia-Storyline als Reaktion auf Spieler-Feedback; später kam eine Ressourcen-Schwierigkeitsstufe (einfache/schwere Ressourcenverfügbarkeit) hinzu — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)); [Steam-Guide: Rizia War Guide 3.1](https://steamcommunity.com/sharedfiles/filedetails/?id=3504055675)
- Socialist Republic of Galmland (angekündigt Juli 2026; Vision Statement 22.09.2026): Spieler als Premier und Zentralkomitee-Vorsitz; Machtkämpfe im Komitee, Aufbau einer Planwirtschaft, Abwehr ausländischen Einflusses — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)); [Suzerain-Newsfeed (Fandom)](https://suzerain.fandom.com/wiki/Suzerain_Wiki); [suzeraingame.com/galmland](https://www.suzeraingame.com/galmland)
- Suzerain Stories: The Neutral Lens (angekündigt Juli 2026): Spieler als investigativer Journalist; Konkurrenz unter Reporter:innen, Narrative formen unter Druck/Prüfung — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Spin-offs in Entwicklung: The Conformist (1930er-Präquel, Propagandisten-Rolle, Early Development 2026) und Wars of Suzerain; außerdem Einstieg von Krafton als Investor (Nov. 2025) — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)); [Torpor Games: Sovereign Update](https://www.torporgames.com/press-releases-new/2025/5/13/sovereign-update)

### Inferences
- Die DLC-Linie zeigt die Skalierungsstrategie: Gleiches Grundsystem (Turn-Struktur, Dekrete, Berichte), neue Ressourcen-Achsen je Setting (Energie/Autorität in Rizia; Planwirtschaft/Komitee in Galmland). Für NWO-Visionen (Erweiterungen um Wirtschaftstiefe) ist das der Blaupause-Fall.
- Ressourcen-Difficulty-Option (3.1+) ist eine gute Antwort auf Community-Balance-Feedback — für NWO als Regler für „Wirtschaftssimulationstiefe" denkbar.

### Gaps
- Exakte Werte/Einheiten der Rizia-Ressourcen (Energie, Autorität, Gold) nicht dokumentiert.
- Galmland-/Neutral-Lens-Mechaniken sind nur aus Vision Statements bekannt (Stand Sept. 2026) — Spekulation vermeiden.

---

## 9. Übernahme für NWO: Konkrete Liste

### Takeaway
Kopieren: Kapitel-/Turn-Struktur mit Leitentscheidungen, In-Character-Entscheidungslabels mit Kostenklammern, Zeitung als Soft-Dashboard, verdeckte Beziehungsstatistiken mit sichtbaren Reaktionen, Flag-Verzweigungen, ganzzahliges Politik-/Budgetkapital, Endscreen mit Politkompass. Anders machen: Desktop-first-UI (kein Mobile-Kompromiss), optional sichtbare Beziehungsanzeige, explizites Umfrage-Dashboard als Ergänzung zur Zeitung, freie Sprachbefehle als zusätzliche Entscheidungsebene.

### Cited Findings (Belege der Vorlagen, auf die sich die Empfehlung stützt)
- Turn-/Kapitelstruktur mit 12 Turns à 4 Monate + Summary-Screen — [Suzerain Wiki: Turn](https://suzerain.wiki.gg/wiki/Turn); [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Entscheidungslabels: In-Character-Sprechzeilen, Kosten sichtbar in Klammern, Stat-Folgen verdeckt — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764) (Kostenformate); Spielerwissen (Label-Tonalität)
- Zeitung/Berichts-Feed als konstanter Feedback-Kanal, hunderte News-Events — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)); [Rock Paper Shotgun](https://www.rockpapershotgun.com/suzerains-20-update-is-a-massive-overhaul-to-the-already-excellent-political-rpg)
- „Connections"-Panel als Beziehungsübersicht (ohne Zahlenwerte) — [Steam-Diskussion](https://steamcommunity.com/app/1207650/discussions/0/3806156528939612945/)
- Flag-/Bedingungslogik (frühere Wahlen öffnen/schließen spätere Optionen) — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764); [GitHub: Suzerain-DB](https://github.com/Shayrin2/Suzerain-DB)
- Verdeckte Gruppen-Meinungen statt Gesamtscore — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2484945764)
- UI-Warnung: Mobile-Optimierung kann Desktop-Immersion und Zugänglichkeit beschädigen — [Steam-Diskussion](https://steamcommunity.com/app/1207650/discussions/0/3806156528939612945/)
- Parlament: Mehrheiten über Dialogverhandlungen, Verfassung mit Zweidrittel + Gericht — [Suzerain Wiki: Constitution](https://suzerain.wiki.gg/wiki/Constitution)
- Figurenkontinuität über Kampagnen hinweg per Save-Import/Archetyp — [Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game))

### Inferences (Konkrete Empfehlungsliste NWO)
- **Übernehmen:**
  1. Kapitelstruktur: „Regierungsmonat" als Turn mit 2–3 Leitentscheidungen (Bericht → Gespräche → Dekret/Gesetz → Auswertung) analog Suzerain-Turns.
  2. Entscheidungslabels als In-Character-Sätze der Präsidentenfigur (Tonalitätsskala: sachlich/direkt/drohend/versöhnlich), Kosten als Punktklammer im Label.
  3. Zeitung als primäres Stat-Feedback (wenige Tendenzen, Schlagzeilen-Spins), Dashboard nur als grobe Übersicht.
  4. Beziehungsmechanik: Ziele/Schwächen der Figuren im Profil sichtbar, aktuelle Gunst verdeckt (optional: Mentorin als Coach-Ansicht, die Hinweise gibt).
  5. Flag-System für Verzögerungskonsequenzen (Versprechen, Gefallen, Vetos) mit Rückruf in späteren Dialogen und im Journal.
  6. Ganzzahliges „Politisches Kapital"/Budget als harte Währung; Living-Standards-ähnliche abgeleitete Lage für die Wiederwahl.
  7. Endscreen: Politkompass-Position + Leistungsstatistik (Belohnung für Wiederspiel).
  8. Optional: Figuren-/Kampagnen-Import (Mentorin, Rivalen bleiben über Kapitel konsistent).
- **Anders machen:**
  1. Desktop-first-UI: keine Mobile-Kompromisse bei Dialogfläche, Scrollverhalten, Schriftgrößen; Notizen/Journal mit vollwertigem Editor (Suzerain-Kritikpunkt).
  2. Sprachbefehle als offene Entscheidungsebene über die Multiple-Choice-Auswahl hinaus (NWO-USP; Suzerain hat keine freie Eingabe).
  3. Optional sichtbare Beziehungsanzeige (Regler: „Realismus" vs. „Transparenz"), da NWO-Systemspiel mehr Optimierung erlauben soll als Suzerains Erzählfokus.
  4. Umfrage-/Mehrheiten-Dashboard ergänzend zur Zeitung, da Parlamentsmehrheiten in NWO mechanischer (Politiknetz) sind.
  5. Timer/Druck bewusst dosieren: Suzerain hat keine; NWO kann optionale Fristen als Spannungsebene einführen, ohne Realismuspreis zu zahlen.

### Gaps
- Keine belastbare GameStar-Quelle zu UI/System; falls gewünscht, gezielt nachrecherchieren.
- Durchschnittliche Entscheidungslänge/-anzahl pro Turn und exakte Parlamentssitzzahlen bitte vor Design-Festlegung gegen Primärquellen (In-Game-Wiki/Save-Datenbank) verifizieren — hier als Spielerwissen markiert.
