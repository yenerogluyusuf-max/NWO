# Markt, Zielgruppe und Wirtschaftlichkeit – „NWO" (politische Desktop-Strategie)

Recherche-Stand: 28.09.2026. Eigene Erhebung im Zeitraum 28.09.2026. Grundlage der Punkte 1, 3, 5, 6 (Preise, Wishlists, BYO-Key, Regionalpreis-Rahmen) zusätzlich: die Erstrecherche `/Users/yusufyeneroglu/research_notes/NWO Spiel Gesamtbedarf/markt_vergleich.md` (Stand 28.09.2026), deren Zahlen hier nur übernommen werden, wo ausdrücklich „Vorrecherche" vermerkt.

Methodik:
- **Owner-Bänder**: SteamSpy-API (`steamspy.com/api.php?request=appdetails`), Abfrage 28.09.2026. SteamSpy liefert grobe Bänder („200,000 .. 500,000"), Methodik proprietär (u. a. Sampling von Profilen); Free-Keys/Bundles können enthalten sein. **Alle Owner-Angaben sind Schätzungen.**
- **Gamalytic** (API ohne Key gesperrt, Web via Vercel-Checkpoint blockiert) und **VG Insights** (leitet auf Sensor-Tower-JS-App um, ohne JS nicht abrufbar) waren **nicht zugänglich** – siehe Gaps.
- **Review-Mining**: Steam-Appreviews-API (`store.steampowered.com/appreviews/{appid}`), `language=english`, `filter=recent`, `purchase_type=all`, je Titel bis zu 300 positive + 300 negative Reviews (paginiert, Stand 28.09.2026). Themenauswertung per einfacher Keyword-Zuordnung (mindestens ein Treffer im Review-Text); die Anteile sind **grobe Häufigkeiten**, keine qualitativ-kodierte Inhaltsanalyse. Zitierte Reviews sind Einzelstimmen (mit Upvotes der Community), nicht repräsentativ.
- **Preise**: Steam-Store-API (`appdetails`, `cc=us/tr/de`) am 28.09.2026.
- **Gesetzestexte**: gesetze-im-internet.de (amtliche Fassung).
- Suchmaschinen-Zugang war eingeschränkt (Google/Brave/DDG ohne JS blockiert oder gedrosselt; Bing liefert teils unpassende Treffer). Wo direkte Quellenabfrage gelang, sind Primärquellen angegeben.

---

## 1. Belastbarere Verkaufszahlen und offizielle Aussagen

### Takeaway
Offizielle Verkaufszahlen der Studios gibt es weiterhin nicht; belastbar sind nur SteamSpy-Bänder (Suzerain 500k–1 Mio., Democracy 4 200k–500k, Old World 200k–500k, HOI4 5–10 Mio.) und die belegten Fördersummen/Teamgröße von Torpor Games. Der Krafton-Einstieg ist bestätigt, die Investitionssumme wurde nicht veröffentlicht. Positech/Cliff Harris hat keine Verkaufszahlen genannt, aber die Marktsituation 2025 öffentlich eingeschätzt.

### Cited Findings
- **SteamSpy-Owner-Bänder (alle = Schätzung, Abfrage 28.09.2026):**
  - Suzerain (Torpor): 500.000–1.000.000 — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=1207650)
  - Democracy 4 (Positech): 200.000–500.000 — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=1410710)
  - Hearts of Iron IV (Paradox): 5.000.000–10.000.000 — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=394360)
  - Old World (Mohawk Games): 200.000–500.000 — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=597180)
  - Ozymandias (Secret Games Co./Goblinz): 200.000–500.000 — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=1768280)
  - Realpolitiks 1 (Jujubee): 200.000–500.000; Realpolitiks II: 20.000–50.000 — [SteamSpy 553260](https://steamspy.com/api.php?request=appdetails&appid=553260); [SteamSpy 1248060](https://steamspy.com/api.php?request=appdetails&appid=1248060)
  - Grey Eminence (Nestinars): 0–20.000 (Produkt ohne Release; Band aussagearm) — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=1858700)
  - Kerbal Space Program (Squad): 2.000.000–5.000.000 (nur Steam) — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=220200)
  - Power & Revolution (Eversim): 50.000–100.000; Crisis in the Kremlin: 200.000–500.000; Twilight Struggle: 200.000–500.000 — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=467520) (Vorrecherche, dort belegt)
- **Krafton-Investment Torpor Games** (21.11.2025): Konsortium aus Krafton (PUBG, inZOI), 1Up Ventures (Kirkland/USA, Ed Fries) und Sisu Game Ventures (Helsinki) erwirbt **Minderheitsbeteiligung** an der Torpor Games GmbH; „Details zu den konkreten Prozenten und finanziellen Eckpunkten wurden zunächst nicht bekannt" – **kein Betrag veröffentlicht**. Operative/kreative Unabhängigkeit soll gewahrt bleiben. — [Gameswirtschaft](https://www.gameswirtschaft.de/wirtschaft/torpor-games-berlin-suzerain-krafton-vc-211125/)
- **Torpor-Zahlen aus demselben Artikel:** Team **15 Personen** (Co-Gründer Ata Sergey Nowak); Medienboard Berlin-Brandenburg fördert *The Conformist* mit **425.000 €** Produktionsförderung, den Suzerain-DLC „Vanguard" mit **300.000 €**; der Bund steuerte **77.341 €** zur Mobile-Version von Suzerain bei. — [Gameswirtschaft](https://www.gameswirtschaft.de/wirtschaft/torpor-games-berlin-suzerain-krafton-vc-211125/)
- **Cliff Harris (Positech, Democracy-Reihe)** ohne Verkaufszahlen, aber zur Marktlage: „the percentage of indie game developers actually making a living? There is no real data on it, but anecdotally it looks pretty bad"; Warnung vor Nischen-Übersättigung (Beispiel Tavern-Sims: 958 Treffer); Empfehlung „do your homework on which genres are better than others in terms of revenue"; eigener Werdegang: nebenberuflich entwickelt, einmal gescheitert, 5 Jahre AAA, endgültiger Ausstieg erst als Teilzeit-Erlöse das Gehalt erreichten. — [Positech-Blog 08.11.2025](https://www.positech.co.uk/cliffsblog/2025/11/08/is-indie-game-dev-even-viable-as-a-business-in-2025/)
- **Democracy als Lernmedium (Positech-Aussage):** Harris verkauft „educational site licenses" der Democracy-Reihe „pretty much since I started making them"; eine „long list of educational establishments around the world" nutze das Spiel; er betreibe das Bildungsgeschäft bewusst wenig wegen Aufwand bei Akkreditierung/Bürokratie. — [Positech-Blog 27.01.2023](https://www.positech.co.uk/cliffsblog/2023/01/27/using-democracy-4-to-teach-politics-and-economics/)
- KSP: „In the hours after its Steam early access release on 20 March 2013, Kerbal Space Program was one of the platform's top 5 best-selling games"; **keine Lifetime-Unit-Zahl im Artikel**; Nutzung durch NASA/ESA dokumentiert. — [Wikipedia: Kerbal Space Program](https://en.wikipedia.org/wiki/Kerbal_Space_Program)

### Inferences
- Für NWO ist der realistischste Referenzrahmen „Suzerain-Schicht": 200k–1 Mio. Owner bei 15–20 € in einer Nische; HOI4 ist keine Vergleichsstufe für Einzelentwicklung.
- Die Fördersummen (425k/300k €) zeigen, dass selbst ein preisgekröntes Kleinstudio für neue Projekte öffentliche Förderung einplant – ein Indiz für Kosten-/Finanzierungsniveaus auch im Nischen-Segment.
- Die Owner-Bänder benachbarter Titel (Ozymandias, Twilight Struggle, Crisis in the Kremlin alle 200k–500k) deuten darauf hin, dass das Band 200k–500k der „normale" Erfolgsfall eines gelungenen Nischen-Strategiespiels auf Steam ist – Suzerain ist die Ausnahme nach oben.

### Gaps
- Keine offiziellen Unit-/Umsatzzahlen von Torpor, Positech, Mohawk, Jujubee in den geprüften Quellen.
- Gamalytic und VG Insights (beide im Auftrag genannt) technisch nicht abrufbar (API-Key/JS-Gate) – deren Schätzungen fehlen vollständig; siehe Abschnitt 9 für die Median-Erlöse aus Sekundärquellen.
- Krafton-Investitionshöhe nicht öffentlich.
- KSP-Lifetime-Verkäufe (außerhalb Steams, z. B. Konsolen/Mobile) nicht belegt.

---

## 2. Systematisches Review-Mining: Suzerain, Democracy 4, Realpolitiks

### Takeaway
Die Review-Texte zeichnen ein klares Anforderungsprofil für NWO: Spieler von Suzerain loben Entscheidungsdruck, Figuren und Wirkungsgefühl, kritisieren aber fehlendes Feedback zu Politikfolgen, „einen richtigen Weg"/Trial-and-Error und die Erwartungshaltung „echte Simulation vs. Visual Novel". Democracy-4-Kritik zielt auf Flachheit, dominante Lösungswege und mangelnde Ländervielfalt. Realpolitiks ist die Warnliste: Bugs, kaputte Saves, schlechte Tutorials, leere Versprechen von Tiefe.

### Cited Findings
**Methodik:** englische, aktuelle Steam-Reviews (API, `filter=recent`), Keyword-Häufigkeiten = Anteil der Reviews mit ≥1 Treffer.

**Suzerain** (11.924 Reviews gesamt, „Very Positive"; Stichprobe 300 pos / 300 neg):
- Negative Reviews: Tiefe/Simulations-/Entscheidungs-Begriffe 159/300, Support/Updates 95/300, Text/UI 65/300, Replay 46/300, Preis 44/300, Präsentation 49/300, Tutorial 35/300, Balance 28/300, Bugs 22/300.
- Positive Reviews: Tiefe/Entscheidungen 103/300, Support/DLC 45/300, UI 41/300, Replay 35/300, Textlastigkeit 32/300, Präsentation (Musik/Art) 31/300. — [Steam-Reviews-API](https://store.steampowered.com/appreviews/1207650?json=1&language=english&filter=recent&num_per_page=100)
- **Kritikthemen negativ (anhand meistbewerteter Reviews):**
  - *Fehlendes Feedback / Blackbox:* „a huge disconnect between the decisions you make and the events that unfold"; „lack of information provided as to the effects [of] policies"; Budget-Mechanik „very poorly explained" (73 bzw. 56 Upvotes).
  - *Trial-and-Error statt Agentie:* „punishes you way too severely for not playing 'the right way'" (93 Upvotes); „trial and erroring your way through the specific paths the devs created"; „you have no actual agency … two choices: follow the sole path for a 'positive' outcome or be punished".
  - *Erwartungslücke Genresignatur:* „This is not a political sim game, but a mere visual novel"; „stats, skill-trees, and general outlines" erwartet; „politics … just exists as a tool to move the plot" (44–73 Upvotes).
  - *Onboarding/Erklärung:* Wirtschafts-Patch erschwere den Einstieg („degrades the new player experience", 68 Upvotes).
  - *Vorwurf aus Community-Review:* Codex-Einträge plagiierten Wikipedia-Artikel (62 Upvotes; **Einzelbehauptung, nicht offiziell bestätigt**, hier nur als Review-Content dokumentiert).
- **Lobthemen positiv:** Konsequenzen/Moral-Dilemmata, „feeling of being a president", Musik, DLC Rizia mit „insane replay value", Dyslexie-Font-Option wird ausdrücklich gelobt.

**Democracy 4** (6.409 Reviews gesamt, „Very Positive"; Stichprobe 300 pos / 300 neg):
- Negative Reviews: Tiefe/Politik-Begriffe 101/300, UI 60/300, Preis 57/300, Support 55/300, Bugs/Abstürze 38/300, Balance 36/300. — [Steam-Reviews-API](https://store.steampowered.com/appreviews/1410710?json=1&language=english&filter=recent&num_per_page=100)
- **Kritikthemen negativ:**
  - *Flachheit/Schein-Simulation:* „the game is too barebones to be a fulfilling sim. There's no government being simulated here" (78 Upvotes); „feels like it should be the mechanic running under a 4X game" (96 Upvotes).
  - *Dominante Lösungswege/Exploits:* „Fixed Britain in 1 hour" (Taxes hoch, Renten kürzen, Polizei hoch; 52 Upvotes); „I have never lost a single game … so long as I did that at the start" (positive Review, 20 Upvotes) – Balance-Problem bestätigt aus beiden Lagern.
  - *Wiederholung/Preis:* „Gets repetitive very fast … not recommend full price" (46 Upvotes); Kritik an Länderbasis (10 Länder, 6 weitere als Paid-DLC, 56 Upvotes).
  - *Technik:* „constantly crashes and slows down after an hour of one session" (54 Upvotes).
  - *Inhaltliche Reibung:* Reviews beider politischer Richtungen beklagen verzerrte Anreize/„nicht ehrliches" Balancing (47 bzw. 38 Upvotes) – neutrale Formulierung: Modellannahmen werden als parteilich empfunden.
- **Lobthemen positiv:** „educational and enlightening", „Sim City for politics", große Replayability, DLCs „not overpriced".

**Realpolitiks 1 + 2 – Warnliste** (RP1: 1.247 Reviews „Mixed", Stichprobe 300 pos / 225 neg; RP2: 668 Reviews „Mixed", 103 pos / 139 neg):
- RP1 negativ: UI/Interface 73/225, Bugs 55/225, Preis 51/225, Support 57/225, Tutorial 28/225.
- RP2 negativ: Bugs 70/139, UI 52/139, Support 48/139, Tiefe 35/139. — [Steam-Reviews-API RP1](https://store.steampowered.com/appreviews/553260?json=1&language=english&filter=recent&num_per_page=100); [RP2](https://store.steampowered.com/appreviews/1248060?json=1&language=english&filter=recent&num_per_page=100)
- **Kernkritik (meistbewertet):** Tutorial erklärt kaum (190 Upvotes); „Tries to do everything and does it poorly"; „Very shallow, it does not deserve the simulation tag" (79 Upvotes); konkrete Bugs: „GDP growth is calculated as an integer", „Schrödinger's France", „save file will destroy itself" (39–91 Upvotes); bei RP2: „The game has been abandoned … developers have mostly ghosted the community" (39 bzw. 19 Upvotes); Performance-Einbruch nach Spieljahr 2050; Börsen-Exploit „6.000 → 80.000.000".
- Positiv wird bei RP1/2 vor allem das Grundkonzept gelobt („every country in the world", zugänglich für das Genre), ebenso Moddierbarkeit bei RP2 – das Bestätigungsmuster „Idea gut, Umsetzung schlecht" zieht sich durch.

### Inferences
- **Anforderungsliste NWO (abgeleitet aus Review-Muster):** (1) Politikfolgen transparent machen (Wirkungsanzeige von Maßnahmen, Budget sichtbar erklärt), (2) mehrere lebensfähige Wege statt eines „richtigen Pfads", (3) klare Genresignatur (Karte/Strategie-Ebene sichtbar auf Capsule/Store/Demo), (4) Tutorial, das Wirtschaftsmechanik erklärt, (5) Stabilität (Save-Sicherheit, lange Sessions), (6) Länder-/Kampagnenvielfalt über DLC planbar machen, (7) Barrierefreiheit (Font-Option) wird honoriert.
- **Warnliste Realpolitiks:** Kein „Alles-Simulation"-Versprechen auf der Store-Seite, das die Mechanik nicht hält; keine Early-Access-typische Fehlerquote in Reviews; Community-Kommunikation ernst nehmen („ghosted" ist der häufigste Abbruchgrund).
- Die bei Suzerain negativ bewertete „Textlastigkeit" ist zugleich Kaufmotiv (Story/Dilemmata) – sie ist kein Abschaff-, sondern ein UI-/Pacing-Problem (Geschwindigkeit, Skippbarkeit, Zwischenstände).

### Gaps
- Keyword-Methode ist grob; „depth"-Begriffe überschneiden sich mit Genre-Wörtern („simulation", „political") – einzelne Anteile nicht als präzise Quote lesen.
- Nur englische Reviews; türkische/deutsche Review-Texte (für NWO relevant) wurden nicht ausgewertet.
- Keine Auswertung der Refund-Gründe (Steam-API liefert sie nicht).

---

## 3. Zielgruppenmarkt: Strategy-Genre, Marktvolumen, Wishlists

### Takeaway
Steam 2025: Rekordumsatz ~17,7 Mrd. USD brutto, davon Indie-Spiele ~25 % (~4,4 Mrd. USD) – die Nische ist finanziell tragfähig, aber der Wettbewerb um Sichtbarkeit wächst. Wishlist-Konversion bleibt mit 10,5 % Median (Woche-1 0,17x bei >10k Wishlists) und 10–20-facher Streuung ein unsicherer Prognosehebel.

### Cited Findings
- **Marktvolumen Steam 2025:** „all games on Steam collectively earned a record $17.7 billion" (01.01.–19.12.2025); „indie games alone generated about $4.4 billion"; fünf Indie-Hits 2025 allein ~3 % des Steam-Jahresumsatzes; Quelle der Zahlen: Alinea-Analytics-Auswertung. — [WN Hub](https://wnhub.io/news/analytics/item-49645); identisch in Vorrecherche: 5.863 Spiele überschritten 2025 die 100.000-$-Jahresumsatz-Marke — [Notebookcheck/Alinea](https://www.notebookcheck.net/Indie-games-accounted-for-25-of-Steam-s-revenue-in-2025.1189429.0.html) (in dieser Recherche nur via Cache/Referenz, Seite Cloudflare-gesperrt)
- **Wishlist-Konversion:** Median „wishlist-to-sales ratio" aller Releases Aug–Okt 2024 mit ≥5.000 Launch-Wishlists: **10,5 %**; Median Week-1-Konversion bei Launch mit >10.000 Wishlists: **0,17x** (also 50k Wishlists → 8.500 Week-1-Verkäufe), Spanne „as low as 10% of that, and as high as 10x that" – „the performance range … varies by 10-20x, not 10-20%". — [Game World Observer/GameDiscoverCo](https://www.gameworldobserver.com/2024/12/06/wishlist-to-sales-ratio-steam-gamediscoverco-benchmark); [GameDiscoverCo](https://newsletter.gamediscover.co/p/the-state-of-steam-wishlist-conversions)
- **Genre-Signal:** Old World wird auf Steam primär getaggt: Strategy, Simulation, 4X, Grand Strategy, Turn-Based, Historical – die Tag-Cloud der Nische ist also vorhanden; vergleichbare „Political Sim"-Tags trägt Suzerain (Visual Novel, Political Sim, Choices Matter, Story Rich). — [SteamSpy Old World](https://steamspy.com/api.php?request=appdetails&appid=597180); [SteamSpy Suzerain](https://steamspy.com/api.php?request=appdetails&appid=1207650)
- Publikumsversorgung der Nische über Reddit: r/suzerain existiert als eigener Subreddit (im Suchergebnis zur Steam-Seite/Community gelistet), Paradox-nahe Subs sind etablierte Diskussionsorte (Vorrecherche). — [Steam-Suchtreffer via Bing, Query „Suzerain sales figures"](https://www.bing.com/)

### Inferences
- Das Tag-Ökosystem „Political Sim / Grand Strategy / Story Rich" ist die Such- und Sichtbarkeitsinfrastruktur für NWO; die Kombination aus Karte (Grand-Strategy-Tag) und Figuren/Dilemmata (Political-Sim-/Story-Tags) ist in der Tag-Cloud unbesetzt – Marktlücke bleibt bestehen (Vorrecherche-Befund, durch Tag-Daten hier bestätigt).
- Nach dem Median-Benchmark würde ein Launch mit 25.000–50.000 Wishlists ~2.600–5.250 Week-1-Verkäufe (10,5 %) oder ~4.250–8.500 (0,17x) bedeuten – **Planungsbandbreite, keine Zusage**, wegen der 10–20-fachen Streuung.

### Gaps
- Newzoo-Berichte 2025/26 nicht abrufbar (Cloudflare/JS-Gate); Anteil „Strategy"-Genre am Steam-Umsatz in dieser Recherche **nicht** mit einer Primärzahl belegt.
- Wishlist-Zahlen vergleichbarer Indie-Titel vor Launch (GameDiscoverCo, Dev-Posts): keine öffentlichen Einzelzahlen für politische Simulationen gefunden (Suzerain, Democracy 4, Old World haben keine Pre-Launch-Wishlist-Zahlen veröffentlicht).
- Demografie der Zielgruppe (Alter, Motivation) ohne belastbare Quelle.

---

## 4. Lernspiel-Benchmarks (Edutainment)

### Takeaway
Kerbal Space Program (2–5 Mio. Steam-Owner, EA-Modell ab 2013) und Foldit (240.000 registrierte Spieler, Nature-Lob 2010) belegen, dass ernste Lernspiele große Reichweite erzielen können; Positech betreibt mit der Democracy-Reihe ein funktionierendes Bildungslizenz-Geschäft. Budget Hero war in dieser Recherche nicht verifizierbar.

### Cited Findings
- **Kerbal Space Program:** SteamSpy-Band 2.000.000–5.000.000 Owner (Steam); EA-Start 20.03.2013, „one of the platform's top 5 best-selling games" in den ersten Stunden; 1.0 am 27.04.2015; Adoption durch NASA, ESA, ULA, Rocket Lab, SpaceX dokumentiert; nach Artemis-II-Start (April 2026) neuer CCU-Rekord. — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=220200); [Wikipedia](https://en.wikipedia.org/wiki/Kerbal_Space_Program)
- **Foldit** (University of Washington, kostenlos, kein Steam): „public beta … released in May 2008 and has 240,000 registered players"; Nature-Paper 2010 würdigt 57.000 Spieler, deren Lösungen „matched or outperformed algorithmically computed solutions"; 2016 (Nature Communications): Foldit-Team schlägt trainierte Kristallographen und Algorithmen im Modellbau-Wettbewerb. — [Wikipedia: Foldit](https://en.wikipedia.org/wiki/Foldit)
- **Democracy-Reihe als Lernmedium:** Bildungs-Standortlizenzen seit Beginn der Reihe an Schulen/Hochschulen weltweit; Harris: interaktives Lernen sei „orders-of-magnitude better" als trockene Theorie – aus seiner Sicht der Grund, warum Lehrende das Spiel nutzen. — [Positech-Blog](https://www.positech.co.uk/cliffsblog/2023/01/27/using-democracy-4-to-teach-politics-and-economics/)
- **Suzerain in politischer Bildung:** Die bpb listet Suzerain unter „Games zur politischen Bildung"; Einordnung: „Suzerain stellt Politik als Zusammentreffen von Menschen mit unterschiedlichen Wünschen, Zielen und Interessen dar". — [bpb.de](https://www.bpb.de/) (via Bing-Suchergebnis zur Anfrage „Suzerain sales figures", 28.09.2026; Direktaufruf der Unterseite in dieser Recherche nicht erfolgt)

### Inferences
- Edutainment ist im PC-Markt kein Sondermarkt, sondern ein Qualitäts-/Positionierungs-Label: KSP, Democracy und Suzerain verkau(t)en sich als Spiele und wurden *nebenbei* Lernmedien. Für NWO folgt daraus: Lernmentorin als Feature des Haupttitels, nicht als „Serious Game"-Sondervertrieb.
- Bildungslizenzen (wie bei Positech) sind ein optionaler Zusatzkanal, der laut Harris aber bürokratisch teuer ist – für Einzelentwicklung kein Planungsanker.

### Gaps
- **Budget Hero:** Wikipedia-Artikel nicht vorhanden (404), keine verlässliche Quelle mit Nutzer-/Reichweitenzahlen gefunden – bewusst keine Zahl genannt.
- KSP-Verkäufe über alle Plattformen (Private Division/Take-Two) ohne belegte Lifetime-Zahl in den geprüften Quellen.
- Keine Umsatzzahlen für den Bildungslizenz-Kanal der Democracy-Reihe.

---

## 5. BYO-Key und KI-Spiele

### Takeaway
Bezahlte Steam-KI-Spiele bleiben klein (Vaudeville 20k–50k Owner, „Mixed"; Suck Up! und 1001 Nights unter 20k). Die Review-Reaktion auf KI-Features ist zweigeteilt: Spielwitz/„Gaslighting the AI" wird gelobt, Inkonsistenz, Halluzinationen und fehlende Wirkung der KI auf die Handlung werden negativ bewertet. Veröffentlichte Kosten-Nutzer-Rechnungen pro Spielstunde fehlen in der Öffentlichkeit; das BYO-Key-Modell verlagert die Kosten zum Spieler.

### Cited Findings
- **Vaudeville** (Bumblebee Studios, 19,50–19,99 €, Early Access): SteamSpy 20.000–50.000 Owner, CCU ~2 (28.09.2026); Stichprobe 155 pos / 155 neg Reviews (englisch, aktuell). In **92/155 positiven** und **98/155 negativen** Reviews kommen KI-Begriffe vor – KI ist das Hauptbewertungsthema. — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=2240920); [Steam-Reviews-API](https://store.steampowered.com/appreviews/2240920?json=1&language=english&filter=recent&num_per_page=100)
  - Positiv (Anekdote): „In my native accent, I said 'sup bro' and the AI thought I said 'stop birds' … 15/10" (132 Upvotes); „Gaslighting AI 10/10"; „you can use * to perform actions and holy cow I'm having a blast" (293 Upvotes).
  - Negativ: „the amount of runaround, misinformation, and rambling you get from the AI is absolutely horrendous" (227 Upvotes); „the story does NOT vary between players … only one true scenario" (48 Upvotes) – Erwartungsmanagement-Problem; „I can't recommend the game in its current state for $20"; „Just talk to an AI anywhere else" (35 Upvotes) – Wert-gegen-Preis-Kritik.
- **Suck Up!** (Proxima, 16,99 €): SteamSpy-Band 0–20.000 (Datensatz unvollständig, Tags leer – **Schätzung unzuverlässig**). — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=2726370)
- **1001 Nights / Book of Infinity: 1001 Nights** (Ada Eden, App 2542850): SteamSpy-Band 0–20.000; Steam-Preis 0 (kostenlose Vollversion/Demo-Listing im Abruf); BYO-Key-Präzedenz: Die itch.io-Phase verlangte **einen eigenen OpenAI-API-Key** (Vorrecherche, dort belegt: itch.io Devlog). — [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=2542850); [itch.io Devlog](https://ada-eden.itch.io/1001-nights-official/devlog/724545/1001-nights-llm-configuration)
- **BYO-Key im Modding:** LLM-Dialog-Mods (Skyrim/Fallout) arbeiten mit Spieler-eigenem API-Key – etablierte Praxis (Vorrecherche: [Steam-Diskussion](https://steamcommunity.com/discussions/forum/0/4691154443773688552/)).
- **Steam-KI-Richtlinie:** Disclosure-Pflicht für KI-Inhalte seit Jan 2024; Jan 2026 präzisiert auf ausgelieferte, von Spielern konsumierte Inhalte (Vorrecherche belegt: [Steamworks-News](https://store.steampowered.com/news/group/4145017/view/3862463747997849618); [GamesIndustry.biz](https://www.gamesindustry.biz/valve-slightly-relaxes-ai-disclosure-guidelines-on-steam)).
- **Kostendebatte (Vorrecherche, hier übernommen):** Gamedev-Konsens „most of them just use the API of OpenAI in the background … find out that it's just too expensive in the long run" — [Reddit r/gamedev](https://www.reddit.com/r/gamedev/comments/1ejtg5x/games_what_use_llm_how_do_that_work/)

### Inferences
- Review-Muster für NWO: KI darf **Inkonsequenz nicht zur Handlungslogik** machen (Vaudeville-Kritik), die KI-Leistung muss sich auf Spielzustand auswirken („story does NOT vary" = Vertrauensverlust), und die Kostenfrage muss schon auf der Store-Seite beantwortet sein (BYO-Key transparent erklären).
- Das Zielbild „BYO-Key + optionaler Offline-/Dilemma-Fallback" adressiert genau die drei Vaudeville-Kritiklinien (Zuverlässigkeit, Wert, Erwartung).
- Bei 20k–50k Owner sind heutige Steam-KI-Spiele kommerziell kleiner als politische Nischen-Titel ohne KI-Feature – „KI" allein ist kein Kaufargument.

### Gaps
- **Keine veröffentlichte Kostenschätzung pro Spielstunde** (API-Kosten Spieler vs. Entwickler) aus Devlogs/Reddit in den geprüften Quellen gefunden – die hier genannte Kostendebatte ist qualitativ.
- Keine systematische Auswertung von Steam-Reviews explizit zu „bring your own key" in bezahlten Titeln (die bekannten BYO-Fälle liegen auf itch.io/Modding).
- Inworld/NVIDIA-„generative NPC"-Experimente ohne belastbare Zahlen.

---

## 6. Steam Regional Pricing Türkei/MENA 2026

### Takeaway
Türkei zahlt seit 20.11.2023 USD-Preise (MENA-USD-Region). Live-Daten der Store-API zeigen für Vergleichstitel 47–70 % des US-Preises (Suzerain 9,49 $ vs. 19,99 $; Democracy 4 14,99 $ vs. 29,99 $; HOI4 34,99 $ vs. 49,99 $). Steamworks nennt 37 Währungen und 4 Regionsgruppen mit drei Umrechnungsmethoden; eine öffentliche „Recommended Regional Prices"-Tabelle ist weiterhin nur im Partnerlogin einsehbar.

### Cited Findings
- **Live-Preise (Steam-Appdetails-API, 28.09.2026):**
  | Titel | US | Türkei (MENA-USD) | DE | Anteil TR/US |
  |---|---|---|---|---|
  | Suzerain (1207650) | 19,99 $ | **9,49 $** | 18,99 € | ~47 % |
  | Democracy 4 (1410710) | 29,99 $ | **14,99 $** | 28,99 € | ~50 % |
  | HOI IV (394360) | 49,99 $ | **34,99 $** | 49,99 € | ~70 % |
  — [Steam-Appdetails-API](https://store.steampowered.com/api/appdetails?appids=1207650&cc=tr&filters=price_overview) (analog für 1410710, 394360; `cc=us`, `cc=de`, `cc=tr`)
- **Valve-Rahmen:** „New USD Pricing For Argentina and Turkey beginning November 20th" – offizielle Steam-Support-Meldung zur Umstellung auf USD-Preise. — [Steam-Support](https://help.steampowered.com/en/faqs/view/2720-4EC7-B95A-1D2A)
- **Steamworks-Pricing-Doku:** „The price for each product on Steam is specified and displayed using 37 different currencies and 4 region groups"; drei Umrechnungsmethoden: (1) reiner Wechselkurs, (2) reine Kaufkraft, (3) Multi-Variable (Kaufkraft + Kosten vergleichbarer Unterhaltung + Wechselkurs); Mindestpreis-Schwellen: Basispreis ≥ Multi-Variable-Umrechnung der 0,99-$-Stufe, tiefster Transaktionspreis ~0,49 $, Rabattstaffel nach Preisstufe. — [Steamworks: Pricing](https://partner.steamgames.com/doc/store/pricing)
- **Umstellung Türkei auf USD (Kontext, Vorrecherche):** SteamDB-Blog; Preisstürze/-anstiege bis 2.900 % berichtet — [SteamDB-Blog](https://steamdb.info/blog/steam-turkey-argentina-usd/) (Direktaufruf in dieser Recherche 403/Cloudflare – Inhalt aus Vorrecherche, dort mit Stand 28.09.2026 belegt)

### Inferences
- Empirisch gesetzte MENA-USD-Preise liegen bei Indie-Titeln ~50 % des US-Preises, bei AAA-nahen Titeln höher (HOI4: 70 %). Für NWO (19,99 € / ~19,99 $) läge ein marktüblicher Türkei-Preis bei **~9,49–12,99 USD**.
- Da Türkei USD-Region ist, entfällt die frühere „Billigregion Lira"-Planung; der türkische Markt ist kommerziell kleiner als bei Lira-Preisen, bleibt aber wegen Themennähe relevanter Marketingmarkt.

### Gaps
- Valve-„Recommended Regional Prices"-Tabelle (Multiplikatorliste je Region) nur im Steamworks-Partnerlogin – Multiplikatoren hier indirekt über Live-Preise abgeleitet, nicht aus der amtlichen Tabelle.
- Keine Umsatz-/Kaufkraftdaten für MENA-USD-Region als Zielmarkt.

---

## 7. Early Access vs. Vollrelease, Steam Next Fest

### Takeaway
Early Access senkt die Wishlist-Konversion gegenüber dem 1.0-Launch um etwa ein Drittel; niedrige Preise (bis 10 $) konvertieren besser, die 15–30-$-Stufe am schlechtesten. Ein dokumentiertes Solo-Next-Fest zeigt die Größenordnung „hunderttausende Impressionen → tausende Store-Besuche → hunderte Wishlists".

### Cited Findings
- **EA-Konversion (GameDiscoverCo-Auswertung):** „On average, the conversion of wishlists to sales in Early Access is lower than at full 1.0 launch by third"; Zusammenhang Konversion↔Preis: „For games priced between $1 and $10 … the conversion is higher … Conversion is worst for games priced at $15-30"; bei 95 %+-Bewertung (Overwhelmingly Positive) First-Month-Konversion 0,51. — [GameDevReports/GameDiscoverCo](https://gamedevreports.substack.com/p/gamediscoverco-conversion-benchmarks)
- **Next-Fest-Postmortem „Freerunners" (Solo-Dev James Rowbotham, 22.02.2024):** 154.724 Impressionen (Capsule-Art) → 2.261 Store-Besuche (CTR 1,5 %; ~1/5 extern, 4/5 aus Steam) → **+355 Wishlists** (420 → 755; 15,7 % Visit-to-Wishlist) → +497 Demo-Plays (194 → 691; ~21 % der Besuche); Mediane Demo-Spielzeit 6 Min; Follower 26 → 40; meiste Besuche/Wishlists am ersten Fest-Tag, danach Rückgang; erhöhtes Wishlist-Baseline auch nach dem Fest. Länder der Besucher: USA 29 %, Russland 14 %, Singapur 11 %. — [GameDeveloper.com](https://www.gamedeveloper.com/business/freerunners-steam-next-fest-postmortem)
- Zusätzlich (Vorrecherche): Daumenregeln Tag-1 ~5 %, Woche-1 ~20 %, Jahr-1 ~60 % der Launch-Wishlists; Popular-Upcoming-Schwelle ca. 7.000–10.000 Wishlists/Woche ([IMPRESS](https://impress.games/steam-wishlists-sales-calculator); [Steam Page Analyzer](https://www.steampageanalyzer.com/blog/how-many-wishlists-before-launch)) – Sekundärquellen, nur als Größenordnung.

### Inferences
- Für NWO (narrativ,19,99 €, kein EA) stützen die Daten die Planung **Demo + Next Fest + 1.0-Launch**: EA würde die Konversion senken und bei narrativem Spiel „Momentum" verzehren (Vorrecherche-Schluss, hier durch EA-Drittel-Zahl bestätigt).
- Preisspanne 15–30 $ konvertiert schlechter als 1–10 $, bringt aber höheren Erlös pro Kopf – die 19,99-€-Empfehlung bleibt eine Qualitätsoberkante-Positionierung, kein Konversionsmaximierer.
- Next-Fest-Erwartung für einen Nischen-Titel realistisch einordnen: selbst mit >150k Impressionen blieben im dokumentierten Fall die absoluten Wishlist-Zahlen dreistellig – „hunderte bis wenige tausend Wishlists pro Fest" sind der Normalfall, nicht fünfstellig.

### Gaps
- Keine Next-Fest-Zahlen aus dem Strategiesegment speziell (das Postmortem ist ein Parkour-Spiel); keine Multiplikatoren „Demo-Wishlists → Launch-Verkäufe" aus öffentlichen Dev-Berichten mit Zahlen.
- Postmortems im Politik-/Strategiesegment zu EA (Konversionsverlust-Einzelbeispiele mit Zahlen) nicht gefunden.

---

## 8. Marketingkanäle

### Takeaway
Das Grand-Strategy-YouTube-Ökosystem ist groß (TheSpiffingBrit ~4,49 Mio. Abonnenten), die taktische Paradox-Schicht kleiner (Bokoen1 ~391k, ISP ~330–856k – Extraktion ungenau). Deutsche Fachpresse (Gameswirtschaft, GameStar, Mein-MMO) reagiert auf politische Spiele; Reddit-Communities waren über die API nicht abrufbar.

### Cited Findings
- **YouTube (Kanalangaben/YouTube-HTML, 28.09.2026):** TheSpiffingBrit „4.49M subscribers" (@thespiffingbrit); Zusatzkanal ExtraSpiff 113k. — [YouTube @TheSpiffingBrit](https://www.youtube.com/@TheSpiffingBrit/about)
  - ISP (@isp): Kanal-HTML nennt sowohl „856.000 Abonnenten" (Sidebar-Kopf) als auch „330.000 Abonnenten" (Chips) – **Zahl unsicher**, Größenordnung mehrere hunderttausend. — [YouTube @isp](https://www.youtube.com/@isp/about)
  - Bokoen1 (@Bokoen1): „391.000 Abonnenten" in Chip-Daten, Sidebar zeigt 16.700 – **Zahl unsicher**, Größenordnung mehrere hunderttausend. — [YouTube @Bokoen1](https://www.youtube.com/@Bokoen1/about)
  - Pravus: Handle @PravusGames lieferte 404, @Pravus ist ein anderer Kleinkanal – **Kanal in dieser Recherche nicht verifiziert**.
  - Lennus101: Handle-Abfragen erfolglos – **nicht verifiziert**.
- **Deutschsprachige Fachpresse:** Gameswirtschaft berichtet strukturiert über die Branche (Investitionen, Förderung – Beleg Artikel zu Torpor/Krafton) und betreibt Rubriken „YouTuber, Influencer, Streamer" sowie „Spiele-Liste" zur Gamescom – dortiger Einfluss auf Wahrnehmung politischer Spiele ist plausibel; konkrete Reichweitenzahlen der Outlets in dieser Recherche **nicht** erhoben. — [Gameswirtschaft](https://www.gameswirtschaft.de/wirtschaft/torpor-games-berlin-suzerain-krafton-vc-211125/)
- Suzerain als PR-Fall (Vorrecherche): Spiegel-Test „vielleicht realistischstes Spiel über Politik"; PCGamesN-Liste 2024 „beste politische PC-Spiele" – Fachpresse-Reichweite ist für das Genre belegt.

### Inferences
- Priorität der Ansprache: (1) Paradox-nahes YouTube-Ökosystem (Story-Momente/„broken systems"), (2) deutschsprachige Fachpresse wegen Lokalisierung-deutsch-zuerst, (3) Reddit-Subs der Nische für Wishlists. Konkrete Briefing-Liste erst nach Verifikation der Kanalzahlen erstellen (Extraktion war fehleranfällig).
- TheSpiffingBrits ~4,5 Mio. Abonnenten zeigen die Reichweitenspitze des Genres; realistisch sind Picks bei kleineren Kanälen (hunderttausend-Bereich) mit höherer thematischer Passung.

### Gaps
- **Zuverlässige Subscriber-Zahlen** für ISP, Bokoen1, Pravus, Lennus101 und deutsche Strategie-Streamer (Gronkh-Ökosystem, GameStar-Channel etc.) offen – YouTube-Scraping war mehrdeutig (Sidebar-Daten); Socialblade gesperrt (403).
- Reddit-Mitgliederzahlen (r/GrandStrategy, r/paradoxplaza, r/suzerain, r/gamedev) nicht abrufbar (Reddit-API/HTML lieferten keine JSON-Daten; subredditstats ohne Zahlen im HTML).
- Reichweitenzahlen (Reichweite/UV) von GameStar, Gameswirtschaft, Mein-MMO fehlen.

---

## 9. Aufwand/Erlös Einzelentwicklung

### Takeaway
Der Indie-Markt ist schieflink: Median-Erlöse liegen im dreistelligen bis niedrigen vierstelligen Bereich (Schätzungen 249–996 $ brutto/Jahr-Release), während gelungenes Nischen-Material 200k+ Owner erreicht. Torpor arbeitet mit 15 Personen und Fördermitteln an Nachfolgern; Cliff Harris rät eindringlich zur Genre-Recherche vor dem Ausstieg aus dem Job. Szenario NWO (unten) zeigt: Tragfähigkeit hängt an Sichtbarkeit, nicht am Produktionsaufwand.

### Cited Findings
- **Median-Erlöse (Schätzungen, Vorrecherche mit Ziva/VG-Insights-Ableitung):** Median brutto eines Steam-Spiels 2025 ~249 USD (nach Steam-Cut ~174); Gegenprobe anderer Stichprobe (4.901 Titel): Median ~996 USD, 75 % unter 7.500 USD, nur 10 % über 68.000 USD – als Bandbreite behandeln. — [Ziva](https://ziva.sh/blogs/indie-game-revenue); [Reddit-Analyse](https://www.reddit.com/r/GameDevelopment/comments/1s85nyq/i_analyzed_4900_actionadventureindie_games_on/) (beide aus Vorrecherche)
- **Erfolgstreppe (Vorrecherche/VG Insights):** Debüt im Schnitt ~120.000 USD brutto, drittes Spiel ~209.000 USD; „Hobby"-Stufe (1–2 Personen) ~50.000 USD Lifetime. — [VoxBooster/VG Insights](https://voxbooster.com/blog/indie-game-statistics-2026/) (Vorrecherche)
- **Ausnahmefall Suzerain (Überschlag, eigene Rechnung, nicht belegt):** 500k–1 Mio. Owner × ~19 € → grob 10–20 Mio. € Bruttoumsatz vor Cut/Steuern, plus DLC/Ports – nur als Bandbreite über SteamSpy lesbar.
- **Team-/Förderdaten Torpor (Primärquelle):** 15-köpfiges Team; Medienboard 425.000 € (The Conformist) + 300.000 € (DLC Vanguard); Bund 77.341 € (Mobile-Port). — [Gameswirtschaft](https://www.gameswirtschaft.de/wirtschaft/torpor-games-berlin-suzerain-krafton-vc-211125/)
- **Ratschlag Solo-Dev (Harris):** „Do your homework on which genres are better than others in terms of revenue, have a realistic understanding of what you can build in a fairly short period of time and follow the conventional game marketing advice"; Warnung vor Sättigung kleiner Nischen (958 Konkurrenten in einem Subgenre); Indie als Vollzeitberuf „anecdotally … looks pretty bad". — [Positech-Blog](https://www.positech.co.uk/cliffsblog/2025/11/08/is-indie-game-dev-even-viable-as-a-business-in-2025/)
- **Steam-Cut:** 30 % Standard (gestaffelt 25 %/20 % erst oberhalb 10/50 Mio. USD – für NWO irrelevant; allgemein bekannt, Steamworks-Vertragsrahmen).
- **Konversions-Daten als Planungsgrundlage:** 10,5 % Median (Abschnitt 3); EA-Verlust ~1/3 (Abschnitt 7).

### Inferences
- **Szenariorechnung NWO (Überschlag, Planungsannahmen 19,99 €, 30 % Steam-Cut, keine MwSt-Verrechnung – siehe Abschnitt 10):**
  | Szenario | Wishlists Launch | Verkäufe (10,5–17 %) | Brutto | nach Steam-Cut |
  |---|---|---|---|---|
  | A (schwach) | 10.000 | ~1.000–1.700 | ~20–34 T€ | ~14–24 T€ |
  | B (solide Nische) | 30.000 | ~3.200–5.100 (W1) → Jahr-1 ×2–3 | ~64–102 T€ (W1) / ~200–300 T€ (Jahr-1) | ~45–70 T€ (W1) / ~140–210 T€ (Jahr-1) |
  | C (Suzerain-nah) | 75.000+ | 50.000–100.000 Lifetime | 1,0–2,0 Mio. € | 0,7–1,4 Mio. € |
  Szenario B trägt eine Person in Deutschland (Jahr-1-Betrachtung, vor Steuern); Szenario A nicht. Annahme „Jahr-1 ≈ 2–3× Woche-1" stammt aus Sekundärquellen (Vorrecherche: LaunchQuest/Daumenregeln) und ist unsicher.
- Aufwandsschätzung bleibt (Vorrecherche): 18–36 Monate Solo mit KI-Unterstützung; Torpor-15-köpfig zeigt, dass selbst die Nischen-Spitze nicht Solo skaliert – Scope auf 1 Land/1 Amtszeit begrenzen.
- Frühindikatoren als Entscheidungsgate: Wishlist-Velocity 6 Monate vor Launch, Demo-Retention, Review-Score der Next-Fest-Demo (Überperformer median 91 % User-Score vs. 67 % Unterperformer, Vorrecherche).

### Gaps
- Keine Entwicklungszeit-/Kosten-Postmortems von Suzerain, Democracy 4, Old World mit konkreten Stundenzahlen (Old World/Mohawk: in dieser Recherche kein Postmortem gefunden).
- Median-Erlöse 2024–2026 aus Gamalytic/VG Insights **ersthand** nicht prüfbar (Gates) – Zahlen stammen aus Sekundärzusammenfassungen.
- Erlös „nach Steuern" siehe Abschnitt 10; Publisher-Anteil (falls später gewählt) nicht eingerechnet.

---

## 10. Steuern Deutschland für Einzelentwickler

### Takeaway
Steam-Einnahmen eines in Deutschland ansässigen Einzelunternehmers unterliegen der Einkommensteuer (Tarif 2026: Grundfreibetrag 12.348 €) und – oberhalb des Freibetrags 24.500 € – der Gewerbesteuer (Messzahl 3,5 %, kommunaler Hebesatz). Die Kleinunternehmerregelung (§ 19 UStG) greift bis 25.000 € Vorjahres-/100.000 € laufendes Jahr; darüber 19 % USt, wobei bei B2C-Verkäufen über Steam Valve die Verbrauchersteuern je Land abwickelt (Details siehe Gap).

### Cited Findings
- **Einkommensteuertarif ab 2026:** Grundfreibetrag **12.348 €** (0 %); Progressionszone bis 69.878 € (Formelzonen), 42 % ab 69.879 €, 45 % ab 277.826 €. — [§ 32a EStG](https://www.gesetze-im-internet.de/estg/__32a.html)
- **Kleinunternehmerregelung:** Steuerfreiheit, wenn Gesamtumsatz im vorangegangenen Kalenderjahr **25.000 €** nicht überstiegen hat und im laufenden Jahr **100.000 €** nicht übersteigt (§ 19 Abs. 1 UStG). — [§ 19 UStG](https://www.gesetze-im-internet.de/ustg_1980/__19.html)
- **Umsatzsteuersätze:** 19 % Regelsatz, 7 % ermäßigt für definierte Güter (Spiele-Downloads fallen nicht unter die 7 %). — [§ 12 UStG](https://www.gesetze-im-internet.de/ustg_1980/__12.html)
- **Gewerbesteuer:** Freibetrag **24.500 €** für natürliche Personen/Personengesellschaften (§ 11 Abs. 1 GewStG); Steuermesszahl **3,5 %** (§ 11 Abs. 2); Hebesatz gemeindeabhängig (üblich 200–500 %; effektive Belastung erst oberhalb Freigrenze relevant, Teile anrechenbar auf ESt). — [§ 11 GewStG](https://www.gesetze-im-internet.de/gewstg/__11.html)
- **Betriebsform:** Spieleentwicklung ist gewerbliche Tätigkeit (Gewerbeanmeldung nötig; abzugrenzen von freiberuflicher Tätigkeit – für Software-/Spieleentwicklung regelmäßig Gewerbe).
- **Steuerlast-Szenarien (eigene Überschlagsrechnung auf Basis der Gesetzeswerte; vereinfachter Veranlagungsjahr-Einmaleffekt, keine Steuerberatung):**
  - 20.000 € Gewinn/Jahr → ESt ca. 2.100–2.900 € (ledig/verheiratet), GewSt 0 (unter 24.500 €), Soli nur bei hohen ESt-Beträgen.
  - 60.000 € Gewinn → ESt ca. 14.000–17.000 € zzgl. GewSt ca. 2.500–4.200 € (Hebesatz 350–500 %, gemindert um ESt-Anrechnung).
  - 150.000 € Gewinn → ESt ca. 48.000–52.000 € zzgl. GewSt ca. 13.000–17.000 €.
  - Umsatzsteuer: bis 25.000 €/100.000 €-Schwelle Kleinunternehmer (keine USt-Ausweisung, kein Vorsteuerabzug); darüber 19 % auf eigene Leistungen – bei Steam-Verkäufen an Verbraucher rechnet Steam die lokalen Verbrauchersteuern ab (übliche Handhabung der Plattformen; **hier keine Primärquelle im Detail geprüft**, siehe Gap).

### Inferences
- Die Szenariorechnung aus Abschnitt 9 (Szenario B, ~140–210 T€ nach Steam-Cut) mündet in eine Gesamtbelastung (ESt + GewSt) von grob 30–40 % des Gewinns – für die Tragfähigkeitsrechnung ist mit **~60–70 % des nach-steam-Cut-Betrags als verfügbares Einkommen** zu planen.
- Kleingewerbe-/Kleinunternehmer-Schwelle ist vor allem für das erste Jahr mit DLC-Nachverkäufen relevant: bei Szenario-B-Umsätzen entfällt die Kleinunternehmerregelung sofort, die Buchführung muss von Beginn an USt-fähig sein.
- Gewerbesteuer-Freibetrag 24.500 € wird bei Szenario A (schwach) gerissen, bei kleineren Zusatzeinkünften (Bildungslizenzen) relevant.

### Gaps
- **Steamworks „Taxes FAQ" / „Reporting & Payments":** Die Doku-Seiten waren nur mit Navigations-Shell abrufbar (JS-Inhalt nicht extrahierbar) – die genaue Handhabung von EU-USt/OSS und möglicher Quellensteuer (Formular W-8BEN für Nicht-US-Entwickler) **nicht primär belegt**; vor Gründung durch Steuerberater/Direktorium Steamworks prüfen.
- Hebesatz der konkreten Gemeinde (ortsabhängig) nicht beziffert.
- Keine Fachbeiträge deutscher Steuerberatungskanzleien zu „Steam-Einnahmen Spieleentwickler" in den geprüften Quellen gefunden (Suchzugang eingeschränkt) – die Szenarien basieren ausschließlich auf Gesetzestexten.

---

## Methodische Hinweise für den Report-Writer
- **Schätzungen klar kennzeichnen:** Alle Owner-Bänder (SteamSpy), alle Median-Erlöse (Ziva/Reddit/VG-Insights-Sekundärquellen), die Szenariorechnungen (eigene Überschläge).
- **Widersprüche als Bandbreite:** Median-Erlös 249 $ vs. 996 $ (unterschiedliche Stichproben); Owner-Bänder benachbarter Titel überlappen stark (200k–500k ist kein exakter Wert).
- **YouTube-Zahlen sind unsicher** (Sidebar-Pollution) – im Report nur Größenordnungen nennen oder vor Publikation neu verifizieren.
- **Nicht belegt und nicht erfunden:** Budget Hero, Newzoo-Marktzahlen, KSP-Lifetime-Units, Krafton-Betrag, Wishlist-Zahlen vergleichbarer Titel vor Launch, API-Kosten pro Spielstunde, Reddit-Mitgliederzahlen.
- Politische Bewertungen wurden bewusst nicht aufgenommen; Review-Zitate zur „parteilichen" Modellierung (Democracy 4) sind ausschließlich als Marktrezeptionsdaten dokumentiert.
