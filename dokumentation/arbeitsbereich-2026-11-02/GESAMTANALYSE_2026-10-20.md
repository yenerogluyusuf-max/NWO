# NWO — Gesamtanalyse: Spiel, Systeme, Referenzen

Stand: 20. Oktober 2026. Analyse des aktuellen Konzeptstands, nicht eines Builds: Im Projektordner liegt kein spielbares NWO; der frühe Prototyp existiert laut Arbeitsprompt nur im GitHub-Repo. Geprüft wurden alle Kerndokumente sowie die Referenzanalyse; die Rechercheberichte wurden quergelesen. Ergänzend wurden Hearts of Iron IV, Democracy 4, Civilization VI, Suzerain und angrenzende Titel als Referenzen untersucht. Keine Rechts- oder Finanzberatung.

**Nachtrag 20.10.2026:** Die S1.0-Kürzung in §6/§7 (eine Region, drei Politikfelder, fünf Figuren) ist durch den originaltreuen [Spielplan](SPIELPLAN.md) überholt. Es gilt: 365 Tage, 81 Provinzen, 12 Felder (4 aktiv), 8 Figuren, 3 Krisen, ein Diplomatie- und ein Beschaffungsfaden. Die Analyse bleibt gültig; nur der erste Build ist anders zugeschnitten.

## 0. Kurzurteil

**NWO ist ein starkes Konzept mit einem noch nicht bewiesenen Kern.**

Die Vision ist klar, die Leitprinzipien sind eigenständig, die Quellenarbeit ist für ein Ein-Personen-Projekt außergewöhnlich. Aber das Spiel hat noch keinen Test überstanden, der zeigt, dass die Kernschleife trägt. Es ist gleichzeitig zu breit (Türkei, 81 Provinzen, zwölf Politikfelder, Weltpolitik, Militär, 19 Ereignisvorlagen) und zu dünn an den Stellen, die ein Spiel tragen (Entscheidungsdichte, Simulation, Daten, KI-Vertrag, UI, Produktion).

Die Referenzspiele zeigen genau das:

- **HOI4** kann materielle Knappheit, Karte und langfristige Ziele — aber keine echte Friedenspolitik, keine Institutionen, keine glaubwürdige Wirtschaft.
- **Democracy 4** kann transparente Politiknetze und Wählergruppen — aber keinen Realismus, keine Regionen, keine echte Umsetzung.
- **Civilization VI** kann räumliche Entscheidungen und „one more turn" — aber keine Gesellschaft, keine echte Diplomatie, keine Knappheit jenseits von Erträgen.
- **Suzerain** kann Figuren, Ton und moralisches Gewicht — aber keine nachvollziehbare Simulation und keine echte Offenheit.

NWO muss die Schnittmenge bauen: **Karte + echte Daten + Institutionen + Figuren + freie Sprache + berechenbare Folgen.** Keines der Vorbilder hat diese Kombination. Deshalb ist Kopieren keine Lösung; die eigenen Spezifikationen fehlen aber genau dort, wo die Vorbilder stark sind.

## 1. Was das Spiel verspricht — und was davon trägt

NWO verspricht sechs Dinge:

1. **Du regierst mit deinen Worten.** Freitext wird zu geprüften Aktionen.
2. **Die Simulation rechnet, nicht die KI.** Jede Zahl kommt aus dem Modell.
3. **Die Härte des echten Lebens.** Jede Entscheidung hat Verlierer, Preise, Verzögerungen.
4. **Ein echtes Land.** Türkei, echte Daten, echte Institutionen, 81 Provinzen.
5. **Figuren und Geschichte.** Minister, Journalisten, Gouverneure, Mentorin; Zusagen kehren zurück.
6. **Lernen.** Man versteht danach, wie Staat, Wirtschaft und Medien funktionieren.

Diese sechs Versprechen sind gut gewählt. Sie erzeugen aber auch sechs Baustellen, die alle gleichzeitig gelöst werden müssen. Der aktuelle Stand löst keine davon vollständig:

- Zu 1 fehlt der Aktionsvertrag.
- Zu 2 fehlt die formale Simulation.
- Zu 3 fehlen Kalibrierung und Test.
- Zu 4 fehlen Stichtag, Register und Datensatz.
- Zu 5 fehlen Character-Sheets, Szenen und Gedächtnis-Schema.
- Zu 6 fehlen Lernziele, Assessment und fachliche Prüfung.

## 2. Referenzspiele: Was sie wirklich lehren

Kurzfassung hier; die detaillierten, quellengestützten Analysen stehen in [REFERENZ_KERNSPIELE.md](REFERENZ_KERNSPIELE.md) (HOI4, Democracy 4, Suzerain), [REFERENZ_SPIELGEFUEHL.md](REFERENZ_SPIELGEFUEHL.md) (Civ VI, Old World, Frostpunk, CK3) und [RECHERCHE_WARNLISTE_POLITSIM.md](RECHERCHE_WARNLISTE_POLITSIM.md) (Realpolitiks, Power & Revolution, Republic). Patch- und DLC-Stände sind Momentaufnahmen vom 20.10.2026.

### 2.1 Hearts of Iron IV — materielle Knappheit und die Grenzen der Kriegslogik

**Core Loop:** Land wählen, Fokusbaum abarbeiten, forschen, bauen, produzieren, Divisionen designen, Diplomatie und Krieg führen, Friedenskonferenz. Die Zeit läuft in Tagen; ein Fokus dauert typischerweise 35 oder 70 Tage, und es kann immer nur ein Fokus gleichzeitig laufen ([HOI4 Wiki: National Focus](https://hoi4.paradoxwikis.com/National_focus)).

**Stärken:**

- **Materielle Kausalität:** Man kann nicht einfach „Armee bauen"; man braucht Produktion, Ausrüstung, Manpower, Versorgung, Treibstoff. Das erzeugt glaubwürdigen Druck.
- **Karte als Handlungsfläche:** Fronten, Supply-Hubs, Eisenbahnen, Gelände. Die Karte ist nicht Dekoration, sondern Entscheidungsraum.
- **Langfristige Ziele:** Fokusbäume geben dem Spiel Richtung; jede Nation hat eine eigene Fantasie.
- **Modding:** Die Datengetriebenheit hat eine riesige Mod-Szene erzeugt; das verlängert die Lebensdauer enorm.

**Schwächen:**

- **Fokusbäume sind lineare Content-Treadmills.** Man klickt einen Fokus, wartet 70 Tage, klickt den nächsten. Die Entscheidung ist oft nur „welchen Baum zuerst?".
- **UI-Überladung.** Verschachtelte Tooltips, Dutzende Ressourcen, Division Designer, Supply-Map, Produktionsketten. Der Einstieg ist ohne Wiki/YouTube kaum zu schaffen.
- **Die Wirtschaft ist Kriegswirtschaft.** Sie dient der Rüstung; Haushalt, Zentralbank, Rechtsstaat, Wähler sind nicht das Kernmodell.
- **Friedenskonferenzen sind Punkte-Auktionen.** War Score, Demand-Kosten, Contests, Influence-Modifier — mechanisch nachvollziehbar, aber politisch beliebig. Genau das, was NWO bei der Mediation besser machen will ([HOI4 Wiki: Peace Conference](https://hoi4.paradoxwikis.com/Peace_conference)).
- **Logistik ist mächtig, aber opak.** Supply-Hubs, Railways, Motorisierung, Luftversorgung: viel Tiefe, aber schwer zu lesen; Frust ist ein bekanntes Problem ([HOI4 Wiki: Logistics](https://hoi4.paradoxwikis.com/Logistics)).
- **DLC-Power-Creep und Content-Fragmentierung.** Das Grundspiel fühlt sich ohne DLCs unvollständig an; neue Fokusbäume sind oft stärker als alte.

**Was NWO übernehmen sollte:**

- Materielle Knappheit als **Umsetzungskapazität**: Geld, Personal, Material, Genehmigungen, Zeit. Nicht als Kriegsproduktion.
- Die Karte als **primäre räumliche Entscheidungsfläche**, aber mit echten Verwaltungsgrenzen und echten Daten.
- Langfristige Ziele als **Agenda**, nicht als Fokusbaum. Die Agenda ist dynamisch, der Fokusbaum ist statisch.
- Die Lektion, dass **Sichtbarkeit** wichtiger ist als Tiefe: Wenn der Spieler den begrenzenden Faktor nicht in 3 Sekunden sieht, hilft die beste Simulation nichts.

**Was NWO nicht übernehmen darf:**

- Division Designer, Waffenproduktion, Frontlinien, Unit-Spam.
- 70-Tage-Wartezeiten und „ein Fokus gleichzeitig".
- Punkte-Auktion-Frieden.
- Die Annahme, dass Außenpolitik im Wesentlichen Krieg ist.

**Konkrete NWO-Spezifikation:**

- `CORE-LOOP.md`: maximal 2–3 Minuten zwischen zwei bedeutsamen Entscheidungen; keine 70-Tage-Dead-Time.
- `MAP-SPEC.md`: „In 3 Sekunden beantwortbar: Wo ist das Problem, wer ist zuständig, was kostet der Weg?"
- `DIP-SPEC.md`: Klauselverhandlung statt Punkte-Auktion.

### 2.2 Democracy 4 — Transparenz und die Grenzen der Abstraktion

**Core Loop:** Politiken als Schalter, Simulation beobachten, Haushalt balancieren, Wiederwahl gewinnen. Democracy 4 simuliert nach eigenen Angaben Tausende virtuelle Wähler und verbindet Politiken, Wählergruppen, Minister, Medien, Dilemmas und Koalitionen ([Positech: Democracy 4](https://www.positech.co.uk/democracy4/)).

**Stärken:**

- **Sichtbare Wirkungsketten:** Jede Politik hat Effekte, Verzögerungen, Nebenwirkungen; das „Warum" ist oft nur einen Klick entfernt.
- **Wählergruppen und Salienzen:** Unterschiedliche Gruppen reagieren unterschiedlich; das erzeugt politische rather than spreadsheet pressure.
- **Minister und Dilemmas:** Sie geben dem System Gesichter und Konflikte.
- **Modding und Bildung:** CSV-Daten, offizielle Modding-Doku, Bildungslizenzen. Das Spiel ist als Lernmedium etabliert.
- **Niedrige Einstiegshürde:** Man kann in einer Stunde eine ganze Partie spielen.

**Schwächen:**

- **Abstraktion ohne Ort.** Keine echten Regionen, keine Karte, keine Verwaltungsrealität. Politik ist ein Set von Sliders.
- **Versteckte Gewichte.** Die Simulation ist ein gewichtetes Netz; die genauen Parameter sind nicht immer nachvollziehbar. Spieler empfinden sie als Blackbox, obwohl die Oberfläche Transparenz suggeriert.
- **Dominante Strategien.** „Fixed Britain in 1 hour" ist eine bekannte Kritik: Wer die richtigen Slider findet, bricht das Modell.
- **UK-Zentrismus.** Die Daten und Themen sind stark britisch; andere Länder sind oft nur Startwerte und Flaggen.
- **Umsetzung und Institutionen fehlen.** Ein Gesetz ist ein Slider, kein Verfahren; Minister sind Modifikatoren, keine Akteure mit eigenen Zielen.
- **Optik und UI.** Funktional, aber nicht atmosphärisch; das Spiel fühlt sich wie ein Politik-Modellbaukasten an.

**Was NWO übernehmen sollte:**

- **Transparente Ketten:** Jede Zahl muss auf eine Quelle, eine Gleichung und einen Akteur zurückführbar sein.
- **Salienz und Verlierer:** Nicht „die Bevölkerung" reagiert, sondern Gruppen mit unterschiedlichen Prioritäten.
- **Minister als Akteure:** Aber mit eigenen Zielen, nicht als Modifikatoren.
- **Modding als Lebensdauer:** Datengetriebene Inhalte von Anfang an mitdenken.

**Was NWO nicht übernehmen darf:**

- Slider als Hauptinteraktion.
- Versteckte Gewichte.
- Ein Land als Startwerte-Set.
- Die Annahme, dass eine Stunde Spielzeit eine ganze Staatsführung abbilden kann.

**Konkrete NWO-Spezifikation:**

- `POL-SPEC.md`: Politiknetz mit Knoten, Kanten, Latenzen, Bedingungen, Quellen; jede Kante hat eine Gleichung und eine Unsicherheit.
- `POL-SPEC.md`: 7–12 Gruppen, aber **regional gewichtet** und mit Überschneidungen; keine doppelte Zählung.
- `TEST-SPEC.md`: „Dominante Strategie"-Test mit automatisierten Agenten, nicht mit drei Menschen.

### 2.3 Civilization VI — Räumliche Entscheidungen und die Grenzen des 4X

**Core Loop:** Erkunden, siedeln, Bezirke bauen, forschen, diplomieren, kämpfen, gewinnen. Rundenbasiert; der Reiz ist „one more turn".

**Stärken:**

- **Raum als Entscheidung:** Bezirke, Adjazenz, Gelände, Ressourcen. Der Ort einer Stadt und eines Bezirks verändert langfristig ihre Möglichkeiten.
- **Langfristige Investitionen:** Bezirke, Wunder, Technologien; Entscheidungen von heute zahlen sich in 50 Runden aus.
- **Mehrere Wege zum Sieg:** Wissenschaft, Kultur, Religion, Diplomatie, Herrschaft; verschiedene Strategien sind viable.
- **Klare Rückmeldung:** Erträge, Wachstum, Produktion; der Spieler sieht, was seine Entscheidungen bewirken.
- **Ästhetik und UI:** Die Karte ist lesbar, die Bezirke sind visuell verankert; das Spiel ist zugänglich.

**Schwächen:**

- **4X-Yields statt Realität.** Nahrung, Produktion, Wissenschaft, Kultur, Glaube sind Spielabstraktionen; sie bilden keine Volkswirtschaft, keine Institutionen, keine Gesellschaft ab.
- **Diplomatie ist ein Menü.** Deals, denunciation, world congress; wenig echte Verhandlung, wenig Bindung.
- **Spätspiel-Slog.** Unit-Spam, Mikromanagement, lange Runden; der Spieler delegiert nicht, er klickt.
- **Bezirksoptimierung als Spreadsheet.** Adjazenzboni können das Spiel in ein Optimierungsproblem verwandeln; die „richtige" Platzierung ist oft ausrechenbar.
- **Leader sind Karikaturen.** Keine Innenpolitik, keine Koalitionen, keine Bürokratie.
- **Weltkongress fühlt sich oft arbiträr an.** Abstimmungen und Resolutionen sind spielmechanisch, nicht politisch erklärt.

**Was NWO übernehmen sollte:**

- **Raum als Entscheidung:** Wo ein Projekt gebaut wird, verändert Kosten, Wirkung, Verlierer.
- **Langfristigkeit:** Infrastruktur und Institutionen wirken über Jahre; der Spieler muss investieren, ohne sofortigen Lohn.
- **Klare Rückmeldung:** Jede Entscheidung muss eine sichtbare, erklärbare Folge haben.
- **Delegation:** Der Spieler soll nicht jede Stadt/jedes Projekt micromanagen; Bezirke/Regionen brauchen Autonomie.

**Was NWO nicht übernehmen darf:**

- Hex-Yields und magische Adjazenzboni.
- Unit-Spam und taktische Kämpfe.
- Diplomatie als Menü-Deal.
- „One more turn" durch Content-Menge statt durch Entscheidungen.

**Konkrete NWO-Spezifikation:**

- `PROJECT-SPEC.md`: Standortlogik, Kosten, Dauer, Risiken, Verlierer; keine Yields.
- `MAP-SPEC.md`: Provinzen und Bezirke als echte Verwaltungseinheiten, nicht als Hex-Felder.
- `UI-SPEC.md`: Delegationsregeln, damit der Spieler nicht in Mikromanagement erstickt.

### 2.4 Suzerain — Figuren, Ton und die Grenzen der Erzählung

**Core Loop:** Politisches Drama lesen, Entscheidungen treffen, Kabinett und Fraktionen managen, Wirtschaft und Außenpolitik balancieren, Amtszeit überleben. Suzerain hat laut Steam über 7.000 englische Reviews, 93 % positiv (Stand 20.10.2026), und mehrere DLCs ([Steam: Suzerain](https://store.steampowered.com/app/1207650/Suzerain/)).

**Stärken:**

- **Figuren und Ton:** Minister, Berater, Gegner haben Stimme, Eigeninteresse und Geschichte. Das politische Milieu fühlt sich echt an.
- **Moralisches Gewicht:** Entscheidungen haben persönliche und politische Kosten; man erinnert sich an sie.
- **Kabinettsgespräche:** Politik wird als Gespräch erlebt, nicht als Slider.
- **Dilemmas:** Es gibt nicht immer eine richtige Antwort; verschiedene Wege sind vertretbar.
- **Marktbeweis:** Suzerain zeigt, dass ernste Politikspiele eine Nische tragen.

**Schwächen:**

- **Blackbox-Ökonomie.** Die Wirtschaft ist abstrakt; Folgen sind oft nicht vorhersehbar, und das Spiel erklärt zu wenig, warum etwas passiert.
- **Trial-and-Error.** Spieler berichten, dass sie erst im Nachhinein verstehen, welche Entscheidung „richtig" war; das kann sich wie Bestrafung anfühlen.
- **Versteckter „richtiger Weg".** Trotz Dilemmas gibt es oft optimale Pfade; Wiederspielbarkeit ist eher „andere Geschichte" als „anderes System".
- **Content-Kosten.** Laut Steam 1 Mio.+ Wörter, 50+ Figuren, viele Szenen; ältere Projektrecherche nannte 450.000 Wörter. Die genaue Zahl ist marketingabhängig, die Größenordnung entscheidend: für eine Person nicht reproduzierbar.
- **Wenig System.** Die Welt reagiert, aber sie simuliert nicht; Karte, Wirtschaft und Militär sind Kulisse.

**Was NWO übernehmen sollte:**

- **Figuren und Ton:** Die Mentorin, Minister und Journalisten müssen wie Menschen klingen, nicht wie Tooltips.
- **Moralisches Gewicht:** Entscheidungen müssen persönliche Kosten haben; nicht jede Folge ist eine Zahl.
- **Kabinettsgespräche als Kern:** Der Schreibtisch und das Gespräch sind die Heimat, nicht das Spreadsheet.
- **Autorisierte Schlüsselszenen:** Nicht alles procedural; die wichtigsten Momente werden geschrieben.

**Was NWO nicht übernehmen darf:**

- Blackbox-Folgen.
- Versteckte richtige Pfade.
- Suzerain-Textbudget.
- Die Annahme, dass Erzählung Simulation ersetzt.

**Konkrete NWO-Spezifikation:**

- `CHAR-SPEC.md`: 5 Kernfiguren mit Ziel, Angst, Geheimnis, Stimme, Beziehung, Gedächtnis.
- `NARRATIVE-SPEC.md`: Szenen-Grammatik, Wortbudget, Autoren-/LLM-Anteil.
- `CONSEQUENCE-SPEC.md`: jede Folge zeigt Ursache, Beteiligte, Unsicherheit, Verlierer.

### 2.5 Angrenzende Referenzen

**Old World.** Charaktere, Order-System, Legitimität, Ereignisse. NWO kann das Order-System als **Aufmerksamkeitsbudget** übernehmen: Der Präsident hat pro Tag/Woche nur wenige „Anweisungen", alles andere wird delegiert. Das ist besser als ein abstrakter „Aufmerksamkeit"-Wert ohne Konsequenz. Quelle: [Old World Wiki: Legitimacy](https://wiki.hoodedhorse.com/Old_World/index.php?title=Legitimacy).

**Frostpunk.** Druck, knappe Ressourcen, moralische Dilemmata, Eskalation. NWO kann daraus lernen, wie man einen **Spannungsbogen** baut: Eine Krise zwingt zu einer Entscheidung, die nächste Krise entsteht aus der ersten. Aber NWO ist kein Survivalspiel; die Stadtaufbau-Logik darf nicht übernommen werden. Quelle: [Frostpunk Wikipedia](https://en.wikipedia.org/wiki/Frostpunk).

**Crusader Kings III.** Figurenbindung, Traits, Stress, Erinnerungen, Intrigen. NWO braucht die **Erinnerungs- und Beziehungslogik**, aber nicht die Trait-Flut und das dynastische Kartenmalen. Quelle: [CK3 Wiki](https://ck3.paradoxwikis.com/Crusader_Kings_III_Wiki).

**Football Manager.** Der Posteingang als Heimat, Delegation, langfristige Bindung. NWO kann die **Inbox-/Schreibtisch-Struktur** und das Gefühl „ich bin der Chef, ich entscheide, was auf meinen Tisch kommt" übernehmen. Keine Quelle nötig; als UX-Referenz.

### 2.6 Warnliste: Realpolitiks, Power & Revolution, Republic

Die politische Simulationsnische hat mehrere Warnbeispiele:

- **Realpolitiks 1–3:** großer Feature-Umfang, aber schwache KI, Bugs, oberflächliche Simulation; Reviews bleiben oft „Mixed".
- **Power & Revolution / Geopolitical Simulator:** extrem breiter Anspruch, komplexe UI, viele Daten, aber schwache Politur und Glaubwürdigkeit; Nische.
- **Republic: The Revolution (2003):** ambitiöses politisches Sandbox-Spiel, das an Scope, KI und Produktionsrealität scheiterte; ein Lehrstück für „zu viel versprochen".

**Was NWO daraus lernen muss:**

- Scope ist ein Produktversprechen, kein Wunschzettel.
- Bugs und fehlende Politur zerstören eine Simulation schneller als fehlende Tiefe.
- „Alles ist möglich" ist ohne glaubwürdige Regeln eine leere Versprechung.
- Die Store-Seite muss die Grenzen ehrlich nennen; sonst enttäuscht das Spiel seine Zielgruppe.

### 2.7 Synthese: Was NWO von wem lernen muss

| Referenz | Stärke | NWO-Übernahme | NWO-Abgrenzung |
|---|---|---|---|
| HOI4 | Materielle Knappheit, Karte, langfristige Ziele | Umsetzungskapazität, räumliche Entscheidungen, Agenda statt Fokusbaum | Keine Kriegswirtschaft, keine Unit-Spam, keine Punkte-Frieden |
| Democracy 4 | Transparentes Politiknetz, Wählergruppen, Modding | Politikgraph, Salienzen, „Warum"-Ketten | Keine Slider, keine versteckten Gewichte, kein UK-Abstrakt |
| Civilization VI | Raum, Langfristinvestitionen, klare Rückmeldung | Standortlogik, Projektwirkungen, Delegation | Keine Hex-Yields, keine Menü-Diplomatie, kein Spätspiel-Slog |
| Suzerain | Figuren, Ton, moralisches Gewicht | Character Bible, Kabinettsszenen, authored key moments | Keine Blackbox, keine versteckten Pfade, kein Suzerain-Textbudget |
| Old World | Order/Attention, Legitimität | Aufmerksamkeitsbudget, Delegation | Kein 4X-Rundenmodell |
| Frostpunk | Druck, Eskalation, moralische Dilemmas | Spannungsbogen, Krisenketten | Kein Survivalspiel |
| CK3 | Figurenbindung, Erinnerung, Intrigen | Memory-Ledger, Beziehungen | Keine Trait-Flut, kein Dynastie-Spiel |
| Realpolitiks/P&R | Warnung | Scope-Disziplin, QA, ehrliche Kommunikation | Kein Feature-Sprawl |

**Die wichtigste Synthese:** NWO muss die **Kausalkette selbst zum Produkt** machen. Der Spieler soll nach jeder Entscheidung drei Fragen beantworten können: Wer zahlt? Wann? Warum? Wenn das Spiel diese drei Fragen nicht in höchstens fünf Gliedern beantworten kann, ist es entweder zu flach oder zu kompliziert. Daraus folgen fünf konkrete Designgrenzen:

- **maximal fünf Glieder** in der angezeigten Kausalkette, danach „Sonstige";
- **20–30 % der Spielzeit** in Szenen, 70–80 % in Karte/Akte;
- **8–12 überlappende Wählergruppen**, nicht sieben Blobs und nicht tausend Individuen;
- **12–20 persistente Figuren** mit Gedächtnis, nicht 50+ wie Suzerain und nicht 5 ohne Profil;
- **eine große Dilemma-Entscheidung alle zwei bis drei Runden**, nicht jede Woche.

### 2.8 Warnliste: Wie politische Simulationen scheitern

Die Vergleichsgruppe ist ernüchternd, und sie ist für NWO relevanter als die Erfolgsgeschichten:

| Titel | Preis/Release | Steam-Reviews (20.10.2026) | Urteil |
|---|---|---|---|
| Realpolitiks 1+2 | 14,99/24,99 €, 2017/2021 | 1.251 Reviews, 62 %; 669 Reviews, 46 % | „Mixed" |
| Realpolitiks 3 | 24,99 €, 24.04.2025 | 308 Reviews, 36 % | „Mostly Negative" |
| Power & Revolution 2023 | 49,99 €, 17.07.2023 | 651 Reviews, 58 % | „Mixed" |
| Geo-Political Simulator 5 | 59,99 €, 22.10.2024 | 718 Reviews, 33 % | „Mostly Negative" |
| Secret Government | 19,99 €, 15.04.2021 | 300 Reviews, 52 % | „Mixed", seit 2022 ohne eigene News |
| Crisis in the Kremlin | 4,99 €, 20.03.2017 | 1.467 Reviews, 84 % | „Very Positive" — kleines, fokussiertes Spiel |
| Republic: The Revolution | Vollpreis, 26.08.2003 | Metacritic 62, Eurogamer 6/10 | Scope-Kollaps: „hunderte Städte" beworben, eine Stadt geliefert |

**Fünf Muster:**

1. **Scope, der schrumpft.** Republic wurde 1998 mit hunderten Städten und einer Million Bürgern beworben; erschienen ist eine Stadt mit ca. 150.000 Bürgern. Wer den Scope sichtbar halbiert, verliert die Erwartung, die er selbst aufgebaut hat.
2. **Zahlen ohne Modell.** In Realpolitiks 3 zeigt ein Tooltip „+0,5 Verschmutzung", tatsächlich steigt der Wert stärker; Unruhe über 50 hat keine Auswirkung; NATO-Mitglieder verlassen das Bündnis ohne Begründung. Das ist der gefährlichste Fehler für NWO: Eine LLM-Schicht erzeugt leicht plausible Zahlen, die keine Funktion im Modell haben.
3. **Akten ohne Entscheidung.** Hidden Agenda erlaubt nur die Wahl zwischen Ministervorschlägen; eigene Vorlagen sind nicht möglich, Vorschläge wiederholen sich. Ein LLM, das nur drei vorformulierte Optionen anbietet, ist Hidden Agenda mit Chatfenster.
4. **Unfertigkeit.** Realpolitiks 3 hatte einen Save-Corruption-Bug; GPS 5 wird mit Abstürzen und Memory Leaks beschrieben. Save-Integrität ist bei einer Ein-Personen-Produktion kein „Polish", sondern Existenzbedingung.
5. **Schweigen und Abkassieren.** Secret Government ist seit Dezember 2022 ohne eigene Ankündigung; Eversim verkauft jährlich eine neue Edition für 59,99 €. Support, der für den Käufer nicht sichtbar ist, ist kein Support.

**Konsequenzen für NWO:**

- Store-Text mit „Was ihr bekommt / Was ihr nicht bekommt"; keine Weltversprechen.
- Save-Format versionieren; 10.000 Save/Load-Zyklen; 20-Jahres-Soak; Save-Bug = Launch-Blocker.
- 30 % der Entwicklungszeit ab Monat 1 für Bugs; acht Wochen Bug-only vor Launch.
- Kein Early Access als QA-Ersatz; falls EA, nur mit stabilem Kern und datierter Roadmap.
- Kill-Kriterien: Demo-Verständnis unter 60 %, LLM-Mapping unter 90 %, Crash-frei unter 99 %, Wishlist unter 7.000 vier Wochen vor Launch.

## 3. Systemaudit: Was wo fehlt

### 3.1 Core Loop und Pacing

**Was da ist:** `PROJEKTPLAN.md` §4 beschreibt den Ablauf „Lage erfassen → Informationen einholen → beraten → entscheiden → Umsetzung verfolgen → Folgen bewerten". `SPIELDESIGN.md` §0–3 beschreibt sieben Säulen, drei Zeithorizonte und die ersten 30 Minuten. `ENTWICKLUNGSPLAN.md` S1 definiert ein Spaß-Tor.

**Was fehlt:**

- **Ein konkreter Tagesablauf.** Was sieht der Spieler morgens, welche 3–5 Karten liegen auf dem Schreibtisch, was kann er delegieren, wann endet der Tag?
- **Eine Entscheidungsdichte.** Wie viele bedeutsame Entscheidungen pro 10 Minuten? Ohne diese Zahl ist „Akten lesen" nicht messbar.
- **Ein Sitzungsbogen.** 30–60 Minuten sind als Ziel genannt, aber nicht in Beats gegliedert (Einstieg, Zuspitzung, Entscheidung, Folge, Cliffhanger).
- **Ein „One more day"-Haken.** Warum macht man weiter, wenn die aktuelle Krise gelöst ist? Die Docs setzen auf Figuren und Erinnerung, aber es gibt kein konkretes Ende-des-Tages-/Ende-der-Woche-Design.
- **Ein Failure-Loop.** Was passiert, wenn eine Reform scheitert? Wie kommt der Spieler zurück? `SPIELDESIGN` §16 hat eine Bilanz, aber keinen spielbaren Umgang mit Niederlagen.
- **Ein Replay-Hook.** Was ist in der nächsten Partie anders? Versteckte Absichten und Zufall sind genannt, aber nicht als liste konkreter Variationen.
- **Onboarding.** Die ersten 30 Minuten sind eine Führung, kein Lehrsystem; es fehlen Tutorial-Beats, Fehlertoleranz und „learn by doing"-Regeln.

**Warum es kritisch ist:** Der größte Risikofaktor im Projektplan ist „korrekt, aber langweilig". Die Docs behandeln das als Testfrage, aber nicht als Designproblem. HOI4 und D4 zeigen: Ein Spiel kann tief und trotzdem zäh sein.

**Fix:** `CORE-LOOP.md` mit:

- Tagesloop (3–5 Briefing-Karten, 1–2 Gespräche, 1 Entscheidung, 1 Folge, Tagesende).
- Entscheidungsbudget: mindestens eine echte Wahl alle 3 Minuten; maximal 2 Minuten Pflichtlektüre pro Entscheidung; keine tote Zeit > 30 Sekunden.
- Sitzungsbogen: 0–10 Min Einstieg, 10–25 Min Zuspitzung, 25–35 Min Entscheidung, 35–45 Min Folge/Cliffhanger.
- Failure- und Replay-Regeln.
- Abnahmekriterium: 5 Testpersonen, 30 Minuten, ≥ 3 erinnerte Entscheidungen, ≥ 60 % wollen weiter.

### 3.2 Wirtschaft

**Was da ist:** `WIRTSCHAFTSMODELL.md` beschreibt 11 Zusammenhänge (Z1–Z11), Zentralbank-Unabhängigkeit, Inflationserwartungen, Wechselkurs, Schulden, Gewinner/Verlierer. `RECHERCHE_INNENPOLITIK.md` liefert Startwerte und Parameter für Großprojekte.

**Was fehlt:**

- **Gleichungen und Einheiten.** Die Zusammenhänge sind Prosa; es fehlen Formeln, Koeffizienten, Wertebereiche, Zeitverzögerungen als Verteilungen.
- **Schließende Buchhaltung.** Haushalt, Defizit, Schulden, Zinslast, Leistungsbilanz, BIP und Geldmenge müssen zusammenpassen. Aktuell gibt es keine Bilanzgleichungen.
- **Sektoren.** Haushalte, Unternehmen, Banken, Staat, Ausland fehlen als explizite Akteure; es gibt keine Kreditvergabe, keine Bankbilanz, keine Anleihemärkte.
- **Steuerinzidenz.** Wer zahlt Einkommen-, Körperschaft-, Mehrwert-, Vermögenssteuer? Wie wirkt die Informalität (24,4 %)? Fehlt.
- **Erwartungsbildung.** Wie werden Inflationserwartungen gebildet, wie reagieren sie auf Glaubwürdigkeit, wie werden sie gemessen? Der „Glaubwürdigkeits"-Wert ist ein Skalar ohne Mechanik.
- **Kalibrierung.** Es gibt keine Schätzungen für Türkei-Parameter, keine Validierung an 2019–2026, keine Sensitivitätsanalyse.
- **Zeitmodell.** `WIRTSCHAFTSMODELL` sagt „Realwirtschaft monatlich, Finanzmärkte täglich"; `SPIELDESIGN` sagt fester Tagesschritt. Die Update-Reihenfolge fehlt.
- **Daten-Vintage.** Statistiken erscheinen verzögert, aber die UI zeigt aktuelle Werte; es fehlt ein Datenmodell für „was wusste der Spieler wann?".
- **Verteilung.** Gini, Reallöhne, regionale Ungleichheit sind erwähnt, aber nicht in die Kerngleichungen integriert.

**Warum es kritisch ist:** Ohne schließende Buchhaltung erzeugt das Spiel scheinpräzise Zahlen, die nicht zusammenpassen. Ohne Kalibrierung ist „Härte" beliebig. Ohne Erwartungsmodell ist die Zentralbank nur ein Regler.

**Fix:** `SIM-SPEC-ECON.md` mit:

- 5 Sektoren (Haushalte, Firmen, Banken, Staat, Ausland), 3 Märkte (Güter, Arbeit, Finanzen), Zentralbank.
- Stock-Flow-Matrix; jede Strömung hat eine Gegenströmung.
- 20–30 Parameter mit Quelle, Bandbreite, Schätzstatus.
- 10 Golden Tests für 90 Tage (Zinssenkung → Wechselkurs → Importpreise → Inflation; Ausgaben → Defizit → Schulden → Zinslast; Abwertung → Bilanz → Importe).
- Kalibrierung an Türkei 2019–2026, mindestens Richtung/Reihenfolge.
- Externe fachliche Prüfung.

### 3.3 Innenpolitik und Wahlen

**Was da ist:** `INNENPOLITIK.md` listet zwölf Politikfelder mit Startwerten, Maßnahmen, typischen Ketten und Verlierern; sieben Wählergruppen. `RECHERCHE_INNENPOLITIK.md` hat zwölf Gruppen, regionale Anker und Salienzen.

**Was fehlt:**

- **Ein kanonisches Gruppenmodell.** 7 Gruppen (INNENPOLITIK), 12 Gruppen (Forschung), 5 Gruppen (S1) — welche gelten? Ohne Einheit ist keine Wahl rechnbar.
- **Eine Wahlformel.** Wie werden Stimmen aus Gruppen, Regionen, Salienzen, Turnout, Parteibindung, Kampagne? Wie werden Sitze verteilt? Wie entstehen Koalitionen? Fehlt.
- **Ein Parteimodell.** CHP, AKP, MHP, YRP, DEM, İYİ, Zafer sind Namen, aber keine Ideologien, Flügel, Führungskämpfe, Organisation.
- **Ein Medienmodell.** Reichweite, Glaubwürdigkeit, Eigentümer, Agenda-Setting, Framing, Social Media; nur qualitativ.
- **Ein Protest-/Repressionsmodell.** Wie wirken Polizei, Justiz, Medienkontrolle auf Trust, Turnout, internationale Reaktion? Fehlt.
- **Ein Korruptionsmodell.** Vergabe, Audits, Leaks, investigative Journalisten; nur als Ereignisvorlage.
- **Ein institutionelles Modell.** Gerichte, Verfahrensdauern, EGMR, Verfassungsgericht; nur Prosa.
- **Regionale Gewichtung.** 81 Provinzen, aber keine Bevölkerungsgewichte, keine Überlappung, keine Wanderung.
- **Politisches Gedächtnis.** Zusagen, Kränkungen, gebrochene Versprechen; als Prinzip, nicht als Schema.

**Warum es kritisch ist:** Die Innenpolitik ist das Herz des Spiels. Wenn Wahlen, Parteien und Medien nicht formalisiert sind, bleibt „Politik" eine Reihe von Events.

**Fix:** `POL-SPEC.md` mit:

- Kanonische Gruppen (7–12), regionale Verteilung, Überschneidungsregeln, Salienzen.
- Wahlmodell: Turnout, Stimmen, Sperrklausel, Sitze, Koalitionsbildung.
- Parteimodell: Ideologieachsen, Flügel, Führung, Ressourcen.
- Medienmodell: Reichweite, Glaubwürdigkeit, Agenda, Skandalverlauf.
- Gedächtnis-Ledger: Zusagen, Verletzungen, Wissen.
- Drei Teststrategien (Populist, Reformer, Autoritär) mit unterschiedlichen, plausiblen Verläufen.

### 3.4 Außenpolitik und Mediation

**Was da ist:** `AUSSENPOLITIK.md` beschreibt eine Beziehungsmatrix, Verträge, Sanktionen, Rüstung, Mediation, sture Regierungen, Geheimoperationen. `RECHERCHE_INNENPOLITIK.md` skizziert ein ZOPA-/Klauselmodell.

**Was fehlt:**

- **Nutzenfunktionen.** Wie bewertet ein Partner Handel, Sicherheit, Vertrauen, Konflikt? Wie werden Issues gewichtet? Fehlt.
- **Reservationspreise/BATNA.** Wie berechnet das Spiel, ob ein Deal in der ZOPA liegt? Die Skizze sagt `bid_A(k) ≥ ask_B(k)`, aber es gibt keine Parameter, keine Schätzung, keine Dynamik.
- **Angebotsgenerierung.** Wie entstehen Gegenangebote, Pakete, Side-Payments? Fehlt.
- **Ratifikation und Umsetzung.** Unterzeichnung, Ratifikation, Implementierung, Monitoring, Snapback; nur Prosa.
- **Internationale Organisationen.** NATO, UN, EU, ICC; keine Verfahren, Vetos, Mitgliedschaften.
- **Innenpolitische Rückkopplung.** Jede Konzession muss bei Wählern kosten; im Modell nicht formalisiert.
- **KI-Akteure.** Wie verhandeln fremde Regierungen? Keine Agentenarchitektur, keine Ziele, kein Gedächtnis.
- **Krieg und Frieden.** Kein Konfliktmodell; `PROJEKTPLAN` §13 bleibt abstrakt.
- **Mediations-Loop.** Die historischen Fälle sind gut, aber es gibt keinen spielbaren Ablauf „wer sitzt am Tisch, was will jeder, was kostet ein Nein".

**Warum es kritisch ist:** Außenpolitik ist das zweite große Versprechen („wie HOI4/Civ"). Ohne formale Verhandlung bleibt sie ein Menü mit Text.

**Fix:** `DIP-SPEC.md` mit:

- Akteure, Issues, Positionen, Salienzen, Reservationspreise, BATNA.
- Angebots-/Gegenangebots-Generator, Paketlogik, Deadline/Druck.
- Ratifikation, Implementierung, Monitoring, Sanktionen.
- Drei Testfälle: Getreideabkommen, EU-Zollunion, Ägäis.
- KI-Verhandlungsagent mit Zielen, Roten Linien, Gedächtnis.

### 3.5 Militär und Sicherheit

**Was da ist:** `PROJEKTPLAN.md` §13, `AUSSENPOLITIK.md` §5, `SPIELDESIGN.md` §12–13: Beschaffung, Lieferung, Ausbildung, Einsatzbereitschaft; aggregierte Konfliktsimulation.

**Was fehlt:**

- **Kräftegliederung.** 481.000 Aktive, 380.000 Reserve; keine Einheiten, Ausrüstung, Readiness, Logistik.
- **Konfliktmodell.** Wie wird ein Gefecht/eine Kampagne aufgelöst? Attrition, Versorgung, Gelände, Moral, Führung? Fehlt.
- **Eskalation.** Schwellen, Abschreckung, rote Linien, internationale Reaktion; nur Prosa.
- **Zivil-militärische Beziehungen.** Militärische Autonomie, Putschrisiko, Kontrolle; für die Türkei zentral, aber nicht modelliert.
- **Geheimdienst.** Aufklärung, Analyse, Täuschung; erwähnt, nicht formalisiert.
- **Rüstungsindustrie.** Baykar/TAI/ASELSAN, Exporte, Triebwerksabhängigkeit; nur Startwerte.
- **Kriegsbeendigung.** Friedenskonferenz/Mediation; konzeptionell verknüpft, aber nicht durchgespielt.

**Warum es kritisch ist:** Das Marketing verspricht „HOI4-artige" Außenpolitik. Wenn Militär nur Kulisse ist, werden Strategen enttäuscht; wenn es zu tief wird, sprengt es den Scope.

**Fix:** Entscheidung: Ist Militär **Kern** oder **Erweiterung**?

- Kern: `MIL-SPEC.md` mit theater-level Modell, 5–7 Fähigkeiten, Readiness, Attrition, Eskalation; ein Testkonflikt.
- Erweiterung: Aus dem Marketing nehmen, im Spiel als „abstrakte Sicherheitslage" führen, keine HOI4-Erwartung wecken.

### 3.6 Großprojekte, Regionen und Karte

**Was da ist:** `GROSSPROJEKTE.md` hat ein gutes Drei-Ebenen-Modell, Projektzustände, Härte-Regeln und ein durchgerechnetes Hafenbeispiel. `RECHERCHE_INNENPOLITIK.md` liefert Gravitations-, Agglomerations- und Kostenüberschreitungsparameter.

**Was fehlt:**

- **Projekttyp-Bibliothek.** Hafen, Bahn, Straße, Flughafen, Damm, Kraftwerk, Krankenhaus, Schule, Wohnung, Industriepark, Kanal, Raumfahrt; jeweils Kosten, Dauer, Risiken, Land, Genehmigungen, Umwelt.
- **Standortlogik.** Wo darf gebaut werden? Eigentum, Zonierung, Umweltprüfung, Erdbebenrisiko, Wasser, Arbeitskräfte, Verkehr.
- **Vergabe/Korruption.** Ausschreibungen, Bieter, Auftragnehmer, Audits, Leaks; nur als Ereignis.
- **Finanzierung.** Haushalt, PPP, Auslandskredite, Garantien, Währungsrisiko; in der Forschung, nicht im Modell.
- **Bauphysik.** Material, Personal, Gerät, Lieferketten; keine Mengen/Preise.
- **Zweitrundeneffekte.** Gravitation ist gut, aber Parameter ungeprüft; keine Input-Output-Tabelle, keine regionale Verflechtung.
- **Karte.** 81 Provinzen plus ~900 Bezirke; kein Datenmodell, kein LOD, keine Performance-Ziele, keine Pipeline.
- **Projektrisiko.** Kostenüberschreitung, Verzögerung, Abbruch, Insolvenz, Nationalisierung; Zustände existieren, Trigger fehlen.

**Warum es kritisch ist:** Großprojekte sind das sichtbarste Alleinstellungsmerkmal. Wenn sie nur aus einem Beispiel bestehen, bleibt es eine Demo.

**Fix:** `PROJECT-SPEC.md` mit 10 Archetypen, Standortregeln, Finanzierung, Risiko, Korruption; `MAP-SPEC.md` mit Datenmodell, LOD, Performance, Pipeline; ein Region-Prototyp.

### 3.7 Figuren, Dialog und Mentorin

**Was da ist:** `SPIELDESIGN.md` §7 beschreibt Personen mit Ziel, Schwäche, Stimme, Beziehung; die Mentorin ist die einzige benannte Figur. `LERNKONZEPT.md` beschreibt ihre Rolle.

**Was fehlt:**

- **Character Bible.** Für 5–8 Figuren: Ziel, Angst, Geheimnis, Stimme, Beziehung, Wissen, Arc. Nur die Mentorin hat einen Namen.
- **Gedächtnis-Schema.** Zusagen, Kränkungen, Gefallen, Geheimnisse; wie gespeichert, wie abgerufen, wie von NPCs genutzt?
- **Dialog-System.** Wann authored, wann LLM? Wie wird Konsistenz, Wissen, Ton validiert? Wie teuer?
- **Szenen-Grammatik.** Setup, Konflikt, Wahl, Folge; wie viele Szenen pro Stunde? Wortbudget?
- **Beziehungsmechanik.** Vertrauen, Respekt, Angst, Zuneigung; wie ändern sie sich, wie wirken sie?
- **NPC-Agency.** Was tun Figuren außerhalb des Bildschirms? Wie verfolgen sie Ziele, wie lügen sie, wie halten sie Informationen zurück?
- **Sensibilität.** Kurdenfrage, 2016, Pressefreiheit, Armenien; Redaktionsprozess fehlt.

**Warum es kritisch ist:** Suzerain zeigt, dass Figuren tragen. Aber Figuren ohne Gedächtnis und ohne eigene Ziele sind teure Kulisse.

**Fix:** `CHAR-SPEC.md` mit 5 Kernfiguren, 20 Szenen, Memory-Ledger, Voice Guide; `NARRATIVE-SPEC.md` mit Szenen-Grammatik und Wortbudget.

### 3.8 UI/UX und Onboarding

**Was da ist:** `SPIELDESIGN.md` §4 ist konzeptionell stark: Schreibtisch als Heimat, Vorgang als zentrales Objekt, drei Zustände (Absicht/Beschluss/Wirkung), „Warum?" auf jede Zahl.

**Was fehlt:**

- **Wireframes.** Kein Layout, keine Navigation, keine Komponentenbibliothek.
- **Informationsarchitektur.** Wie viele Screens, wie tief, wie kommt man zurück, wie sucht/filtert man?
- **Onboarding.** Tutorial-Beats, progressive disclosure, Fehlertoleranz, Glossar.
- **Accessibility.** Schriftgröße, Kontrast, Farbenblindheit, Screenreader, Tastatur, Dyslexie, Photosensibilität.
- **Lokalisierung.** Deutsch zuerst, Türkisch später; Textausdehnung, Fonts, kulturelle Begriffe.
- **Performance.** Karte, 81 Provinzen, 900 Bezirke, Hover/Pick; keine fps-Ziele.
- **Karten-UX.** Layer, Zoom, Auswahl, Vergleich, Zeitreihen; keine Spezifikation.
- **Gesprächs-UX.** Lange Chats, Erinnerung, Zitate, Aktionskarten; keine Spezifikation.
- **Fehlerzustände.** LLM down, Netz weg, ungültige Aktion, Mehrdeutigkeit; keine UX.
- **Save/Load.** Autosave, Versionierung, Migration, Rollback; keine UX.

**Warum es kritisch ist:** Die Oberfläche ist das Spiel. HOI4 und D4 zeigen, dass Lesbarkeit über Erfolg entscheidet. NWO hat die richtigen Prinzipien, aber noch keine konkrete Oberfläche.

**Fix:** Klickbarer Figma/HTML-Prototyp; 5 Usability-Tests; `UI-SPEC.md`; Accessibility-Checkliste.

### 3.9 KI und Sprachschicht

**Was da ist:** `WELTMODELL.md` und `PLANERWEITERUNG.md` KI-00: LLM übersetzt Absichten, Simulation rechnet; Drei-Modi (BYO-Key, lokal, offline).

**Was fehlt:**

- **Aktionsschema.** 12–20 Aktionsklassen (daraus 150–250 konkrete Kommandos) mit JSON-Schema, Vorbedingungen, Effekten, Berechtigungen.
- **Validator.** State-Diff, Invarianten, Budget, Zuständigkeit, Duplikate, Rollback.
- **Intent-Parser.** Mehrdeutigkeit, Referenzen, Negation, Bedingungen, Mehrschrittigkeit, Rückfragen.
- **NPC-Dialog.** Persona, Wissensgrenze, Gedächtnis, Konsistenz, Halluzination.
- **Evaluation.** 50 Anweisungen, 20 adversarialen Eingaben, deutsche Idiomatik, Zahlen, Jailbreaks, Prompt-Injection.
- **Latenz/Kosten.** p95, Token-Budget, Modell-Routing, Caching, Offline-Fallback.
- **Sicherheit/Privacy.** API-Keys, lokale Speicherung, GDPR, Telemetrie, Content-Moderation.
- **Determinismus/Replay.** Prompts/Antworten loggen, Seed, State-Diffs, Reproduktion.
- **Modellwahl.** Welches Modell für Parsing, Dialog, Mentorin? Klein vs. groß, lokal vs. Cloud.
- **Fehlerfälle.** Modell down, Rate-Limit, malformed JSON, Tool-Fehler; UX und Fallback.
- **AI Act.** Kennzeichnung, Transparenz, Risikoklasse.

**Warum es kritisch ist:** Die freie Sprache ist das Alleinstellungsmerkmal. Ohne Vertrag ist sie ein Risiko: Das Modell kann Aktionen erfinden, Zustände ändern oder Befugnisse überschreiten.

**Fix:** `AI-SPEC.md` mit Tool-Schema, Validator, Eval-Harness, Latenz-/Kostenbudget, Security; Prototyp mit 50 Anweisungen.

### 3.10 Daten und Quellen

**Was da ist:** Drei große Rechercheberichte, viele belegte Startwerte, Quellenkultur, GADM-/OSM-/TCMB-/YSK-Analysen.

**Was fehlt:**

- **Stichtag.** Kein fixer Datenstand; Daten versionieren.
- **Quellenregister.** Keine zentrale Datei mit Herausgeber, URL, Zeitraum, Einheit, räumlicher Ebene, Lizenz, Status.
- **Datensatz.** Kein maschinenlesbarer Startsatz; Zahlen liegen im Fließtext.
- **Lizenzmatrix.** TCMB, YSK, Umfragen, OSM, Natural Earth, SRTM, Weltbank; Status offen.
- **Datenqualität.** Belegt/abgeleitet/geschätzt; fehlende Bezirkswerte; Revisionen.
- **Zeitreihen.** Monatlich/quartalsweise/jährlich; Vintage; Veröffentlichungskalender.
- **Alternative Daten.** TÜİK vs. ENAG, offizielle vs. unabhängige Inflation; das ist für ein Spiel über „Statistik-Washing" zentral.
- **Raumdaten.** 81 Provinzen, 900+ Bezirke, Grenzen, Topologie, Codes, Namen; Pipeline.
- **Kalibrierung.** Keine Zielwerte, keine historische Validierung.
- **Datenlücken.** Wie werden sie im Spiel angezeigt? Keine Imputation ohne Flag.

**Warum es kritisch ist:** Ohne Register ist keine Zahl prüfbar, keine Lizenz sauber, kein Startpaket einfrierbar. Die Recherche ist reich, aber nicht operativ.

**Fix:** `DATENREGISTER.md`, `DATA-SPEC.md`, 20 Kernreihen, Stichtag, Lizenzmatrix, Data-Quality-Dashboard.

### 3.11 Lernen

**Was da ist:** `LERNKONZEPT.md` mit sieben Prinzipien, Mentorin, Lernstufen, Lern-Tor.

**Was fehlt:**

- **Lernziele pro System.** Was genau soll der Spieler nach 1 Stunde, 5 Stunden, 1 Amtszeit verstehen?
- **Assessment.** Pre-/Post-Test, offene Fragen, Transfer; „60 % erklären einen Zusammenhang" ist zu grob.
- **Misconception-Handling.** Welche typischen Fehlvorstellungen (Inflation = Preise, Zentralbank = Regler) adressiert das Spiel?
- **Fachliche Prüfung.** Ein Volkswirt ist genannt, aber kein Prozess, keine Checkliste, keine Freigabe.
- **Bias-Review.** Politische Kontroversen, Türkei-Darstellung, Kurdenfrage, 2016.
- **Mentorinnen-Wissen.** Woher weiß sie, was das Modell rechnet? Braucht eine „Model Explanation API", keine freie LLM-Erzählung.
- **Quellen im Spiel.** Jede Erklärung sollte Quelle und Vereinfachung nennen.
- **Lernstufen.** Begleitet/Standard/Allein sind gut, aber nicht mit konkreten Verhaltensregeln hinterlegt.

**Warum es kritisch ist:** Das Lernversprechen ist ein Markenzeichen. Ohne Assessment ist es Marketing.

**Fix:** `LEARNING-SPEC.md` mit 10 Lernzielen, Pre-/Post-Instrument, Expertenpanel, Bias-Review, Quellenangaben.

### 3.12 Technische Architektur

**Was da ist:** `ENTWICKLUNGSPLAN.md` §6: drei Versuche (Karte, Simulation, Sprache); `PLANERWEITERUNG.md` SIM-00/KI-00.

**Was fehlt:**

- **Architekturdiagramm.** Module, Datenfluss, Grenzen, Abhängigkeiten.
- **Zustandsmodell.** Entitäten, IDs, Beziehungen, Versionierung.
- **Event Sourcing/Snapshots.** Was wird geloggt, was ist ableitbar, wie wird geladen?
- **Determinismus.** Fester Tick, Update-Reihenfolge, RNG, LLM-Logging.
- **Save-Format.** SQLite/JSON, Migration, Größe, Performance.
- **Performance.** Karte, Simulation, LLM; Zielwerte.
- **Build/CI.** Tests, Golden Runs, Static Analysis, Packaging.
- **Modding.** Datenformate, Validierung, API; nicht für Launch, aber jetzt mitdenken.
- **Telemetrie/Privacy.** Was wird erhoben, wie opt-in, GDPR.
- **Plattform.** Windows/macOS/Linux, Steam Deck, Mindestspezifikationen.

**Warum es kritisch ist:** Die Engine ist offen; ohne Architektur wird jeder Prototyp ein Wegwerfprojekt.

**Fix:** `TECH-SPEC.md`, drei Spikes mit Abnahmekriterien, CI, Golden Test.

### 3.13 Content-Pipeline

**Was da ist:** `SZENARIEN.md` mit 19 Vorlagen; `SPIELDESIGN.md` mit drei Testfällen.

**Was fehlt:**

- **Event-Schema.** Trigger, Bedingungen, Gewichte, Cooldowns, Varianten, Folgen, Text, Art, Voice.
- **Content-Budget.** Wörter, Szenen, Figuren, Events pro Spielstunde; Kosten.
- **Autoring-Tool.** JSON/YAML, Validierung, Vorschau, Lokalisierung.
- **Qualitätskontrolle.** Historische Genauigkeit, politische Sensibilität, Wiederholung, Ton.
- **Procedural/LLM-Pipeline.** Wie viel wird generiert, wie wird geprüft, wie wird freigegeben?
- **Art/Audio.** Stilguide, Asset-Liste, Budget, Lizenzen.
- **Lokalisierung.** Deutsch/Türkisch/Englisch; Textmenge.

**Warum es kritisch ist:** 19 Vorlagen sind eine Bibliothek, kein Spiel. Ohne Pipeline bleibt Content Handarbeit.

**Fix:** `CONTENT-PIPELINE.md`, Event-Schema, 10 Templates, Wortbudget.

### 3.14 Recht, Vertrieb, Produktion

**Was da ist:** `RECHERCHE_GESAMTBEDARF.md` identifiziert die Risiken; `PLANERWEITERUNG.md` hat LIC-01, NAME-01, VALVE-01, DATA-FREI.

**Was fehlt:**

- **Rechtsregister.** Name, Figuren, Daten, Steam, USK, AI Act, Steuern; Status, Owner, Frist.
- **Budget/Kalender.** 12-Monats-Rahmen, Stunden, Kostenbandbreite, Puffer.
- **Kill-Kriterien.** Wann wird das Projekt gestoppt/verkleinert?
- **Marketing.** Hook, Store-Seite, Screenshots, Trailer, Wishlist-Plan, Demo.
- **Team.** Art, Audio, Übersetzung, QA, Anwalt; wer macht was?
- **Support.** Bugs, Updates, Community, Moderation.

**Warum es kritisch ist:** Diese Punkte blockieren nicht das Design, aber den Vertrieb. Und ohne Budget/Kalender ist „nebenbei" ein offenes Ende.

**Fix:** `LEGAL-REGISTER.md`, `PRODUKTION.md`, `MARKETING.md`, `RISK-REGISTER.md`.

### 3.15 Dokumentation und Konsistenz

**Was da ist:** Über 20 Markdown-Dokumente, über 450.000 Zeichen, viele Querverweise, Versionen.

**Was fehlt:**

- **Index/Glossar/Changelog.** Keine zentrale Navigation, keine Begriffsdefinition, keine Änderungshistorie.
- **Eine Quelle der Wahrheit.** `ENTSCHEIDUNGEN.md` ist es nominell, aber Block B ist nicht eingearbeitet.
- **Widerspruchsliste.** Rolle, Name, S1-Umfang, „nichts blockiert", „alle Faktoren".
- **Archiv.** Alte Versionen liegen in `_archiv_v0.2`, aber nicht alle überholten Stellen sind markiert.
- **Operative Dokumente.** Es fehlen die Spezifikationen, die Implementation ermöglichen: SIM, AI, DATA, UI, POL, DIP, PROJECT, CHAR, TECH, CONTENT.

**Warum es kritisch ist:** Jede Implementierung trifft auf zwei Wahrheiten. Das kostet Zeit und erzeugt Bugs.

**Fix:** `INDEX.md`, `GLOSSAR.md`, `CHANGELOG.md`, `KONSISTENZ.md`; danach die betroffenen Stellen patchen.

## 3.16 Dokumentmatrix: Wo die Lücke sitzt

| Dokument | Was es leistet | Was fehlt / nicht gut ist | Priorität |
|---|---|---|---|
| `PROJEKTPLAN.md` | Vision, Leitprinzipien, Gesamtbild | Rolle/Name/Phasen veraltet; „alle Kernversprechen" überladen | P0 |
| `SPIELDESIGN.md` | Säulen, Oberflächenprinzipien, Testfälle | Kein Tagesloop, keine Entscheidungsdichte, keine Wireframes | P0 |
| `ENTWICKLUNGSPLAN.md` | S0/S1, Meilensteine, Prüfplan | S1 zu groß; Budget/Kalender erst nach M2 | P0 |
| `WIRTSCHAFTSMODELL.md` | 11 Zusammenhänge, Zentralbank, Gewinner/Verlierer | Keine Gleichungen, Buchhaltung, Kalibrierung, Sektoren | P0 |
| `INNENPOLITIK.md` | 12 Felder, Startwerte, Maßnahmen, 7 Gruppen | Kein Wahlmodell, keine Parteien, keine Medien, Gruppen inkonsistent | P0 |
| `AUSSENPOLITIK.md` | Beziehungsmatrix, Verträge, Mediation, dunkle Wege | Keine Nutzenfunktionen, ZOPA-Parameter, Ratifikation, KI-Akteure | P1 |
| `GROSSPROJEKTE.md` | Drei-Ebenen-Modell, Hafenbeispiel, Härte | Keine Projektbibliothek, Standortlogik, Vergabe, Finanzierung | P1 |
| `SZENARIEN.md` | 19 Vorlagen, Härte, Lernmomente | Kein Event-Schema, keine Gewichte/Cooldowns, Content-Pipeline | P1 |
| `AGENDA.md` | 8 Antwortklassen, Empfehlungen, Beispiel | „Jede Eingabe gültig" überverspricht; Aktionsgrenze fehlt | P1 |
| `LERNKONZEPT.md` | Mentorin, 7 Prinzipien, Lern-Tor | Keine Lernziele, Assessment, Bias-Review, Quellen im Spiel | P2 |
| `LAENDERPAKET_TUERKEI.md` | Institutionen, Datenplan, Figurenregeln | Rechercheplan, keine Daten; Stichtag offen | P0 |
| `RECHERCHE_*.md` | Tiefe, Quellen, Gaps | Kein zentrales Register, keine Lizenzmatrix, kein Datensatz | P0 |
| `ENTSCHEIDUNGEN.md` | Verbindliche Projektinhaber-Entscheidungen | Block B nicht eingearbeitet; mehrere Docs widersprechen | P0 |
| `PLANERWEITERUNG.md` | Arbeitspakete, Vorlaufspur, nächste Schritte | Keine Owner/Termine; Prioritäten verschieben sich | P1 |
| `REFERENZ_*.md` | Belegte Designmuster, Warnlisten | Keine eigenen Spieltests; Patchstände unsicher | P2 |

## 4. Die zwölf größten Designschwächen

1. **Der Kern ist ungetestet.** S0/S1 fehlen; alle weiteren Aussagen sind Prognosen.
2. **Der Scope ist zu groß.** S1 ist ein halbes Spiel; die Dokumente wachsen schneller als der Build.
3. **Die Simulation ist Prosa.** Es fehlen Gleichungen, Buchhaltung, Kalibrierung.
4. **Die Daten sind Recherche, kein Datensatz.** Stichtag, Register, Lizenzen fehlen.
5. **Der KI-Vertrag fehlt.** Ohne Schema/Validator ist die freie Sprache ein Risiko.
6. **Die Innenpolitik hat kein Wahlmodell.** Gruppen, Parteien, Medien, Koalitionen sind unformalisiert.
7. **Die Außenpolitik hat kein Verhandlungsmodell.** ZOPA ist eine Skizze, kein Algorithmus.
8. **Das Militär ist weder Kern noch klar delegiert.** Es bleibt ein ungetestetes Versprechen.
9. **Die UI ist Prinzip, keine Oberfläche.** Keine Wireframes, keine Accessibility, keine Performance.
10. **Die Figuren sind Konzept, keine Charaktere.** Nur die Mentorin hat einen Namen.
11. **Die Produktion ist ungeplant.** Kein Budget, kein Kalender, keine Kill-Kriterien.
12. **Die Dokumente widersprechen sich.** Rolle, Name, S1, „alle Faktoren", „nichts blockiert".

## 5. Was ich streichen würde

- 81 Provinzen, zwölf Politikfelder, 18 Szenarien, Weltpolitik und Militär aus S1.
- „Mars", „jedes Ziel", „alle Faktoren", „nichts wird blockiert" aus der Rhetorik.
- Weitere Rechercheberichte vor S0.
- Den Anspruch, alle Kernversprechen im 90-Tage-Prototyp zu prüfen.
- Den Fokus auf Content-Menge vor der Kernschleife.

## 6. Was ich bauen würde

**S1.0 — die eine Vertikale:**

- Eine Region (z. B. Istanbul oder eine Provinz) mit echten Daten.
- Drei Politikfelder: Wirtschaft/Haushalt, Justiz/Medien, Arbeit.
- Fünf Figuren: Präsident, Finanzminister, Zentralbankgouverneurin, Journalistin, Mentorin.
- Drei Ereignisse: Vergabeaffäre, Währungsschock, Mietprotest.
- Eine Wirtschaftskette: Zins → Wechselkurs → Importpreise → Inflation → Wähler.
- Eine Wahl am Ende.
- Eine echte Oberfläche: Schreibtisch, Vorgang, Gespräch, Karte (statisch).
- Kein Militär, keine Weltpolitik, keine 81-Provinz-Simulation.

**Die drei Spezifikationen:**

- `SIM-SPEC.md`: Zustand, Gleichungen, Buchungen, 20–30 Parameter, 10 Golden Tests.
- `AI-SPEC.md`: 12 Aktionen, 50 Anweisungen, Validator, Eval, Latenz/Kosten.
- `DATENREGISTER.md`: 20 Kernreihen, Stichtag, Lizenzen, Qualitätsflags.

**Die drei Tests:**

- S0: 5 Testpersonen, 45 Minuten, Spaß-Tor.
- UI-Test: 5 Testpersonen, 15 Minuten, Verständlichkeit.
- Sim-Test: 90 Tage, reproduzierbar, Bilanzen schließen.

## 7. 30/60/90-Tage-Plan

**30 Tage:**

- S0 durchführen und auswerten.
- Konsistenz-Patch: Rolle, Name, S1, „bearbeitbar vs. umsetzbar".
- S1.0-One-Pager.
- `DATENREGISTER.md` mit 20 Reihen.

**60 Tage:**

- `SIM-SPEC.md` + 90-Tage-Golden-Run.
- `AI-SPEC.md` + 50-Anweisungen-Test.
- Klickbarer UI-Prototyp + 5 Usability-Tests.
- 5 Character Sheets + 10 Szenen.

**90 Tage:**

- S1.0 Vertical Slice spielbar.
- Spaß-Tor + Lern-Tor.
- Go/No-Go für M0.
- Produktionsplan mit Budget/Kalender.

## 8. Quellen

- HOI4 Wiki: [National Focus](https://hoi4.paradoxwikis.com/National_focus), [Peace Conference](https://hoi4.paradoxwikis.com/Peace_conference), [Logistics](https://hoi4.paradoxwikis.com/Logistics)
- Positech: [Democracy 4](https://www.positech.co.uk/democracy4/), [Modding](https://www.positech.co.uk/democracy4/modding.html), [Simulation Values](https://www.positech.co.uk/democracy4/mod_simulation.html)
- Civilization VI: [Offizielles Handbuch](https://downloads.2kgames.com/civilization/vi/manuals/eu/CIV_VI_25TH_ONLINE_MANUAL_ENG.pdf)
- Suzerain: [Steam](https://store.steampowered.com/app/1207650/Suzerain/), [Offizielle Seite](https://www.suzeraingame.com/)
- Vertiefte Referenzanalysen: [REFERENZ_KERNSPIELE.md](REFERENZ_KERNSPIELE.md), [REFERENZ_SPIELGEFUEHL.md](REFERENZ_SPIELGEFUEHL.md), [RECHERCHE_WARNLISTE_POLITSIM.md](RECHERCHE_WARNLISTE_POLITSIM.md)
- Old World: [Legitimacy](https://wiki.hoodedhorse.com/Old_World/index.php?title=Legitimacy)
- Frostpunk: [Wikipedia](https://en.wikipedia.org/wiki/Frostpunk)
- CK3: [Wiki](https://ck3.paradoxwikis.com/Crusader_Kings_III_Wiki)
- NWO-Projektdokumente: [Projektplan](PROJEKTPLAN.md), [Spieldesign](SPIELDESIGN.md), [Entwicklungsplan](ENTWICKLUNGSPLAN.md), [Wirtschaftsmodell](WIRTSCHAFTSMODELL.md), [Innenpolitik](INNENPOLITIK.md), [Außenpolitik](AUSSENPOLITIK.md), [Großprojekte](GROSSPROJEKTE.md), [Szenarien](SZENARIEN.md), [Lernkonzept](LERNKONZEPT.md).

*Hinweis: Patch- und DLC-Stände der Referenzen können sich ändern; die Analyse beschreibt Designmuster, keine tagesaktuelle Balance. Verkaufszahlen sind, wo genannt, Schätzungen.*
