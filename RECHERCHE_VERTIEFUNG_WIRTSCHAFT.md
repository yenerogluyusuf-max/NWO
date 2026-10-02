# Recherche-Vertiefung: Wirtschaft und Geld in Strategiespielen

**Stand:** 30. September 2026. Vertiefungs-Recherche zu [RECHERCHE_MECHANIKEN.md](RECHERCHE_MECHANIKEN.md) und [VERBESSERUNGSPLAN_2026-09-30.md](VERBESSERUNGSPLAN_2026-09-30.md). Keine Wiederholung der dort beschriebenen Übernahmen, sondern Vertiefung der Geld-/Kosten-Seite: **Wie ist jede Mechanik bepreist, welche Währung verbraucht sie, wer gewinnt, wer verliert, und was passiert in der zweiten Runde, das das Spiel nicht ansagt?**

**Leitfrage (Auftraggeber):** „Für jede Funktion verstehen, wie sie funktioniert, wie Geld funktioniert, wie Kapital funktioniert, wie man das System ändern kann, welchen Nutzen ein System gibt, was es kostet." — Vorbild-Satz: Democracy 4, Pressefreiheit: kostet Politisches Kapital, bringt die Presse auf die eigene Seite, verärgert westliche Länder, langfristig nützlich.

**Unsicherheitsmarkierung:** `[unverifiziert]` = nicht aus zwei unabhängigen Quellen oder nicht aus Primärquelle (Wiki/Entwickler) bestätigt. Versionsabhängige Werte sind mit Versionsangabe versehen.

**Schema pro Mechanik:** Funktionsweise (mit Zahlen) → Kosten (Währung, Höhe) → Nutzen (kurz/langfristig) → Wer gewinnt / wer verliert → Versteckte und Zweitrunden-Effekte → Übernahme für Staatsräson.

**Unser Bezugssystem (Ist-Stand):** 9-Regler-Haushalt à 5 Stufen mit Paketen, Taylor-artige Zentralbank mit Unabhängigkeitsstufen A/B/C, Politisches Kapital mit Überziehung, 11 Wählergruppen mit Ursachenketten, 4-Dimensionen-Länderbeziehungen, Politiknetz mit 103 Maßnahmen / 412 Kanten / Verzögerungen / Hysterese, Modernisierungsleitern, 10 Minister-Ämter, Haushaltsgesetz jährlich im Oktober (WIR-3), Türkei-Start 2028 (Zentralhaushalt ~18,9 Bio. Lira, Zinsdienst-Anteil ~14,7 % der Ausgaben laut Länderpaket-Vorgaben).

## Inhaltsverzeichnis

1. [Democracy 4](#1-democracy-4)
2. [Victoria 3](#2-victoria-3)
3. [Hearts of Iron 4](#3-hearts-of-iron-4)
4. [Civilization 6](#4-civilization-6)
5. [Suzerain (Sordland + Rizia)](#5-suzerain-sordland--rizia)
6. [Rebel Inc. (Ndemic)](#6-rebel-inc-ndemic)
7. [Crisis in the Kremlin / Ostalgie (Kremlingames)](#7-crisis-in-the-kremlin--ostalgie-kremlingames)
8. [Power & Revolution / Masters of the World (Eversim)](#8-power--revolution--masters-of-the-world-eversim)
9. [Tropico 6](#9-tropico-6)
10. [Kurzprofile: Anno 1800, Cities: Skylines 1/2, Frostpunk](#10-kurzprofile-anno-1800-cities-skylines-12-frostpunk)
11. [Wie Geld in Staatssimulationen fließt — vergleichende Typologie](#11-wie-geld-in-staatssimulationen-fließt--vergleichende-typologie)
12. [Top-15-Übernahmen (nach Wert/Aufwand)](#12-top-15-übernahmen-nach-wertaufwand)

---

## 1. Democracy 4

Quellen: Positech Modding-Doku `mod_policies.html` (positech.co.uk/democracy4/mod_policies.html); Steam Basic Gameplay Guide (steamcommunity.com/sharedfiles/filedetails/?id=2242836711, gespiegelt steamah.com/democracy-4-basic-gameplay-guide/); Cliffskis Blog „Japan's economy in Democracy 4" (positech.co.uk/cliffsblog/2021/06/03/); Cliffskis Blog „It's all about GDP" (positech.co.uk/cliffsblog/category/democracy-4/page/7/); democracygame.fandom.com (Income_Tax, Middle_Income, Earnings); reddit.com/r/Democracy4 (Political capital maximum); en.wikipedia.org/wiki/Democracy_(video_game).

### 1.1 Politisches Kapital (PC): Vier Preise pro Politik

- **Funktionsweise:** Jede Politik ist eine CSV-Zeile (`policies.csv`) mit vier getrennten PC-Preisen: **Introduce** (einführen), **Cancel** (streichen), **Raise** (Regler hoch), **Lower** (Regler runter). Dazu: `Implementation` = Anzahl Runden bis volle Wirksamkeit (oder bis vollständige Streichung), `MinCost`/`MaxCost` = laufende Geldkosten pro Runde bei Reglerstellung 0 bzw. 1, `CostFunction` typischerweise `0+(1.0*x)` (linear), `Cost Multiplier` = Effekte, die die Kosten skalieren, analog `MinIncome`/`MaxIncome` + `IncomeFunction` für Steuer-Politiken. Flag `UNCANCELLABLE` (nicht streichbar), Flag `MULTIPLYINCOME` (Einnahmen-Inputs werden multipliziert statt addiert), `Opposites` (gegensätzliche Politiken löschen sich gegenseitig automatisch), `PreReqs` (Voraussetzungen), `Department` (zuständiges Ministerium).
- **Kosten:** PC pro Aktion; unkontroverse Ausgabenerhöhungen (Beispiel Entwickler: mehr Geld für Community Policing) kosten sehr wenig, kontroverse Symbolpolitiken (Entwickler-Beispiele: Wehrpflicht, Todesstrafe) „vast amounts". Exakte Beispielwerte je Politik sind öffentlich nur über die CSV-Dateien zugänglich und hier nicht einzeln verifiziert `[unverifiziert für Einzelwerte]`; die Struktur (vier Preise, getrennte Kosten- und Ertragskurven) ist primärbelegt.
- **PC-Einkommen:** pro Runde aus Popularität, Parlamentsmehrheit, Minister-Loyalität, Notstands-Bonus in Krisen, Plus-Bonus zu Amtsantritt. **Deckel: 2 × das Runden-Einkommen** (r/Democracy4) — man kann kein unbegrenztes politisches Polster horten.
- **Nutzen:** PC entkoppelt „sich leisten können" (Geld) von „durchsetzen können" (Politik). Kurzfristig kauft PC Veränderung; langfristig zwingt der Deckel zu Priorisierung pro Amtszeit.
- **Wer gewinnt / verliert:** Hohe Mehrheit und loyale Minister erhöhen das PC-Einkommen — also gewinnen große, stabile Regierungen Gestaltungsmacht; Minderheitsregierungen und zerstrittene Kabinette verlieren sie.
- **Versteckte/Zweitrunden-Effekte:** (a) **Minister-Kompetenz multipliziert Geld:** ein schlechter Finanzminister („Chancellor") reduziert real eingetriebene Steuern, ein guter Außenminister drückt Militärkosten (Steam-Guide). (b) **Implementierungsdauer wird ebenfalls durch Minister-Kompetenz verschoben** — derselbe Beschluss ist mit schwachem Minister langsamer und teurer. (c) Cancel kostet eigenes PC: Rückbau einer unpopulären Politik ist eine zweite politische Schlacht, keine Rückabwicklung zum Nulltarif. (d) Der PC-Deckel (2×) bestraft Krisen-Stau: Wer Kapital hortet statt auszugeben, verliert den Überhang.
- **Übernahme für Staatsräson:** Wir haben „Präsidentialer Erlass vs. Parlamentsweg" als zwei Preisspalten vorgemerkt (MECHANIKEN.md) und PK mit Überziehung im Code. Vertiefung: **Vier-Preise-Modell** für jede Maßnahme im Politiknetz: Einführen / Streichen / Verschärfen / Abschwächen sind vier verschiedene PK-Preise — Streichen einer Subvention ist teurer als ihr Aufbau (Realität: Kündigungsverbot-Debatten). Zusätzlich **Kompetenz-Multiplikator der 10 Minister auf Kosten UND Implementierungsdauer** der Maßnahmen in ihrem Ressort (passt zu „Kabinett als Kostenmultiplikator", bereits vorgemerkt) und ein **PK-Deckel** (z. B. 2× Monatszufluss), damit Horten keine dominante Strategie wird.

### 1.2 Steuern: endogene Bemessungsgrundlage (die Laffer-Falle)

- **Funktionsweise:** Steuer-Politiken haben `MinIncome`/`MaxIncome` über den Regler; real eingetriebenes Geld hängt von der **Größe der besteuerten Aktivität** ab, die selbst ein Simulationsknoten ist. Entwickler-Beispiel: Alkoholsteuer erhöhen kann **weniger** Geld bringen, wenn der höhere Preis den Alkoholkonsum stark genug senkt (Steam-Guide). Einkommensteuer: Mittelschicht („Middle Income") opponiert erst ab ~25 % Satz (democracygame.fandom.com/wiki/Income_Tax — Schwellenwert dort genannt).
- **Kosten:** PC fürs Anheben/Senken; Wählergruppen-Groll schwellenabhängig (Gruppen tolerieren Steuern bis zu Gruppen-Schwellen).
- **Nutzen:** kurzfristig Einnahmen; langfristig verändert die Steuer das Verhalten (Konsum, Arbeit, Wohlstandsknoten) und damit ihre eigene Basis.
- **Wer gewinnt / verliert:** Arme vs. Mittelschicht vs. Wohlhabende reagieren auf unterschiedliche Steuerarten; Kapitalisten/Sozialisten als Lager. Bei sehr hohen Steuern steigt **Steuerhinterziehung** als eigener Simulationswert (Wikipedia-Artikel zur Reihe).
- **Versteckte/Zweitrunden-Effekte:** (a) Einnahme-Vorschau lügt, wenn man die Basisreaktion ignoriert — das Spiel zeigt den mechanischen Zusammenhang erst über die Knoten. (b) Wohlstandsklassen sind dynamisch: „Poor Earnings" hoch → Aufstieg in die Mittelschicht (fandom: Earnings/Middle_Income) — Steuerpolitik verändert über Jahre die **Gruppengrößen**, nicht nur die Stimmung. (c) 79 dokumentierte Inputs wirken auf GDP (Cliffski-Blog) — GDP ist der zentrale Knoten: hohes GDP → hohe Steuereinnahmen → Steuersenkungen oder Dienste möglich → Wiederwahl „trivial" (Entwickler-Wortlaut).
- **Übernahme für Staatsräson:** Unsere 9 Haushaltsregler sollten Steuer-Regler mit **endogener Basis** bekommen: z. B. Konsumsteuer (Mehrwertsteuer) senkt den Konsum-Knoten im Politiknetz, der wiederum das Steueraufkommen dämpft — Effekt mit Inertia-Kante und Zweitrunden-Rückkopplung. Schwellen-Opposition pro Wählergruppe (analog „Middle Income ab 25 %"): jede der 11 Gruppen hat je Steuerart eine Toleranzschwelle, unter der nur Groll, über der Mobilisierung (Protest-Kanten) entsteht. Steuerhinterziehung als eigenes Problem mit Hysterese (haben wir als Mechanik-Fragment: Problem-Hysterese bereits umgesetzt) — Türkei-Bezug: informelle Wirtschaft ist real ein Großthema.

### 1.3 Staatsverschuldung und Kreditrating

- **Funktionsweise:** Der Anleihemarkt bewertet das Land **alle sechs Monate** anhand von Schulden/BIP, Defizit/BIP, Stabilität und Inflation und setzt ein **Kreditrating**; der Zinssatz auf den Schuldenstock folgt dem Rating (Cliffski-Blog „Japan's economy"). Intern hartkodiert: maximale denkbare Schuldenquote 250 % des BIP (Entwickler, mit dem Kommentar, dass Japan real darüber liegt — das Spiel triggert für Japan sofort eine Schuldenkrise).
- **Kosten:** Zinsdienst als laufender Budget-Posten; Rating-Verlust verteuert den gesamten Stock, nicht nur neue Schulden.
- **Nutzen:** Defizit erlaubt kurzfristig Dienste ohne Steuererhöhung (Stimmen ohne Schmerz); langfristig wächst der Zinsdienst und verengt den Spielraum.
- **Wer gewinnt / verliert:** kurzfristig alle Empfänger der Ausgaben; langfristig verliert die Regierung Handlungsspielraum, und eine „Debt Crisis"-Situation triggert schwere negative Effekte.
- **Versteckte/Zweitrunden-Effekte:** (a) Die Bewertung ist **diskret** (halbjährlich), nicht kontinuierlich — man kann kurz vor der Bewertung Bilanzkosmetik betreiben. (b) Das Rating klebt am **Stock** (Schulden/BIP), nicht am Fluss — schnelle Defizit-Senkung hilft erst verzögert. (c) Der Entwickler selbst dokumentiert die Modell-Grenze (Japan 250 %+): ein Rating-Modell, das „alle sind entsetzt" annimmt, passt nicht auf Niedrigzins-Welten — Kalibrierung ist Weltkontext, kein Naturgesetz.
- **Übernahme für Staatsräson:** Wir haben Risikoaufschlag/CDS täglich (Außenwelt-Indizes) — das ist realistischer als D4s Halbjahres-Rating. Übernehmen: **Rating als diskrete, klebrige Stufen** (Investment-Grade-Schwelle als Kipppunkt mit Hysterese: unter IG → Zwangsverkäufe durch Fonds, Risikoaufschlag springt stufenweise), zusätzlich zur kontinuierlichen CDS-Anzeige. Und die Entwickler-Lektion dokumentieren: Das Rating-Verhalten muss zum Weltzins-Regime des Szenarios kalibriert werden (2028-Türkei ≠ 2021-Japan). Bezug Türkei-Start: Zinsdienst ~14,7 % der Ausgaben — der Zinsdienst-Regler im 9-Regler-Haushalt ist damit der zweitgrößte Block und muss im UI sichtbar „weich" sein (nicht direkt steuerbar, nur über Defizit/Rating).

---

## 2. Victoria 3

Quellen: vic3.paradoxwikis.com/Treasury (Budget, Kredit, Goldreserve, Investment Pool); vic3.paradoxwikis.com/Economy_laws (Wirtschafts- und Steuergesetze); vic3.paradoxwikis.com/Market (Preisband, MAPI, Shortages, Zollunionen); vic3.paradoxwikis.com/Building (Baukosten/Construction Sector PMs); vic3.paradoxwikis.com/Power_bloc; Dev Diary #71 (paradoxinteractive.com, autonome Investitionen 1.2); reddit r/victoria3 (Steuer-Vergleiche, Preisdeckel-Diskussion).

### 2.1 Staatseinnahmen: sechs Quellen, davon nur eine direkt steuerbar

- **Funktionsweise:** Nationale Einnahmen = **Steuern** (5 Arten, siehe 2.2) + **Zölle** (aus Handelsrouten, Satz per Handelspolitik) + **Prägegewinn/Minting** (= jährliches GDP / 1000 pro Woche, also ~5,2 % des GDP pro Jahr, **Basis-Deckel £200K**; nur Multiplikatoren und Goldminen darüber hinaus) + **Staatsdividenden** (Gewinne staatseigener Gebäude, Effizienz je nach Wirtschaftsgesetz) + **Investment-Pool-Transfer** (überbrückt Baukosten privater Vorhaben) + **diplomatische Pakte** (Tribute, Reparationen, Bankrolling). Ausgaben: Baugüter, Staatslöhne (regelbar relativ zum Normalohn), Militärlöhne, Güter für Staats-/Militärgebäude, Sozialzahlungen (Institution mit Schwelle), Subventionen je Gebäude, Subventionen im Handel, Zinsen.
- **Kosten/Nutzen:** Der Staat ist **nicht** die Wirtschaft: Der größte Hebel (Investitionen) liegt beim privaten Investment Pool (2.4). Wer nur den Staatstopf betrachtet, spielt Vic3 falsch.
- **Wer gewinnt / verliert:** Steuergesetze verteilen zwischen Pop-Schichten (2.2); Minting ist eine verdeckte, gedeckelte Inflationssteuer — fällt gratis an, skaliert aber nicht mit großen Volkswirtschaften.
- **Versteckte/Zweitrunden-Effekte:** Staatsdividenden hängen am Wirtschaftsgesetz: Laissez-Faire erzwingt Privatisierung (der Staat verliert Dividenden, der Pool wächst), Command Economy beschlagnahmt bei Gesetzeswechsel den gesamten Investment Pool in die Staatskasse (einmaliger Vermögenstransfer!) und wandelt private Bauvorhaben in staatliche um.
- **Übernahme für Staatsräson:** Unser Haushalt kennt nur den Staatstopf. Übernehmen: **Prägegewinn/Seigniorage als eigene, gedeckelte Einnahmezeile**, gekoppelt an die Taylor-Zentralbank (bei Stufe C/Selbststeuerung kann der Spieler sie „überziehen" → das ist die Schuldenmonetarisierung, die die Glaubwürdigkeits-Kante triggert — ein sauberer Mechanismus für die real türkische Debatte um TCMB-Gewinnvortrag und Hazine-Gegengeschäfte). Und: **Staatsbetriebe (TÜPRAŞ, THY, BOTAŞ, Ziraat) liefern Dividenden**, deren Höhe am Regler „Staatsunternehmen-Führung" hängt; Privatisierung verkauft die Dividende gegen Einmalerlös (D4 hat dafür sogar einen expliziten CSV-Parameter: `nationalisation GDP percentage` — Verkaufserlös als % des BIP).

### 2.2 Steuergesetze: fünf Gesetze × fünf Stufen, keine Tarifstufen

- **Funktionsweise:** Steuer**gesetz** wählt die Struktur, Steuer**stufe** (sehr niedrig bis sehr hoch) skaliert die Sätze. Aus den Wikis (aktuelle Version):
  - **Verbrauchssteuer-Dominant:** Konsumsteuer-Rate +15 %; Konsumsteuern kosten **Authority** (Autorität als zweite Währung!) pro besteuertem Gut.
  - **Grundsteuer-Dominant (Land-Based):** Land-Steuer +0,2 / +0,275 / +0,35 (Flachsatz pro Pop-Typ).
  - **Kopfsteuer (Per-Capita):** Land + Kopfsteuer +0,4 / +0,55 / +0,7; Einkommensteuer 0+5 %.
  - **Proportional:** Einkommensteuer +10 % / +15 % / +20 %; Dividendensteuer +2,5 % / +5 % / +10 %.
  - **Progressiv (Graduated):** Einkommensteuer +10 % / +12,5 % / +15 %; Dividendensteuer +10 % / +15 % / +20 %.
  - Explizit: **Es gibt keine Tarifstufen** — auch „progressiv" besteuert alle Pops mit demselben Satz; die Umverteilung entsteht nur über die Steuer**art** (Dividenden treffen Besitzende, Kopfsteuer trifft Arme überproportional). Osmanischer Bezug im Spiel: „Millet System" erlaubt Religionssteuer.
- **Kosten:** Jede Steuerstufe hat Nebenwirkungen auf **Legitimität**, **Radikalisierung** der Pops und **Attraktion der regierenden Interessengruppen** (Wiki-Tabelle). Gesetzeswechsel = Legislativprozess mit Erfolgschance, Dauer und IG-Stances (Landowners „strongly endorse" Grundsteuer, Industrialists „strongly endorse" Laissez-Faire usw.).
- **Nutzen:** kurzfristig Einnahmen; langfristig bestimmt die Steuerart, wer investiert (Dividendenbesteuerung senkt den Investment-Pool-Zufluss).
- **Wer gewinnt / verliert:** Kopfsteuer = ärmeren Schichten zulasten, Dividendensteuer = Aristokraten/Kapitalisten zulasten; die Wiki verlinkt je Gesetz die IG-Stances explizit — **das Spiel sagt offen, wer verliert**.
- **Versteckte/Zweitrunden-Effekte:** (a) „Graduated" fühlt sich nach Umverteilung an, ist aber flach — die Umverteilung passiert über die **zusammensetzung** (viele Arme = Kopfsteuer katastrophal). (b) Steuerkapazität: Traditionalism gibt −25 % Taxation Capacity — der Staat kann theoretisch hohe Sätze haben, aber nicht eintreiben. (c) Hohe Steuern ohne Legitimität erzeugen Radikale statt Geld.
- **Übernahme für Staatsräson:** Unser Steuer-Teil des Haushalts sollte **Art × Stufe** trennen: Steuer**mix** (Mehrwertsteuer / Einkommensteuer / Unternehmensteuer / Sonderverbrauch / Vermögensabgaben) als gesetzliche Struktur (Parlamentspfad, PK-teuer) und die **Stufe** als Jahreshaushalt-Regler (Oktober-Ritual, günstiger). Schwellenlogik aus D4 (1.2) kombinieren: Jede der 11 Wählergruppen hat je Steuerart eigene Toleranz. Türkei-Anker: indirekte Steuern dominieren real das Aufkommen (KDV/ÖTV) — das ist ein Inhalt für die Mentorin („Warum besteuern Regierungen gern den Konsum? Weil es leiser eintreibbar ist" — Vic3s Taxation-Capacity-Idee).

### 2.3 Baukosten und Investment Pool: der Staat baut nicht allein

- **Funktionsweise:** Bau geschieht über den **Construction Sector**: jede Stufe liefert Bau Punkte und **kostet Güter zu Marktpreisen** — Baukosten sind also endogen (teures Eisen = teurer Ausbau). Produktionsmethoden staffeln die Gütermixe: Holzbauweise £2.000 je Punkt-Ausbaustufe (£1.000/Bau Punkt), Eisenfachwerk £3.600 (£720/Punkt), Stahlrahmen £5.400 (£540/Punkt), Schweißbau £7.900 (£527/Punkt) — **modernere Bauweise kostet pro Bau Punkt weniger Geld, braucht aber teurere Güter** (Stahl, Glas, Sprengstoff, Strom). Die Aufteilung Staat/Privat regelt das Wirtschaftsgesetz über **Private Construction Allocation**: Traditionalism +25 %, Interventionism/Agrarianism +50 %, Laissez-Faire +75 %, Cooperative +35 %, Command +10 %.
- **Investment Pool:** Pops mit Besitzanteilen legen einen festen Prozentsatz ihrer Dividenden zurück: Dev Diary #71 (Version 1.2): Kapitalisten 20 %, Aristokraten 10 %, Farmer/Ladenbesitzer je 5 %; Effizienz-Modifikatoren je Gesetz obendrauf (Laissez-Faire +25 % für Kapitalisten/Ladenbesitzer, Agrarianism +50 % Aristokraten/Farmer). Hinweis: Die aktuelle Wiki impliziert für Aristokraten inzwischen 20 % Basis (Industry Banned +25 % → „insgesamt 45 %") — versionsabhängig `[unverifiziert, 1.2 vs. aktuell]`. Subsistenz-gebundene Besitz-Pops reinvestieren gedämpft; arbeitereigene Gebäude tragen **nichts** bei.
- **Kosten:** Bau Güter zu tagesaktuellen Marktpreisen; Staat zahlt nur seinen Anteil; Pool-Transfer deckt den privaten.
- **Nutzen:** kurzfristig Kapazität; langfristig ist der Pool der eigentliche Wachstumsmotor — die staatliche Aufgabe ist **Pool-Pflege** (rentable Besitzstrukturen), nicht nur eigener Bau.
- **Wer gewinnt / verliert:** Wer besitzt, investiert: Laissez-Faire stärkt Kapitalisten politisch (mehr Dividenden → mehr politische Stärke); Command Economy enteignet faktisch den Pool einmalig.
- **Versteckte/Zweitrunden-Effekte:** (a) Bau kostet Güter — Schnellbau erzeugt **Eisen-/Stahl-Shortages**, die über das Preisband (2.5) alle anderen Baukosten und Industrien verteuern (Zweitrunden-Inflation durch eigenes Bauprogramm). (b) Dividendensteuer auf den **vollen** Betrag fällig, auch auf den reinvestierten Teil — Dividendensteuer ist indirekt eine Investitionssteuer. (c) Staatliche Löhne sind ein Nachfrage- und Stimmungshebel (Government Wages regelbar relativ zum Normalohn).
- **Übernahme für Staatsräson:** Zwei konkrete Punkte: (a) **Baukosten-Endogenität:** unsere Großprojekte (GROSSPROJEKTE.md) sollten keinen fixen Lira-Preis haben, sondern einen Preis = f(Stahl-/Zement-/Energie-Knoten, Baubranchen-Auslastung) — gleichzeitige Großprojekte verteuern sich gegenseitig (real: türkische Baukosten-Inflation). (b) **Privater Investitionspool als Knoten:** „Private Investitionen" reagieren auf Leitzins (Z1), Risikoaufschlag (Z8) und Vertrauen — der Spieler baut nie direkt Industrie, sondern **bedingt** sie (Zins, Vertrauen, Genehmigungen, Großprojekt-Ausschreibungen). Das passt zur Bauvergabe-Logik (Staatskonzern/privat teuer/privat billig mit Korruptions-Flag, bereits vorgemerkt).

### 2.4 Kredit, Goldreserve, Bankrott

- **Funktionsweise:** **Goldreserve** sammelt Überschüsse; **Soft-Cap = 20 % des Jahres-GDP** (`GOLD_RESERVE_LIMIT_FACTOR = 0.2`) — jeder Überschuss-Pfund über dem Deckel kommt nur noch gedämpft an (Wiki-Beispiel: £10K Überschuss → nur ~£2K mehr Reserve). **Kreditlimit** = Summe der Cash-Reserven aller Gebäude + £100K + 50 % des GDP (Defines `COUNTRY_MIN_CREDIT_*`); Gebäude-Reserven £25K je Stufe (Trade Center £5K, Ownership-Gebäude £10K; Tech „Postal Savings" +20 %). **Zinssatz:** Basis 20 % (additiv: Banking/Central Banking/Mutual Funds/International Exchange/Modern Financial Instruments je −2 %; Treasury Bonds −10 %), multiplikativ: Großmacht −50 %, Major Power −25 %, Laissez-Faire −25 %, Status „unrecognized" +50–100 %. **„Unhealthy"** ab Kredit ≥ 50 % des Limits. **Default:** Bau gestoppt, −5 % Offense/Defense/Throughput, dann **−1 % pro Woche** bis −50 % (Treasury-Wiki); wer wieder positiv bilanziert, ist die Strafe los. **Erklärter Bankrott** löscht Gebäude-Cash-Reserven (Besitz-Pops werden Radikale), decaying Modifier: **+50 % Kreditzins, −25 % Goldreserve-Limit**; Bankrott „kostet" also die privaten Sparkassen der Wirtschaft, nicht nur das Rating.
- **Kosten/Nutzen:** Kredit ist Kriegs- und Kriseninstrument (Defizit-Spending erlaubt); Bankrott ist die Notbremse mit langem Schatten.
- **Wer gewinnt / verliert:** Bankrott trifft **Gebäude-Besitzer** (Cash-Reserven weg → Radikalisierung) — die Last trägt nicht „der Staat", sondern benannte Klassen.
- **Versteckte/Zweitrunden-Effekte:** (a) Das Kreditlimit hängt an der **Substanz der Wirtschaft** (Gebäude-Reserven) — ein reiches Land leiht billiger UND mehr. (b) Goldhorten über dem Deckel ist Geldverbrennen — die Wiki rät explizit zu Reinvestition oder Steuersenkung („let the pops keep the money"). (c) Default pausiert Bau — wer in der Krise baut (Konjunkturprogramm), kann es im Default nicht.
- **Übernahme für Staatsräson:** Unser Schuldenmodell hat Zins/Wachstum-Tragfähigkeit (Z7) und Risikoaufschlag (Z8). Übernehmen: (a) **Kreditlimit als Funktion der Wirtschaftssubstanz** (Bankensektor-Knoten + BIP), nicht als freie Größe; „unhealthy"-Marke (z. B. Schuldenaufnahme > X % des Limits) als Mentorin-Warnung. (b) **Bankrott/Default als Vorgang** (nicht Event-Karte): Bau- und Großprojekt-Stopp, stufenweise wachsender Durchsatz-Malus auf Wirtschaft (−5 % startend, wöchentlich −1 %), Radikalisierung der Sparer-Wählergruppe (Einlagen! real: Türkei-KKM-Einlagen als Spar-Puffer), Rating-Sprung mit Hysterese. (c) **Überschuss-Deckel:** Wer Haushaltsüberschuss fährt, ohne Schulden zu tilgen oder Reserven sinnvoll zu nutzen, bekommt Opportunitätskosten angezeigt (Mentorin: „Geld liegen lassen ist auch eine Politik").

### 2.5 Preisband 25–175 % und Shortage-Kaskade

- **Funktionsweise:** Jedes Gut hat einen Basispreis; Marktpreis = Basispreis × [1 + 0,75 × clamp((KAUF − VERKAUF)/min(KAUF, VERKAUF), ±1)] — also **25 % bis 175 % des Basispreises** (Define `PRICE_RANGE = 0.75`). Beispiel Wiki: Holz (Basis 20) bei 100 Kauf-/120 Verkaufsordern → 17 (−15 %). Kauf- und Verkaufsordern müssen **nicht** gleich sein: Überschuss erzeugt Geld im System, Defizit vernichtet es. **Shortage** ab Verhältnis ≥ 2:1: −5 % Throughput für alle Gebäude mit dem Input, **−1 %/Tag bis −50 %** (−75 %, wenn das Gut lokal ganz fehlt); Abbau nach Lösung nur +1 %/Tag. **MAPI** (Market Access Price Impact, Basis 75 %) mischt lokalen Preis und Marktpreis; Unincorporated −10 %, Traditionalism −15 %, Stock Exchange/Makroökonomie +10/+5 %.
- **Kosten/Nutzen:** Preise sind das Informationssystem des Spiels; wer sie ignoriert, baut ins Verderben.
- **Wer gewinnt / verliert:** Produzenten gewinnen bei hohen Preisen, Verbraucher/Input-Industrien verlieren; Subventionen halten unprofitable Gebäude künstlich (Dauer-Kosten).
- **Versteckte/Zweitrunden-Effekte:** (a) Shortages kaskadieren (Eisen → Stahl → Bausektor → alles) und sind **asymmetrisch klebrig** (schnell rein, langsam raus). (b) Das Preisband ist gedeckelt — extreme Knappheit sieht „nur" wie +75 % aus, obwohl die reale Lücke größer ist; die Shortage-Mali sind die eigentliche zweite Währung der Knappheit. (c) Wert-Schöpfung/Vernichtung durch das Order-Mismatch ist ein implizites Geldmengen-Phänomen.
- **Übernahme für Staatsräson:** Unser Politiknetz kennt Preise nur als nationale Inflation. Übernehmen als **kleine Güterliste mit Preisband**: 4–6 strategische Preise (Energie, Baukosten, Lebensmittel, Miete, Devisen = Wechselkurs, evtl. Stahl) mit Basispreis, Band ±75 % und Shortage-Kaskade bei ≥2:1-Lücken (Miete in Istanbul!, Energie im Winter, Devisen in der Krise). Wichtig ist die **Asymmetrie**: Mieten/Preise kleben nach Schock (Hysterese haben wir schon). Das füttert direkt „wahrgenommene Teuerung" je Wählergruppe (Z11) — Lebensmittel und Miete sind genau die Preise, die Wähler „sehen".

### 2.6 Zollunionen und Märkte

- **Funktionsweise:** Subjekte treten automatisch dem Markt des Overlords bei; **Trade League**-Machtblöcke sind immer Zollunionen; andere Blöcke werden es mit „Market Unification II". Zölle werden innerhalb der Union nach GDP-Anteil geteilt, **Marktbesitzer mindestens 25 %**. Embargo kostet 100 Einfluss; Bloc-intern kein Embargo (außer Krieg). Subjekte/Juniorpartner übertragen 50–75 % ihrer Konvois an den Marktbesitzer.
- **Kosten/Nutzen:** Marktbeitritt = Souveränitätsverzicht (eigene Preise, eigene Zölle) gegen Größe (Nachfrage, Migranten-Pool, Konvois).
- **Wer gewinnt / verliert:** Der Marktbesitzer gewinnt Zoll-Minimum und Konvois; kleine Mitglieder gewinnen Zugang, verlieren Preis-Autonomie; per „Grant Own Market" kann man Unabhängigkeit zurückgeben (Liberty-Desire-Effekte).
- **Versteckte/Zweitrunden-Effekte:** Geteilte Zölle bedeuten: Der große Partner verdient an den Importen der kleinen mit — Zollunion ist ein **Einnahme-Saugmechanismus** nach oben.
- **Übernahme für Staatsräson:** Direkter Türkei-Bezug: **EU-Zollunion 1995** ist real und im 4-Dimensionen-Länderbeziehungsmodell abbildbar: EU-Dimension „wirtschaftliche Verflechtung" hoch → eigene Zoll-Autonomie eingeschränkt (z. B. Konsumgüter-Zoll-Regler gelockert), dafür Export-Nachfrage-Kante stärker. Modernisierungs-/Erweiterungs-Deals (Visa, Zollunion-Upgrade, Flüchtlingsrahmen) werden zu Handelsangeboten mit **Nebenbedingungen** (siehe Suzerain 5.3 und Tropico 9.2) — Preis ist nicht nur Geld, sondern Politik.

---

## 3. Hearts of Iron 4

Quellen: hoi4.paradoxwikis.com/Construction (Baukosten, Consumer Goods, Payback), hoi4.paradoxwikis.com/Ideas (Wirtschafts-/Handelsgesetze, Sondergesetze), hoi4.paradoxwikis.com/United_States (Isolation-Stufen), Paradox-Forum (IC-Umrechnung, 8 Ressourcen = 1 Zivfabrik), gamepressure.com-Guide (Gesetzeskosten 150 PP), math.stackexchange.com (Ziv/Mil-Umstellungsoptimum).

### 3.1 Fabriken statt Geld: die IC-Abstraktion

- **Funktionsweise:** Es gibt **kein Geld**. Produktionskapital = Fabriken. Baukosten in „IC": Zivfabrik 10.800 (Basis-Output 5/Tag, aktuelle Wiki-Notiz 4), Militärfabrik 7.200 (4,5, aktuell 3,5), Marinewerft 6.400 (2,5, aktuell 2), Synth.-Raffinerie 14.500, Kernreaktor 30.000. Max. **15 Zivfabriken pro Bauauftrag** → ein neuer Civ dauert 10.800/(15×5) = **144 Tage** optimal. Umbau: Ziv→Mil 4.000, Mil→Ziv 9.000 (asymmetrisch! Abrüstung teurer als Aufrüstung). Infrastruktur multipliziert Bautempo (1× bis 2× bei voller Stufe); Payback-Rechnung der Wiki: Bei 4/5 Infrastruktur amortisiert sich eine Zivfabrik je nach Wirtschaftsgesetz nach ~1.111–4.444 Tagen.
- **Kosten:** Zeit und Opportunität (15er-Kappung) statt Geld; politische Macht (PP) für Gesetzeswechsel (~150 PP je Wirtschaftsgesetz laut älterem Guide `[unverifiziert, versionsabhängig]`).
- **Nutzen:** Zivfabriken = Bau, Handel, Konsumgüter, Agentur, Markt-Käufe; Milfabriken = Kriegsmaterial. Die Ziv/Mil-Allokation IST die Wirtschaftspolitik.
- **Wer gewinnt / verliert:** Konsumgüter binden Zivfabriken (3.2); wer früh mobilisiert, gewinnt Fabriken, verliert „Friedensdividende".
- **Versteckte/Zweitrunden-Effekte:** (a) Das Umstellungs-Optimum ist eine **berechenbare Schwelle** (math.stackexchange: bei Payback 800 Tagen und Ziel 1944 Umstellung Sep 1937) — Investitionszyklen sind Planungsmathematik. (b) Schaden am Standort (Bomben) trifft die Produktivitätskette doppelt (Fabrik weg + Wiederaufbau frisst Baukapazität). (c) Konversion ist asymmetrisch teuer — Pfadabhängigkeit ist eingebaut.
- **Übernahme für Staatsräson:** Die reine IC-Abstraktion lehnen wir ab (haben wir), aber die **Payback- und 15er-Kappungs-Idee** ist Gold für Großprojekte und Baubranche: Baukapazität der Türkei = endogener Knoten (Baubranche-Auslastung), jedes Großprojekt belegt Anteile über Jahre; parallele Großprojekte verlängern sich gegenseitig und verteuern sich (Vic3-Baukosten, 2.3). „Umbau asymmetrisch" → **Stilllegung eines Großprojekts kostet mehr als sein Weiterbau** (Sunk-Cost-Falle als Mechanik, real: Staudamm-/Kernkraft-Debatten).

### 3.2 Konsumgüter-Abgabe: die Wirtschaftsgesetz-Leiter

- **Funktionsweise:** Prozentsatz **aller** Fabriken (Ziv + Mil + per Handel gewonnene, ohne Werften; abgerundet) produziert zwangsweise Konsumgüter und steht nicht zur Verfügung. Die Leiter (Wiki, aktuelle Fassung; Sondergesetze in Klammern):
  - **Undisturbed Isolation 50 %** (nur USA, Bau −50 %, Konversion +50 %)
  - **Isolation 40 %** (USA)
  - **Civilian Economy 35 %** (Ziv- und Mil-Bau −30 %, Konversion +30 %, Treibstoff-Öl −40 %)
  - **Early Mobilization 30 %** (Bau −10 %)
  - **Partial Mobilization 25 %** (Mil-Bau +10 %, Konversion −10 %)
  - **War Economy 20 %** (Mil-Bau +20 %, Konversion −20 %)
  - **Total Mobilization 10 %** (Mil-Bau +30 %, Konversion −30 %, **rekrutierbare Bevölkerung −3 %**, Fabrik-Energieverbrauch +50 %)
  - Sonderformen: Totaler Krieg 10 %, Collectivized Society 15 %, War Communism 15 %, New Economic Policy 15 %, Embargoed Economy +5 %-Punkte.
  - Widerspruch: Die Ideas-Seite nennt für Total Mobilization +15 %, die Construction-Seite (jünger, versions-verifiziert) +10 %, ebenso Guides und Mods (OWB). `[unverifiziert: 10 % überwiegt]` Zusätzlich multiplikativ: **Consumer Goods Factor** (z. B. Deutschlands Spirits, Chinas Inflations-Spirale Low→Moderate→Heavy→Hyper: +10/+15/+20 % CG-Factor, Fabrik-Output −5/−10/−20 %).
- **Kosten:** PP pro Gesetzeswechsel; Voraussetzungen (Krieg, Weltspannung, War Support, Partei); bei Total Mob die Manpower-Steuer.
- **Nutzen:** Jede Stufe = +5 Prozentpunkte verfügbare Industrie; späte Stufen = Umbau-Rabatt.
- **Wer gewinnt / verliert:** Die „Zivilbevölkerung" existiert nur als Abgabe — es gibt kein Glücks-Meter, die Kosten sind rein opportunitär. Das ist die radikalste Abstraktion in diesem Vergleich: **Konsumverzicht ist eine Industriesteuer**.
- **Versteckte/Zweitrunden-Effekte:** (a) Chinas Inflations-Spirale zeigt: Konsumgüter-Druck kann als **Krisen-Spirale** modelliert sein, die Fokus-Punkte frisst, bis man sie löst. (b) Total Mob ist ohne Krieg/Enemy-Mehrheit gesperrt — Mobilisierung braucht Legitimation durch äußere Bedrohung. (c) Stability/War-Support koppeln Wirtschaftsgesetze an innere Stimmung (Streiks/Mutinereien bei Unterschreitung, Guide-Angabe).
- **Übernahme für Staatsräson:** Direkte Übernahme als **„Belastungs-Leiter" im Politiknetz**: Stufen von „Konsum ungestört" bis „Kriegswirtschaft" mit Prozent-Abgabe auf Konsum/Investition, jede Stufe mit Legitimations-Voraussetzung (Krisenlage, Parlament, War-Support-Analog: „Opferbereitschaft" als Knoten aus Medienlage + äußerer Bedrohung) und Wählergruppen-Preis (Konsum-Abgabe trifft „wahrgenommene Teuerung" Z11 direkt). Die Inflations-Spirale Chinas als Vorbild für unsere Krisen-Spirale: Lira-Abwertung aktiv → Konsumgüter-Druck steigt stufenweise, bis der Spieler die Ursache behandelt (Zins/Vertrauen), nicht das Symptom.

### 3.3 Handel: Ressourcen gegen Fabrikkapazität

- **Funktionsweise:** Import kostet keine Währung, sondern **Zivfabriken**: 1 Zivfabrik eingetauscht = **8 Einheiten** einer Ressource (Forum-Umrechnung; Beispiel Gewehr: 0,40 Mil-IC + 2 Stahl = 0,775 „Gesamt-IC" bei Kurs 1,5/8). Handelsgesetz bestimmt, wie viel der eigenen Ressourcen überhaupt auf den Markt muss: **Free Trade 80 % Resources to Market** (+15 % Bau, +10 % Forschung, +15 % Output), Export Focus 50 %, Limited Exports 25 %, Closed Economy 0 %. „Trade deal opinion factor" und Geheimdienst-Sichtbarkeit hängen daran.
- **Kosten:** Fabrikkapazität (Opportunität: diese Civs bauen nicht), plus Sichtbarkeit der eigenen Wirtschaft für andere.
- **Nutzen:** Ressourcen-Mangel sofort beheben ohne Eroberung; Free Trade = Wachstums-Boost gegen Autonomie-Verlust.
- **Wer gewinnt / verliert:** Ressourcenreiche Exporteure (USA, Kolonialmächte) gewinnen Civs der Käufer — **Handel ist Kapitaltransfer in Fabrikform**. Wer kauft, bindet eigene Industrie beim Verkäufer.
- **Versteckte/Zweitrunden-Effekte:** (a) Im Krieg bricht der Handel weg → wer auf Import-Öl baut (alle außer USA), hat eine strategische Bombe im Fundament. (b) Exportierte Ressourcen sind gebunden, auch wenn man sie später selbst braucht. (c) Free Trade erhöht die feindliche Intel über einen (+40 % zivile Intel) — Offenheit ist Spionagehilfe.
- **Übernahme für Staatsräson:** Für Energie-/Getreide-/Rüstungs-Deals: **Deals als Kapazitäts-Tausch statt Geld**: ein Gas-Import-Deal bindet nicht nur Devisen, sondern „verpflichtet" Export-Industrie-Kapazität oder politische Gegenleistung; Bruch des Deals = Lieferstopp + Beziehungs-Malus auf allen 4 Dimensionen. Free-Trade-Analog: Offenheits-Regler (Zölle/Quote) mit Nebenwirkung „Auslands-Intel/Abhängigkeit" — Türkei-Hook: Energieimport-Abhängigkeit (Russland-Gas) als konkreter, benannter Vertrag mit Ausschlussklauseln (Suzerain-Vertragslogik, bereits vorgemerkt).

### 3.4 Warum HOI4 keine Schulden hat — und was wir daraus lernen

- **Funktionsweise/Begründung:** Staatsfinanzen existieren nicht, weil das Spielfeld (1936–48, Totaler Krieg) staatliche Finanzierungsfragen durch **Verfügungsrecht** ersetzt: Der Staat nimmt sich über Konsumgüter-Quote, Wehrpflicht-Stufen und Fabrikallokation, was er braucht; die „Zahlungsfähigkeit" ist Produktionskapazität, nicht Geld. Inflation existiert nur als scripted National Spirit (China). Historisch stimmt das grob: Kriegswirtschaften finanzierten sich über Kontrolle (Rationierung, Zwangsanleihen, Repression), nicht über freie Anleihemärkte.
- **Kosten des Designs:** Keine Schuldenfalle, keine Zins-Spirale, keine Sparpolitik — ganze Politikfelder fehlen; dafür null Abstraktionsbruch zwischen Wirtschafts- und Kriegsteil.
- **Übernahme für Staatsräson:** Negativ-Vorbild und Positiv-Lehre zugleich: Unser Spiel ist Friedens-/Krisen-Politik mit Marktwirtschaft — Geld, Zins, Rating sind Kern, nicht Ballast (das unterscheidet uns von HOI4). Aber für den **Ausnahmezustand/Kriegsfall** (MIL-1 im Verbesserungsplan) liefert HOI4 die Vorlage: Bei „Einsatzbeschluss" schaltet die Wirtschaft teilweise auf Verfügungslogik um — Preisband eingefroren, Konsum-Abgabe aktiviert, Handelskanäle politisch vergeben. Der Übergang Markt↔Verfügung ist selbst ein spielbarer, teurer Akt (Legitimation, Rückbau-Kosten, CGFF-Nachwehen).

---

## 4. Civilization 6

Quellen: civilization.fandom.com (Suzerain (Civ6), Unit (Civ6)); CivFanatics-Grundlagen-Thread (4 Gold = 1 Produktion als Faustregel); Zigzagzigal-Guide (Steam, GS); Patch-Notes Babylon Pack (civfanatics.com); thegamer.com Gold-Guide; 2K-Handbuch (Regierungswechsel kostet Gold; Anarchie bei Rückkehr).

### 4.1 Gold: Einnahmequellen und Unterhalt

- **Funktionsweise:** Einnahmen: gelbe Felder/Küste/Luxusgüter, **Handelswege** (international: Gold aus Zielstadt-Distrikten + Policy-Boni wie Caravansaries +2 / Triangular Trade +4 / E-Commerce; speziell: +1 je strategischer Ressource am Ziel mit Market Economy), **Commercial Hub**-Gebäude (Free Market verdoppelt unter Bedingungen), Stadtstaaten (Trade-Typ: Envoy-Stufen 1/3/6 geben Gold; Suzerain-Boni z. B. Hunza: Gold nach Weg-Distanz; Singapur: +2 Produktion je Civ mit Handelsweg), Große Kaufleute (u. a. extra Handelsweg-Kapazität, Gold, Envoys), Politiken (Merchant Confederation: +1 Gold je Envoy), Plündern. Ausgaben: **Einheiten-Unterhalt** pro Runde (steigt mit den Epochen; Conscription −1/Levée en Masse −2 je Einheit), Gebäude-/Distrikt-Unterhalt, Upgrade-Kosten (Professional Army −50 %).
- **Kosten/Nutzen:** Gold ist die flüssige, lagerbare Universalwährung neben den gebundenen Erträgen (Produktion ist lokal, Gold ist global).
- **Wer gewinnt / verliert:** Handels-Zivilisationen skalieren mit Routenzahl; wer kein Gold hat, kann nicht upgraden, nicht kaufen, nicht levien — Armut ist Handlungsunfähigkeit, nicht nur langsameres Wachstum.
- **Versteckte/Zweitrunden-Effekte:** Handelswege bauen Straßen, liefern Sicht/diplomatische Sichtbarkeit und binden die Zielstadt ökonomisch — ein Handelsweg ist Infrastruktur + Intel + Abhängigkeit in einem. Unterhalt wächst mit der Epoche: Die Friedensarmee von gestern wird zur Schuldenfalle.
- **Übernahme für Staatsräson:** „Unterhalt wächst mit der Zeit" übernehmen für Staatsapparat und Großprojekte: **Betriebskosten-Eskalation** (ein 2028 gebauter Kanal kostet 2035 mehr Unterhalt; Armee-Modernisierung ohne Budget-Pfad = schleichender Defizit-Treiber). Handelswege als Mehrzweck-Instrument: unsere Handelsdeals sollen gleichzeitig Beziehungs-Dimension (wirtschaftliche Verflechtung) und Intel-Qualität (Datenlage des Partnerlandes) verbessern.

### 4.2 Kauf mit Gold vs. Produktion: der 4:1-Zeitkurs

- **Funktionsweise:** Einheiten/Gebäude sind sofort mit Gold kaufbar; Faustregel aus der Community-Dokumentation: **Goldpreis = 4 × Produktionskosten** (CivFanatics-Faustregel; Faith-Kauf = ~2×, also „halb so teuer wie Gold" — Zigzagzigal). `[unverifiziert als exakter Engine-Wert, aber breit dokumentiert]` Felder werden direkt mit Gold gekauft (Preis wächst mit Anzahl gekaufter Felder; Expropriation-Policy −20 %). Große Leute sind mit Gold/Faith „zu Ende zu kaufen". **Levy** von Stadtstaaten-Armeen: Goldpreis = Summe der Produktionskosten aller Einheiten, für 30 Runden (Sumerien −50 %, Matthias Corvinus −75 % Upgrade-Rabatt).
- **Kosten/Nutzen:** 4:1 ist der implizite **Zeit-Geld-Kurs**: Wer Geld hat, kauft Zeit; wer Zeit hat, „zahlt" mit Warten nur ein Viertel. Langfristig ist Produktion effizienter, kurzfristig Gold entscheidend (Notfall-Verteidigung, Wunder-Schnapp).
- **Wer gewinnt / verliert:** Goldreiche Imperien können Krisen instant kaufen; produktionsstarke, goldarme nicht. Der Kurs bestraft Horten nicht, bestraft aber Goldarmut in der Krise.
- **Versteckte/Zweitrunden-Effekte:** (a) Der 4:1-Kurs macht Gold zur **Option auf Flexibilität** — sein Wert ist nicht der Ertrag, sondern die Sofortigkeit. (b) Levy ist zeitlich befristet (30 Runden) — gekaufte Macht verfällt. (c) Wunder: bei verlorenem Wunder-Wettlauf gibt es Produktions-Rückerstattung (50 %-Logik bereits in MECHANIKEN.md übernommen).
- **Übernahme für Staatsräson:** Direkt übertragbar: **Beschleunigungs-Aufpreis** für Großprojekte und Programme — Normalpreis = über Jahre verteilt (Produktion), Sofort-/Crash-Variante = 3–4× Gesamtpreis (Gold-Äquivalent: außerordentliche Ausgabe im Haushalt + PK-Aufschlag, weil Crash-Programme im Parlament auffallen). Zweite Übernahme: **Gemietete/geborgte Kapazität verfällt** — IMF-Analog-Pakete, externe Expertise, Leasing von Kapazität (Katar-Swap-Linie als „Levy auf Zeit") mit explizitem Auslaufdatum und Rückfall-Effekt.

### 4.3 Stadtstaaten als gekaufte Bündnisse

- **Funktionsweise:** Envoys (Diplomatie-Währung, verdient über Civics/Regierung/Quests) bei 1/3/6 schalten gestufte Boni frei; wer die meisten Envoys hat (≥3), ist **Suzerain**: Ressourcen-Export, Kriegsfolge, Durchmarsch, Heilungsvorteile, +1 Diplomatische Gunst/Runde, Levy-Option. Konkurrenz: überbieten möglich, Gleichstand = kein Suzerain.
- **Kosten:** Envoy-Akquisition (Zeit/Civics/Gold-Kauf großer Personen), Levy-Gold, und Anarchie-/Beziehungskosten bei Regierungswechseln (Wechsel kostet Gold außerhalb der Civic-Runde; Rückkehr zur alten Regierung = **Anarchie**: alle Erträge null für einige Runden).
- **Nutzen:** kleine, dauerhafte Ertrags-Ströme ohne Eroberung; Bündnis-Geflecht als Rendite auf Diplomatie.
- **Wer gewinnt / verliert:** Diplomatie-Starke schlagen Militär-Überlegene indirekt; der überbotene Ex-Suzerain verliert sofort alle Boni (Kriegsfolge inklusive).
- **Versteckte/Zweitrunden-Effekte:** Suzeränität ist **revozierbar** — Investitionen sind nicht sicher; wer sich auf einen Stadtstaat verlässt, hat eine stillschweigende Laufzeit.
- **Übernahme für Staatsräson:** Unsere 4-Dimensionen-Länderbeziehungen bekommen damit eine **Schwellen-Logik**: gestufte Stufen (1/3/6-Äquivalent: Kontakt / Partnerschaft / Patronage) mit konkreten, sichtbaren Stufen-Boni je Partner (Transit-Gebühren, Swap-Linie, Geheimdienst-Zugang), und Überbietbarkeit durch Dritte (Russland bietet Bosporus-Staat X mehr → Stufe kippt). Anarchie-Regel übernehmen als **Richtungswechsel-Strafe**: Wer einen etablierten Bündnis-Pfad (z. B. EU-Spur) abbricht und zurückkehrt, erleidet eine Übergangs-„Anarchie" (Beziehungs-Erträge auf null für N Monate) — Pfadwechsel sind zweimal teuer.

---

## 5. Suzerain (Sordland + Rizia)

Quellen: Steam-Guide „Economy and Government Budget Management" (id=2484945764); grokipedia.com/page/Suzerain_(video_game) (2.0-Budget-Tiers, Start 7); Community-Tipps (uunery/keryfoundry-Blogs: „nie unter −7", Credit-Score bei −8 in 1.0) `[1.0-Wert, für 2.0 unverifiziert]`; Steam-Guides Rizia 3.1 (id=3434031783, id=3483264973); neoseeker.com Rizian Geopolitics; suzerain.wiki.gg/wiki/Royal_decrees; codex.torporgames.com (Agnolia).

### 5.1 Budget-Klammern statt Buchhaltung

- **Funktionsweise:** Der Staatshaushalt ist eine **abstrakte Punkte-Größe** (Sordland: Entscheidungen geben/nehmen ±1 bis ±4; 2.0 „Amendment" baute das System auf Ausgaben-Tiers hoch/mittel/niedrig mit Startbudget 7 um; Rizia: Budget als Fluss pro Runde, BPT = Budget per Turn). Der **Wirtschafts-Meter ist verdeckt** — alle Entscheidungen zählen, auch wenn die Anzeige es nicht sofort zeigt (Community-Konsens, mehrfach dokumentiert). 1.0-Schwelle: unter −8 Kredit-Downgrade = wirtschaftliches Game Over (Community) `[unverifiziert für 2.0]`.
- **Kosten:** Jede relevante Entscheidung hat einen Preis in Budget-Punkten, sichtbar in Klammern am Dialog („-1", „+2"). Beispiele Sordland (Guide-Werte): Highway −1, Investition Lorren −1, Agnolia-Deal −1, Wehlen-Deal +2, Morna-Port −2, Verstaatlichung SSC/Nedam −2, Privatisierung Konzerne +3, Privatisierung Bildung +1, Steuersenkung für Großunternehmen −3.
- **Nutzen:** kurzfristig Handlungsfreiheit (Punkte puffern); langfristig entscheidet die Summe über Recovery, Depression („Another Alphonso"-Achievement: USP-Obstruktion + Sordish Depression) und Kreditwürdigkeit.
- **Wer gewinnt / verliert:** Konzentration schlägt Streuung: Guide-Regel „Investiere gebündelt in eine Region" (Bergia ↔ Sarna-Synergien), Streuung ist ineffizienter, holt aber alle Regionen ab. Oligarchen-Freundlichkeit boostet messbar die Wirtschaft; Militär-Personal-Kürzung senkt Wirtschaftsentwicklung, Aufstockung senkt Arbeitslosigkeit (verdeckte Querwirkungen).
- **Versteckte/Zweitrunden-Effekte:** (a) **Die Anzeige lügt durch Weglassen** — Vertrauen in das System statt in die Zahl ist erzwungenes Design. (b) Bau-Firmen-Wahl (Underhall) = Korruptions-Flag mit späteren Auswirkungen. (c) Steuer-Framing: Großunternehmen-Steuergeschenke schaden der Wirtschaft laut Beratern; Kleinbetrieb-Entlastung hilft — das Spiel belohnt die Verteilungslogik, nicht die Lobbynähe. (d) Zeitpunkt-Strategie: Rizia-Guide rät, unpopuläre Ausgaben ans Rundenende zu legen und Reserve für Events zu halten.
- **Übernahme für Staatsräson:** Wir rechnen in echten Lira (Realismus!), aber für **große Einzelentscheidungen** (Großprojekte, Paket-Deals, Reformgesetze) übernehmen wir die **Klammer-Notation als zweite Anzeigeebene**: „Kanal-Projekt (−3)" bedeutet 3 Haushalts-Äquivalente von je ~X % Defizit — übersetzt aus dem 9-Regler-Modell. Das löst die Kognitive Last: Der Spieler vergleicht 3 vs. 2 statt 240 Mrd. vs. 160 Mrd. Zusätzlich Rizias **Fluss-Modell** (BPT) als Mentorin-Sprache: „Das kostet zwei Monate Spielraum."

### 5.2 Privatisierung vs. Verstaatlichung

- **Funktionsweise:** Verkauf staatlicher Konzerne/Bildung/Gesundheit bringt sofort Budget (+1 bis +3), Verstaatlichung kostet sofort (−2) und verändert die Wirtschaftsstruktur dauerhaft; Planwirtschaft öffnet Wehlen/Valgsland/Agnolia, Marktwirtschaft Wehlen/Lespia/Agnolia; gemischte Routen (50–70 % Teilverkauf) gelten als Optimum (Grokipedia-Zusammenfassung der Community-Meta) `[Meta-Deutung]`. Rizia: RRG (Royal Gold) verstaatlichen für 3 Budget oder 3 Authority → +2 BPT danach; MITZ-Anteile von Lespia zurückkaufen (3 Budget) oder verstaatlichen (mit Morellas Forderungen: Arbeitsregulierungen, Fluss-Reparationen 1–2 Budget, Gas-Pipeline 1 Budget + 3 EPT gegen 2 BPT).
- **Kosten/Nutzen:** kurzfristig Kasse vs. langfristig Kontrolle und Einnahme-Ströme; Privatisierung von Gesundheit/Bildung senkt Lebensstandard ohne Zusatzbudget (Guide-Warnung).
- **Wer gewinnt / verliert:** Oligarchen gewinnen bei Privatisierung (und danken es wirtschaftlich); die Bevölkerung verliert bei ungefederten Dienstleistungs-Verkäufen; der Staat verliert Dividenden-Ströme (Vic3-Parallel!).
- **Versteckte/Zweitrunden-Effekte:** Verstaatlichung schließt Blöcke (ATO-Anbiederung erschwert), Privatisierung öffnet sie; 2.0 entfernte bewusst Exploits, die hohe Belohnung ohne Risiko erlaubten — Balance-Patch als Design-Eingeständnis.
- **Übernahme für Staatsräson:** Unser Privatisierungs-/Verstaatlichungs-Paar bekommt **Doppelpreis-Logik**: Einmalerlös (Haushalt +) **minus** entgangener Dividenden-Strom (Dauerposten −) **minus/plus** Wählergruppen- und Länder-Dimensionseffekte (Privatisierung an ausländische Bieter → Beziehungs-Dimension Wirtschaft ↑, Souveränitäts-Dimension ↓, Nationalisten-Wählergruppe ↓). Teilverkauf-Stufen (25/50/75 %) als Regler statt Binär. Türkei-Anker: Varlık Fonu (Vermögensfonds) als eigenes Instrument — Auslagerung von Staatsbetrieben aus dem Kernhaushalt = buchhalterische Trick-Karte mit Mentorin-Kommentar.

### 5.3 Handelsdeals mit Nebenbedingungen und IWF-Analogie

- **Funktionsweise (Rizia, detailliert belegt):** Wehlen-Deal: Import von Öl = **+3 EPT, aber „reduziert Verhandlungsmacht erheblich"**; Import von Pharma/Tabak/Holz = je leicht −Verhandlungsmacht; Export von Gold/Gas/Wein/Kleinwaffen = +Verhandlungsmacht; Zusagen gegen BFF = +; Grenzpolitik gegen Bluden/Derdiaken = +; Wehzek-Arbeitsrechte = +. Lespia: Aureus-Gasfeld-Kompromiss 25 % Rechte für 2 Budget + 1 Budget/Runde — vom Guide explizit als „Abzocke" markiert, wenn man die **Alliance of Nations (AN, UN-Analog)**-Schlichtung mit genug Verbündeten gewinnt (50 % Rechte + 3 EPT gratis); AN-Stimmen sind durch Diplomatie kaufbar (Derdia: 2 Budget oder 2 Authority; Rumburg/GRACE gratis; Valgsland gratis aus Eigeninteresse). „Rusty"-Kredit wird nur bei Budget ≤ 1 angeboten (Guide-Trick: künstlich arm stellen, Kredit nehmen, dann RRG verstaatlichen — Kreditgeber-Expropriation als Exploit). **Intermerkopum** (eigener Block, EU-Analog): Gründung braucht 10 Budget ODER gutes Einkommen ODER Energie-Überschuss ODER starke Armee; 3 Budget Gründungs-Spende; Rumburg wirft einen danach aus GRACE — Block-Bildung hat Block-Preis.
- **Kosten/Nutzen:** Jeder Deal ist ein Bündel aus Geld, Energie, Migrationspolitik, Menschenrechten — **Preis ≠ Geld**; Nutzen sind Flüsse (BPT/EPT) und AN-Stimmen.
- **Wer gewinnt / verliert:** Wehlen kauft politische Komplizenschaft mit Öl-Rabatt; Lespia nutzt Schwäche (25 %-„Scam"); wer Verbündete hat, zahlt weniger — Diplomatie ist die günstigste Währung.
- **Versteckte/Zweitrunden-Effekte:** (a) „Verhandlungsmacht" ist eine verdeckte Meta-Währung, die spätere Deals verbilligt/verteuert. (b) Kreditgeber-Verstaatlichung als Exploit zeigt: Wer leiht, wird zum Geisel — reale Lehre für die IWF-Analogie. (c) Energie ist „Backup-Budget" (Guide-Wortlaut): eine zweite, konvertierbare Staatswährung.
- **Übernahme für Staatsräson:** Unsere Verhandlungstisch-Mechanik bekommt **Bündel-Preise**: IWF-/EU-/Golf-Deals als Katalog mit Spalten {Geld jetzt, Geld-Fluss, Devisen-Fluss, politische Kondition (benannte Maßnahme aus dem Politiknetz!), Beziehungs-Delta, Verfall-Datum}. Konkretes IWF-Analog: **„Stand-by-Vereinbarung"** = Devisen sofort + Zinsaufschlag sinkt (Märkte glauben Anker) gegen Reform-Liste (Zinspfad, Haushalts-Regler-Korridore, Privatisierungen) mit **vierteljährlicher Review** (P&R-Detail, 8.2) und Abbruch-Preis bei Verstoß. Und Rizias Lehrstück: Die AN/Partner-Option muss existieren — wer Diplomatie pflegt (4 Dimensionen), kann die „Abzocke" ablehnen; wer isoliert ist, muss sie nehmen.

---

## 6. Rebel Inc. (Ndemic)

Quellen: rebelinc.wiki.gg (Core Game Concepts, Annual Budget, Governors, Initiatives, Economist); Steam-Guide (id=1895957927); en.wikipedia.org/wiki/Rebel_Inc.; namu.wiki Rebel Inc./Policy (Korruptions-Werte); gamereactor.eu-Review.

### 6.1 Monatsbudget und Reputations-Einkommen

- **Funktionsweise:** Geld kommt **monatlich**; das Vollbudget beträgt $72/Jahr-Einheiten (`A`), zusammengesetzt aus **Basis-Einkommen** (Start 0,08·A ≈ $6) und **Reputations-Einkommen** (Start 0,42·A ≈ $30) — Startbudget also ~$36, Maximum $128 (bzw. $139 auf Casual, bei nahezu unversehrter Reputation). **Reputation ist also die Einkommensquelle**: Verliert sie durch Instabilität/Korruption, sinkt das Monatsbudget. Gouverneure verbiegen das System: **Ökonomin** = Jahresbudget im Voraus, doppeltes Startbudget, aber +3 % Korruption pro Auszahlung und einzige mit Anti-Inflations-Initiative; **Bankier** = Zinsen auf ungenutztes Geld, aber niedrigeres Startbudget und schneller steigende Inflation; **General** = zivile Initiativen +$2.
- **Kosten/Nutzen:** Das Budget ist klein, die Preise sind sichtbar (Garnisonen $3–6; zivile Initiativen wenige $; Entwicklungs-Initiativen teuer), und **Timing ist die Mechanik**.
- **Wer gewinnt / verliert:** Wer Reputation hält, hält das Einkommen; Korruption frisst Reputation → Einkommen → alles andere (Community: „corruption reduces your health, which reduces your money, which reduces everything").
- **Versteckte/Zweitrunden-Effekte:** Einkommen ist prozyklisch: In der Krise (Reputation unten) kommt weniger Geld — genau dann, wenn man es braucht. Stabile Zonen zahlen zurück (Einkommen aus stabilen Zonen; Karten-Modifikatoren).
- **Übernahme für Staatsräson:** **Reputation → Einnahmen-Kopplung** haben wir teilweise (Risikoaufschlag Z8), aber Rebel Inc zeigt die harte Version: Steueraufkommen-Kante mit **prozyklischem Vorzeichen** (Krise → Ausfälle + Vermeidung → weniger Aufkommen, belegt als Mechanik: Auslastung ↓ → Steuerbasis ↓) — in der Kalibrierung sicherstellen, dass der Spieler die Abwärtsspirale als solche erkennt (Mentorin nennt sie „die Spirale", nicht nur rote Zahlen).

### 6.2 Inflation durch Ausgabe-Geschwindigkeit

- **Funktionsweise:** Jeder Kauf einer Initiative erhöht die Inflation; **wiederholte Käufe im selben Bereich** (Zivil/Militär/Regierung) erhöhen sie zusätzlich; Inflation baut sich von selbst relativ schnell ab (Guide: „keep it low at all times"). Initiativen haben individuelle **Inflations-Anfälligkeit**: Straßen hoch, Koalitions-Soldaten fast immun (Preis +$1 selbst bei extremer Inflation). Die Ökonomin besitzt eine Anti-Inflations-Initiative, deren Preis selbst nicht der Inflation unterliegt.
- **Kosten:** Der Preis des schnellen Ausgebens ist **verteuertes späteres Ausgeben** — eine Geschwindigkeitssteuer.
- **Nutzen:** Wer dosiert (abwechselnd, mit Pausen), kauft mehr für dasselbe Geld; das ist die Kern-Fertigkeit des Spiels.
- **Wer gewinnt / verliert:** Geduldige gewinnen; Event-gestresste Spieler, die in einer Krise alles auf einmal kaufen, zahlen doppelt.
- **Versteckte/Zweitrunden-Effekte:** (a) Die Bestrafung ist **asynchron**: Erst kaufen (angenehm), dann verteuern (unangenehm) — Zeitverschiebung wie bei unserer Zentralbank-Zins-Senkung. (b) Karten-Modifier „Gold Standard" löscht Inflation komplett — das Design weiß, dass Inflation der „biggest enemy early game" ist (Guide-Wortlaut).
- **Übernahme für Staatsräson:** Direkt übertragbar auf unser Makromodell: **Ausgabe-Geschwindigkeit als eigener Knoten**. Nicht nur das Defizit-Niveau, sondern die **Änderungsrate** der Staatsausgaben treibt die gefühlte Teuerung und die Inflationserwartung (Z2/Z3): Ein Wahlgeschenk-Paket auf einen Schlag wirkt stärker als dasselbe Geld über 6 Monate verteilt. Umsetzung: Kanten-Stärke skaliert mit |ΔAusgaben|/Monat; die Mentorin rät „Staffelung" als konkrete, kostenlose Optimierung. Türkei-Anker: reale Erfahrung mit konzentrierten Wahlzyklus-Ausgaben (Mindestlohn-Sprünge, EYT-Rente) — perfekter Lernfall.

### 6.3 Korruption als Risiko-Preis des billigen/schnellen Regierens

- **Funktionsweise:** Jede Initiative erhöht das **Korruptions-Risiko** beim Kauf (Entwicklungs-Initiativen stark); Risiko schlägt mit Zufall in tatsächliche Korruption um; Korruption senkt monatlich die Reputation (Wiki-Formel im Klartext verstümmelt: Reputations-Verlust/Monat ≈ (c/3,6)×6; Support-Schaden ≈ 1,15×c² `[unverifiziert]`). Anti-Korruptions-Initiativen senken das Risiko um diff×eff pro Runde (eff +0,005 je Initiative; unter ~10 % Risiko asymptotisch gegen 0); „Effective Procurement": sofort −3 % Risiko, −15 % Risiko auf neue Initiativen, **aber +10 % Preis aller zivilen Initiativen** — der saubere Staat kostet eine eigene Steuer. „Beseitigung 1/2": −15 % Risiko und −30 % akkumulierte Korruption sofort (namu.wiki).
- **Kosten/Nutzen:** Korruption ist kein Moral-Decal, sondern ein **Rendite-Abzug** (Reputation → Budget); Bekämpfung kostet Geld und verlangsamt (Procurement-Aufschlag).
- **Wer gewinnt / verliert:** Schnelle, schmutzige Ausgaben gewinnen kurzfristig Stabilität und verlieren langfristig das Einkommen; saubere Beschaffung verliert Tempo.
- **Versteckte/Zweitrunden-Effekte:** (a) Das Risiko wirkt **stochastisch** — der Schaden kommt später und zufällig, der Lernschmerz ist entkoppelt vom Auslöser (didaktisch wertvoll!). (b) Der Berater „Investigative Reporter" multipliziert die Anti-Korruptions-Effizienz (~+2 %/+6 %/+12 %/+20 % bei 1–4 Teams) — Presse als Korruptionsbremse ist codiert. (c) Warlord/PMC-Spielweisen monetarisieren Militär gegen Korruption (Schmuggler: Nationalarmee als Söldner → Geld pro Einheit, Korruption ↑).
- **Übernahme für Staatsräson:** Drei Übernahmen: (a) **Korruptions-Risiko als Latenz-Modell**: Großprojekt-Vergabe, Bauvergabe-Option „privat billig" (bereits vorgemerkt) und Schnell-Ausgaben erhöhen einen Risiko-Knoten; der Schaden tritt als **Event mit Verzögerung und Zufall** ein (Skandal-Event-Kette), entkoppelt vom Auslöser — passt zu unserem Ereignismotor mit Grudge-Decay. (b) **„Effective Procurement"-Dilemma** als Regierungsprogramm-Schritt: sauberere Vergabe = alles Öffentliche +10 % teurer und langsamer, aber Skandal-Risiko ↓ — ein ehrlicher Trade-off, kein „Korruption abschaffen"-Button. (c) **Pressefreiheit als Anti-Korruptions-Multiplikator**: Das Pressefreiheit-Beispiel des Auftraggebers bekommt eine zweite, versteckte Wirkung — hohe Pressefreiheit multipliziert die Skandal-Entdeckungsrate (kurzfristig schmerzhaft: mehr Skandale sichtbar!), senkt aber langfristig den Korruptions-Stock. Genau das „langfristig nützlich, kurzfristig teuer"-Muster.

---

## 7. Crisis in the Kremlin / Ostalgie (Kremlingames)

Quellen: phuulishfellow.wordpress.com (Reviews 1991-Version und 2017-Version); classicreload.com (Crisis in the Kremlin 1991); tvtropes.org (CrisisInTheKremlin, OstalgieTheBerlinWall); gamicus.fandom.com (Ostalgie-Endings); repacklab-Übersicht (Ostalgie-Ledger, Gebäude); YouTube-Gameplay (Ostalgie: „each dollar really helps").

### 7.1 Staatshaushalt als direkte Regler-Ebene

- **Funktionsweise (1991):** Der Haushalt ist das Hauptinstrument: **Landwirtschafts- und Transport-Ausgaben** hochhalten, sonst hungert die Bevölkerung; Militär-Etats kürzen antagonisiert Fraktionen — Empfehlung der Reviews: **nur schrittweise** kürzen. Politik-Regler und Fraktions-Management obendrauf; Ereignis-Mehrfachauswahl als dritte Ebene. **(2017):** Budget bleibt wichtig („funding appropriate areas at appropriate levels is vital"), aber nur ein Element neben Ernennungen, Fraktionsmacht, Forschung (Science Points), politischen Punkten und internationaler Interferenz; weniger Eisenbahn („railroading"), dafür 4–5 Sieg-Szenarien, die das Spiel nicht ansagt.
- **Kosten/Nutzen:** Schnitte sind sofort wirksam (Geld), aber Fraktions-Zorn und Hunger kommen verzögert; graduelle Kürzungen sind der dokumentierte Überlebens-Skill.
- **Wer gewinnt / verliert:** Fraktionen (Stalinisten/Konservative/Reformer/Technokraten) gewinnen und verlieren an Budget-Zuweisungen und Posten — **Budget ist Fraktions-Währung**.
- **Versteckte/Zweitrunden-Effekte:** (a) OGAS-Pfad (2017): Wer das kybernetische Planungs-Minispiel meistert, erreicht „Post-Scarcity" (4-Stunden-Tag) — Technologie kann die Budget-Not strukturell beenden, nicht nur lindern. (b) Anti-Alkohol-Kampagne: verbessert Wissenschaft/Lebensqualität, „destroying your coffers" (Spirituosen-Steuer als Staatsfinanz-Säule — real historisch) und verärgert die Opposition; muslimische Regionen tolerieren harte Linien — Politik wirkt **regional unterschiedlich**.
- **Übernahme für Staatsräson:** Zwei Punkte: (a) **Schnitt-Geschwindigkeit als eigener Kostentreiber**: Dieselbe Etat-Kürzung kostet bei −20 % auf einmal mehr Fraktions-/Wählergruppen-Groll als −5 % über vier Jahre (Änderungsraten-Prinzip wie Rebel Inc 6.2, hier auf der Spar-Seite). Unsere 9 Regler sollten eine **Änderungsraten-Komponente** in den Groll-Kanten haben, nicht nur das Niveau. (b) **Monopol-Einnahmen als Haushaltsposten**: Spirituosen-(Tabak-)Steuer als eigener Posten mit Gesundheits-Trade-off — Politik, die die eigene Einnahmebasis beschädigt (D4-Alkoholsteuer-Parallel!).

### 7.2 Rubel und Devisen: die Zweiteilung der Staatskasse

- **Funktionsweise (Ostalgie, soweit belegt):** Das Spiel betont die Knappheit der harten Währung („each dollar really helps", Gameplay-Material) neben dem inlandischen Budget; ein **Ledger** gibt detailliertes Feedback zur Wirtschaftslage; Gebäude produzieren Geld, senken „Westalgia" oder verärgern gezielt (Funktürme); **Schweizer Konto für Parteikader** = teurer Boost der Parteieinheit (tvtropes); CMEA-/Sowjet-Subventionen fallen als externer Schock weg — der Staatshaushalt hängt an einem **ausländischen Geldgeber**, der politisch austritt.
- **Kosten/Nutzen:** Devisen = Importe, Technologie, Schuldendienst; Rubel = Inland. Wer nur Inland steuert, verliert die Außenbilanz — die Endings differenzieren „Economic Situation" (Plan/Markt/OGAS) explizit vom Lebensstandard (Skala bis 80+).
- **Wer gewinnt / verliert:** Reform-Fraktionen gewinnen mit Westöffnung (Devisen), verlieren Partei-Einheit; Hardliner halten die Partei, verlieren die Wirtschaft.
- **Versteckte/Zweitrunden-Effekte:** Korruption (Schweizer Konto) ist hier **Stabilitäts-Kauf mit Staatsgeldern** — die moralische Bewertung überlassen die Endings dem Spieler.
- **Übernahme für Staatsräson:** Das ist die **direkte Vorlage für eine Lira/Devisen-Trennung**: unser Haushalt (Lira) plus **Devisen-Lage** (TCMB-Reserven, Energie-Import-Rechnung, Unternehmens-FX-Schulden, Swap-Linien) als zweiter Topf mit eigenen Regeln — Devisen kann man nicht „drucken" (Stufe-C-Zentralbank deckt nur Lira), Devisen-Knappheit triggert das Preisband/Shortage-Modell (2.5) auf Importen. Rizias „Energy = Backup-Budget" (5.3) und Ostalgies Dollar-Knappheit sind zwei Varianten derselben Idee: **eine zweite, nicht selbst herstellbare Währung erzwingt Außenpolitik**. Türkei-Realität: Netto-Reserven-Debatte, KKM, Gold-Importe — alles anschlussfähig.

---

## 8. Power & Revolution / Masters of the World (Eversim)

Quellen: power-and-revolution.com/presentation.php (offizielle Feature-Liste); masters-of-the-world.com/education.php (Feature-Liste inkl. Schulden-Management, IWF, Rating-Agenturen, Szenarien-Namen); gps.fandom.com/wiki/Debt (Gläubiger-Tabelle, Zins-Verhandlung); paxsims.wordpress.com (V3-Feature-Zitat); saveorquit.com (Review 2017).

### 8.1 Realistische Staatsfinanzen: ~30 Steuern, 130 Sektoren, Defizit

- **Funktionsweise:** Fast 30 einzeln veränderbare **Steuern** (V3 führte „taxation by brackets" ein — echte Tarifstufen), Subventionen für 130+ Wirtschaftssektoren, Mindestlöhne, Privatisierung/Verstaatlichung als Operationen, Rentenalter, Arbeitszeit- und Sozial-Detail; Parlament stimmt über Gesetze (Parteien mit realen Stärken); Popularität entscheidet über Wahlen und Amtsverbleib; **Gross National Happiness** als Wohlfahrts-Größe neben dem Budget.
- **Kosten/Nutzen:** Steuer-Detail = mikroskopische Einnahmen-Steuerung gegen Popularitäts-Verluste; Sektor-Subventionen = gezielte Industriepolitik gegen Dauer-Defizit.
- **Wer gewinnt / verliert:** Lobbys, Gewerkschaften und benannte Persönlichkeiten reagieren (Interviews, Rücktritte, Proteste, Streiks, Unruhen bis Bürgerkrieg) — die Verlierer einer Maßnahme sind **Personen mit Gegenwehr-Optionen**.
- **Versteckte/Zweitrunden-Effekte:** Sparpolitik tilgt Schulden „at the cost of popularity and Gross National Happiness" (fandom: Debt) — Austerität ist ein expliziter Tausch, kein Bug.
- **Übernahme für Staatsräson:** Wir bleiben bewusst bei 9 Reglern statt 30 Steuern (Tiefe pro Regler statt Breite), aber zwei Übernahmen: (a) **Tarifstufen als Struktur-Switch** (Vic3 2.2 sagte „keine Brackets", Eversim hat sie): ein Reform-Paket „Steuerstruktur" (flach ↔ progressiv) als Parlaments-Großakt, der die Verteilung der Steuerlast über die 11 Wählergruppen neu sortiert. (b) **Benannte Gegenwehr**: unsere PERSONEN.md-Figuren (Gewerkschaft, TÜSİAD-Analog, etc.) reagieren wie Eversims Lobbys mit Eskalationsleiter (Interview → Warnung → Aktion) — das ist billig zu bauen (Ereignismotor existiert) und macht „wer verliert" greifbar.

### 8.2 Gläubiger, Rating-Agenturen, IWF

- **Funktionsweise:** Ein eigener **Debt-Tab** listet **einzelne Gläubiger** mit Höhe, Zinssatz je Laufzeit und Neukredit; **Zins-Verhandlung mit einzelnen Gläubigern ist möglich** — per Termin („after a coffee and some compliments"), gültig **ein Quartal**; hohe Sätze lassen sich um mehrere Punkte drücken, niedrige kaum (fandom: Debt). V3/MotW ergänzen: **Rating-Agenturen**, Kredite oder Schuldenerlass über **IWF oder Eurozone**, Szenarien „Regaining the Triple A", „Saving Greece", „Returning to 3 % of the deficit". 600+ Datenelemente je Land, inkl. aktueller Ratings und Defizite (Education-Seite).
- **Kosten/Nutzen:** Schulden kurzfristig nützlich, langfristig „ruin of your budget if mismanaged" (fandom); Zins-Verhandlung kostet Zeit/Termin-Kapazität und wirkt nur ein Quartal — **Dauer-Pflege der Gläubiger-Beziehung**.
- **Wer gewinnt / verliert:** Wer verhandelt, atmet; wer nicht, zahlt den Marktpreis; Rating-Verlust verteuert alles.
- **Versteckte/Zweitrunden-Effekte:** (a) Gläubiger sind **Personen/Institutionen mit Terminlogik** — Schulden sind Beziehungen, keine abstrakte Zahl. (b) Ein-Quartal-Gültigkeit erzeugt einen „Wartungs-Rhythmus" (vergleichbar unserem Oktober-Haushalt, WIR-3). (c) Die Szenario-Namen zeigen die didaktische Absicht: Rating-Rückgewinn ist ein eigenes Spielziel.
- **Übernahme für Staatsräson:** Sehr hohe Anschlussfähigkeit: Unser Risikoaufschlag (Z8) ist anonym. Übernehmen: **Gläubiger-Struktur als 3–4 benannte Gruppen** (inländische Banken, Auslandsfonds, IWF/Offizielle, Swap-Partner) mit eigenen Sätzen, Laufzeiten und **Verhandlungs-Aktionen** (Verhandlungstisch existiert bereits!): Termin mit IWF = Aufschlag −X für 2 Quartale gegen Konditionen; Termin mit Golf-Swap-Partner = Devisen-Fluss gegen außenpolitische Dimension. Rating-Agentur als **Figur/Ereignis-Kette** mit Ausblick-Logik (Watch → Downgrade) und Hysterese (Upgrade braucht doppelt so lange wie der Downgrade). Das verbindet Geld, Personen und Außenpolitik in einem Mechanik-Bündel.

---

## 9. Tropico 6

Quellen: gamepressure.com Tropico-6-Guide (Finances and trade); tropico.fandom.com (Dock T6/T4, Budget-Stufen); shapes.inc-Fandom-Übersicht (Fraktionen, Supermächte, Broker, Swiss Bank, Tax Haven); ibtimes-Guide (State Loans, Slush Funds, Raids); reddit r/tropico (Route costs).

### 9.1 Staatskasse vs. Schweizer Konto

- **Funktionsweise:** Zwei getrennte Töpfe: **Treasury** (Staat) und **Swiss Bank Account** (privat). Der **Broker** konvertiert/vermittelt: Schweizer Geld kauft Fraktions-Gefallen und umgeht politische Blockaden; Banken im Modus **„Slush Fund"** füllen das Schweizer Konto; Bank-Upgrades erhöhen den **Kreditrahmen des Staates** (+5.000, Guide); Konstitutions-Option **„Tax Haven"** erfreut Kapitalisten und verärgert die internationale Gemeinschaft. Baubudgets je Gebäude in 5 Stufen (Dock-Beispiel: $40/64/80/95/120 mit Job-Qualität 30–50 und Lohn $6–18) — **Mikro-Budget-Regler pro Gebäude**, die Qualität und Löhne zugleich setzen.
- **Kosten/Nutzen:** Schweizer Konto = Geld in politische Maschinerie umgewidmet; Nutzen: Fraktions-Käufe ohne Parlaments-/Wahl-Umweg; Kosten: Geld fehlt dem Staat, und die Konversion ist eine (implizit korrupte) Transaktion mit Preis.
- **Wer gewinnt / verliert:** Der Präsident gewinnt Handlungsfreiheit; Kapitalisten-Fraktion gewinnt bei Tax Haven; „die internationale Gemeinschaft" verliert Vertrauen — eine externe Stimmungs-Größe straft Steueroasen-Politik.
- **Versteckte/Zweitrunden-Effekte:** (a) Raid-System (Pirate Cove etc.) liefert Geld/Blaupausen/gebildete Bürger **„ohne Geld zu kosten"** (Guide) — ein Schattenhaushalt neben dem Budget. (b) Das Schweizer Konto entkoppelt persönliche Macht von Staatsmacht: Ein bankrotter Staat kann einen reichen Präsidenten haben — Impeachment-/Ende-Logik hängt an beiden.
- **Übernahme für Staatsräson:** Wir haben „Haushalts-Parallelität (Staat vs. Parteigelder)" vorgemerkt (Suzerain-Übernahme). Tropico liefert die **dritte Ebene**: ein **informeller Topf** (Parteikasse / „Stiftungen" / Umfeld-Finanzierung) mit Konversions-Kurs (Haushalt → informell nur über Korruptions-Risiko-Knoten, Rebel-Inc-Logik 6.3) und eigenem Nutzen (Personen-Gunst kaufen, Untersuchungen bremsen). Wichtig: Der informelle Topf ist **kein eigener Regler**, sondern entsteht aus Entscheidungen (Ausschreibungs-Wahl, Stiftungs-Events) — Korruption als emergente Bilanz, nicht als Slider. Gebäude-Mikrobudgets als Vorbild für unsere Provinz-Ebene: 81 Provinzen brauchen nicht je einen Regler, aber **Ausgaben-Stufen je Provinz-Programm** (5 Stufen wie Tropico) sind skalierbar.

### 9.2 Exporte, Handelsrouten, Weltmächte-Angebote

- **Funktionsweise:** Standard-Export über Docks zu schwankenden Weltmarktpreisen (Freighter-Rhythmus, T4: Import-Deckel $5.000 je Schiff per Regler); **Handelsrouten** = Verträge je Gut und Nation: Das Angebot zeigt **Prozent-Differenz zum Weltmarktpreis**, Menge, Gesamt-Erlös und **Beziehungs-Modifikator** (gamepressure, reddit) — befreundete Nationen bieten bessere Preise; Customs Office (Kalter Krieg) erhöht Export-Erlöse; Schmuggler-Docks geben +10 % auf Importe (T5-DLC-Logik, als Serien-Mechanik dokumentiert). Supermächte (EU, USA, China, Russland, Naher Osten) haben **Präferenz-Profile** (EU: Menschenrechte/Grün; China: Industrie-Output; Russland: Militär; Naher Osten: Öl) und verhängen bei schlechten Beziehungen **totalen Handels-Embargo** — „crippling the Tropican economy".
- **Kosten/Nutzen:** Routen sichern Preise gegen Volatilität; politische Nähe verbilligt sich direkt in Geld; Embargo-Risiko ist der Preis der Außenpolitik.
- **Wer gewinnt / verliert:** Wer diversifiziert (mehrere Mächte), ist erpressbar-resistent; wer sich an eine Macht bindet, bekommt Premium-Preise und ein Damokles-Schwert.
- **Versteckte/Zweitrunden-Effekte:** (a) Der Preis-Bonus ist im Vertrag sichtbar, der **politische Preis** (Beziehungs-Modifikator, Ultimaten bei niedriger Zustimmung) liegt im Kleingedruckten der UI. (b) Weltmarktpreise schwanken — eine Volkswirtschaft auf eine Ware zu bauen (Rum, Zigarren) ist eine Wette auf die Preis-Kurve.
- **Übernahme für Staatsräson:** Unsere Handels-/Energie-Verträge bekommen Tropicos **Angebots-Karte**: je Deal sichtbar {Preis-Delta vs. Weltmarkt, Volumen, Laufzeit, Beziehungs-Delta, Kondition}. Weltmacht-Profile passen zu unserem 4-Dimensionen-Modell: EU (Rechtsstaat-Dimension), USA (Sicherheit), Russland (Energie/Militär), Golf (Geld) — **jede Beziehung hat eine Ware, in der sie zahlt**. Embargo-Logik: Beziehungs-Dimension unter Schwelle → Handels-Kante wird teurer/gesperrt (muss als „Warum?"-Tooltip am Haushalt sichtbar sein: „Zolldelta wegen EU-Spannungen: +X Mrd./Jahr").

---

## 10. Kurzprofile: Anno 1800, Cities: Skylines 1/2, Frostpunk

### 10.1 Anno 1800 — Bilanz je Ware und die Royal-Taxes-Schwelle

Quellen: anno1800.fandom.com/wiki/Royal_Taxes; anno1800tutorials.wordpress.com (Experten-Guides); gamepur.com; tobyhinloopen.github.io-Guide.

- **Funktionsweise:** Einnahmen = **Steuern der Bevölkerung je Stufe** (5 Stufen Alte Welt), Zufriedenheit erhöht Steueraufkommen; Ausgaben = Unterhalt der Produktionsgebäude; **Warenbilanz** (CTRL+Q-Statistik) entscheidet: Unterbrechung einer Kette (Bier-Beispiel des Guides) kostet sofort 4.324–7.000 $ Einkommen. **Royal Taxes:** Ab 1.000 Einwohnern **einer Stufe auf einer Insel** 9 % Abzug vom Stufen-Einkommen, steigend bis **40 %** (fandom; „+1 % je 125 Einwohner über 1.000" aus Tutorial-Guide `[unverifiziert]`).
- **Kosten/Nutzen:** Ballung auf einer Insel wird progressiv bestraft → Dezentralisierung ist die Steuer-Optimierung; Ketten-Stabilität ist Liquiditäts-Management.
- **Wer gewinnt / verliert:** Aufsteiger-Stufen zahlen mehr (Investoren > Bauern) — die Bilanz belohnt Upgrade-Ketten, bestraft Massenansammlung ohne Mix.
- **Versteckte/Zweitrunden-Effekte:** Der Top-Bar-Kontostand ignoriert passive Käufe/Verkäufe (Guide-Kritik) — **die wichtigste Zahl der UI ist unvollständig**, ein dokumentierter Design-Fehler.
- **Übernahme für Staatsräson:** (a) **Progressive Konzentrations-Steuer** als Vorbild für unsere Provinz-Logik: „Ballungskosten" — Istanbul-Analog (Deprem-Risiko × Konzentration) als implizite Steuer, die Dezentralisierungs-Programme lohnend macht. (b) **UI-Ehrlichkeit**: Unsere Haushalts-Anzeige muss Nebenströme (Großprojekt-Raten, Swap-Kosten, KKM-Lasten) einbeziehen oder sichtbar markieren — Annos Fehler nicht wiederholen.

### 10.2 Cities: Skylines 1/2 — Nichtlineare Budget-Regler und Subvention-Kurve

Quellen: skylines.paradoxwikis.com (Economy, via Steam-Guide-Zitat); cs2.paradoxwikis.com/Economy; paradoxinteractive.com Feature Highlight #9; pcgamesn.com (CS2-Steuern); dotesports.com (CS2-Geld-Guide).

- **Funktionsweise (CS1):** Dienst-Budgets 50–150 %, aber Wirkung **nichtlinear**: 50 % Budget = nur 25 % Leistung; 150 % = nur 125 % Leistung; Schwellen-Effekte (101 % Budget = +1 Fahrzeug je Station — „101 % funding"-Trick, Wiki-belegt). Steuer-Sweetspot 9–12 %; Max-Satz 29 % kurzfristig ausnutzbar, bis Bevölkerung abwandert (zeitverzögerte Flucht). **(CS2):** Steuern je Zonentyp **−10 % bis +30 %**, differenzierbar nach Bildungsniveau (Wohnen) und Produkttyp (Gewerbe); negative Steuer = Subvention; **Staatliche Subventionen zur Stadt** sinken automatisch mit dem Erfolg (Feature Highlight #9: „government aid decreases as the city grows and becomes successful").
- **Kosten/Nutzen:** Budget-Regler sind Verhältnistechnik: Unterdeckung ist ineffizienter als das Sparen nützt; Subventionen sind ein **Start-Tutorial mit Ablaufdatum**.
- **Wer gewinnt / verliert:** Wer die Schwellen kennt (101 %), zahlt wenig für viel; wer linear denkt, verliert. Hohe Steuern treiben mobile Gruppen (Gutverdiener, Firmen) zuerst weg — die Basis verschiebt sich unter der Steuer weg.
- **Versteckte/Zweitrunden-Effekte:** (a) Steuer-Flucht ist **verzögert** — kurzfristig Max-Sätze melken möglich („rinse and repeat"-Exploit, guidestrats). (b) Negative Steuern als Subvention sind explizit einpreisbar (CS2).
- **Übernahme für Staatsräson:** Unsere 9-Regler-5-Stufen bekommen die **Nichtlinearität explizit**: Stufe 1 (hungern) = Leistung bricht überproportional ein (25 %-Regel), Stufe 5 (Maximum) = schwache Grenznutzen + Nebenwirkungen (Bürokratie, Korruptions-Risiko). Das verhindert „alles auf 5" als Trivial-Strategie (Tor-A-Test im Verbesserungsplan verlangt genau das!) und macht die Mitte attraktiv — mit Mentorin-Erklärung der Grenznutzen-Kurve. **Subvention-Kurve** für den Spielstart 2028: externe Stütze (z. B. Swap-/Devisen-Puffer) nimmt mit wachsender Stabilität ab — das Spiel wird schwerer, wenn man gewinnt (Anti-Snowball, D4-Entwickler-Zitat: „Game design hates virtuous circles" — wir bauen sie bewusst ein und brechen sie kontrolliert).

### 10.3 Frostpunk — Knappheit als Moral-Preis

Quellen: gamingbolt.com (Complete Guide); vigaroe.com (Resource-Analyse); grokipedia.com/page/Frostpunk (Themen, Zahlen).

- **Funktionsweise:** **Kein Geld.** Ressourcen: Kohle (Generator = Überleben), Holz/Stahl (Bau/Forschung), Nahrung (roh → Rationen 1:2 in Cookhouses), Steam Cores (Automaten); Dauer-Druck durch Temperatur-Stufen und Stürme; **Book of Laws**: Gesetze kaufen Produktivität/Überleben mit **Hope/Discontent** — Extended Shift: +40 % Output „praktisch gratis" auf Kohleminen, aber Holz-Konverter verlieren auf höherem Schwierigkeitsgrad Effizienz (Charcoal Kiln: 21 Kohle/7 Holz auf Mittel vs. 15/7 auf Extrem — vigaroe); Child Labor, Sawdust-Food, Not-Amputation als eskalierende Stufen; Endscreen „Was it worth it?".
- **Kosten/Nutzen:** Währung der Gesetze ist **Legitimität** (Hope/Discontent), nicht Geld; kurzfristig Output, langfristig Gesellschafts-Verfall bis zur Aufstands-/Exodus-Schwelle.
- **Wer gewinnt / verliert:** Effizienz-Denken gewinnt Tage, Moral-Verfall verliert die Stadt; die „Order/Faith"-Pfade kaufen Kontrolle gegen Freiheit.
- **Versteckte/Zweitrunden-Effekte:** (a) „Creeping normality" (Lead Designer Stokalski): Eskalation erfolgt in kleinen, einzeln vertretbaren Schritten — die Summe ist der Preis. (b) Schichten-Konflikt ist codiert (Elite/Arbeiter/Hungernde mit eigenen Unzufriedenheits-Anzeigen).
- **Übernahme für Staatsräson:** (a) **Legitimität als Währung** neben Lira und PK: Ausnahme-Gesetze (OHAL-Analog, Notfall-Dekrete) kosten aus einem Legitimitäts-Topf mit langsamer Regeneration — und die Endbilanz („Geschichtsbuch" existiert!) fragt „War es das wert?". (b) **Eskalations-Leiter mit kleinen Schritten**: Unsere Krisen-Gesetze sollen als Kette designet sein, bei der jeder Schritt einzeln vernünftig wirkt und die Summe das Regime verändert — der stärkste didaktische Punkt Frostpunks für ein Politik-Spiel.

---

## 11. Wie Geld in Staatssimulationen fließt — vergleichende Typologie

### 11.1 Sechs Architekturen im Vergleich

| # | Architektur | Vertreter | Währungen | Wer hält das Geld | Zeit-Modell | Versagens-Modus |
|---|---|---|---|---|---|---|
| T1 | **Ein-Topf-Geld** | Civ 6, Tropico, Anno | 1 (Gold/$), ggf. + Schattenkasse | Staat direkt | sofort, kein Kredit | Illiquidität = Stillstand |
| T2 | **Budget-Klammern** | Suzerain (Sordland), Rizia (B/A/E) | 1–3 abstrakte Punkte | Staat, verdeckte Wirtschaft dahinter | Entscheidungs-Zyklen | Punktschwelle → Downgrade/Depression |
| T3 | **Doppelwährung Geld + PC** | Democracy 4 | Geld + Politisches Kapital (+ Zeit) | Staat; PC „gehört" Kabinett/Mehrheit | Runden + Implementierungsdauer | Schuldenkrise + Wahl-Niederlage |
| T4 | **Industrie-Kapazität statt Geld** | HOI4 | Fabriken, PP, Ressourcen | Staat verfügt direkt | Tage, Bau-Queues | Fabrik-Mangel, Konsumgüter-Bindung |
| T5 | **Endogener Kreislauf** | Victoria 3 | Geld, aber emergent (Pops, Gebäude, Pool) | **Alle**: Pops, Gebäude, Staat, Pool | Wochen, Preise sofort | Default-Kaskade, Radikalisierung |
| T6 | **Cashflow mit Verhaltens-Steuern** | Rebel Inc | Geld + Inflation + Korruption + Reputation | Staat, aber Einkommen hängt an Reputation | Monatlich, Geschwindigkeit bepreist | Reputations-Todesspirale |
| (T7) | **Regler + Fraktionen + Doppelwährung** | CitK/Ostalgie, Eversim | Rubel+Devisen / Geld+Rating | Staat, Fraktionen, Gläubiger | Monate/Quartale | Putsch, Bankrott, Rating-Tod |

### 11.2 Was die Typen lehren

- **T1 lehrt Einfachheit**, erzeugt aber „Geld ist nie das eigentliche Problem"-Flachheit; Tropicos Schattenkasse zeigt, wie man T1 mit einer politischen Zweitkasse repariert.
- **T2 lehrt Lesbarkeit**: Klammern übersetzen Billionen in vergleichbare Schritte; der Preis ist Undurchsichtigkeit (didaktisch gewollt: Vertrauen ins System).
- **T3 lehrt die sauberste Kosten-Trennung**: Geld ≠ Durchsetzbarkeit ≠ Zeit. D4s Vier-Preise-Modell (einführen/streichen/hoch/runter) ist die vollständigste Preis-Logik aller Vergleichsspiele.
- **T4 lehrt Opportunitäts-Denken** (jede Fabrik hat eine alternative Verwendung) und zeigt, dass „kein Geld" nur funktioniert, wenn der Staat total verfügt (Krieg).
- **T5 lehrt Demut**: Der Staat ist ein Akteur unter vielen; die stärksten Hebel (Investment Pool, Preise) gehören ihm nicht.
- **T6 lehrt die zweite Ableitung**: Nicht das Niveau, sondern die **Geschwindigkeit** des Ausgebens wird bestraft — die eleganteste Anti-Hektik-Mechanik im Vergleich.
- **T7 lehrt Währungs-Spaltung** (Rubel/Devisen, Lira/Swap) und **Gläubiger als Personen**.

### 11.3 Empfehlung für Staatsräson

Unser Realismus-Anspruch (echte Türkei-Daten, Zentralbank, Märkte) verlangt eine **Hybrid-Architektur: T3-Kern + T5-Schichten + T6-Dynamik + T7-Spaltung**, mit T2 nur als Anzeige-Übersetzung:

1. **Kern (schon vorhanden):** 9-Regler-Haushalt in echten Lira (18,9 Bio. Gesamtrahmen, Zinsdienst 14,7 %) + PK mit Überziehung (T3). Behalten. Ergänzen um D4s Vier-Preise pro Maßnahme und PC-Deckel (2× Zufluss).
2. **T5-Schicht (neu, mittel):** Privater Investitions-Knoten und Preisband für 4–6 Schlüsselpreise (Energie, Baukosten, Miete, Lebensmittel, Devisen). Der Staat steuert Bedingungen, nicht Ergebnisse — passt zur Taylor-Zentralbank (auch dort: Bedingungen, nicht Knöpfe).
3. **T6-Dynamik (neu, klein):** Ausgabe-Änderungsrate als eigener Kanten-Treiber auf Inflationserwartung und Korruptions-Risiko; Schnitt-Geschwindigkeit analog auf Groll (CitK-Lektion).
4. **T7-Spaltung (neu, mittel):** Devisen-Topf (Reserven, Swap-Linien, Energie-Rechnung) getrennt von Lira; Gläubiger als 3–4 benannte Gruppen mit Quartals-Verhandlung (Eversim) und IWF-Stand-by mit Review-Rhythmus (Suzerain-Konditionen + Eversim-Quartal).
5. **T2 als UI (klein):** Große Entscheidungen zeigen zusätzlich Klammern („−2") als Übersetzung des Lira-Preises in „Monate Spielraum" — Rizias BPT-Sprache für die Mentorin.
6. **Schattenebene (klein, Tropico):** Informeller Topf emergent aus Entscheidungen, gekoppelt an Korruptions-Risiko; kein Regler.

Abgelehnt für uns: T1 pur (zu flach), T4 pur (nur Kriegswirtschaft), HOI4s „keine Schulden" (unser Thema **ist** die Schuldenfalle — Türkei 2028 mit 14,7 % Zinsdienst-Anteil ist die perfekte Start-Kalamität).

Kalibrierungs-Notiz: Die Start-Situation soll die drei Flüsse so spannen, dass **jede** Währung knapp ist, aber unterschiedlich: Lira knapp (Defizit), Devisen sehr knapp (Reserven-Debatte), PK mittel (frische Amtszeit = D4-Amtsbonus), Legitimität mittel. Dann ist die Kernfrage des Auftraggebers spielbar: „Was kostet es, welches System zu ändern — und in welcher Währung zahle ich?"

---

## 12. Top-15-Übernahmen (nach Wert/Aufwand)

Sortiert nach Verhältnis Wert/Aufwand (beste zuerst). Aufwand: S = Tage, M = 1–2 Wochen, L = größer. „Bezug" = vorhandenes System im Projekt.

| # | Übernahme | Quelle(n) | Wert für Staatsräson | Aufwand | Bezug |
|---|---|---|---|---|---|
| 1 | **Ausgabe- UND Schnitt-Geschwindigkeit als eigener Preis** (Inflation/Groll treibt die Änderungsrate, nicht nur das Niveau) | Rebel Inc. 6.2, CitK 7.1 | Trivial-Strategie „alles auf einmal" stirbt; Wahlgeschenk-Timing wird spielbar | S | Politiknetz-Kanten, Makromodell Z2/Z3 |
| 2 | **Vier-Preise-Modell je Maßnahme** (einführen/streichen/verschärfen/abschwächen, je eigener PK-Preis; Streichen > Bauen) | Democracy 4, 1.1 | „Subventionen abbauen" wird zur echten zweiten Schlacht; PK-Ökonomie vollständig | S | PK mit Überziehung, Erlass/Parlament-Preise |
| 3 | **PK-Deckel = 2× Zufluss** + Amtsbonus | Democracy 4, 1.1 | Horten-Strategie verboten; Priorisierung erzwungen | S | PK-System |
| 4 | **Minister-Kompetenz multipliziert Kosten UND Umsetzungsdauer** ihrer Ressort-Maßnahmen | Democracy 4, 1.1/1.2 | Kabinett wird wirtschaftlich greifbar; Entlassungs-Trade-off schärfer | S | 10 Minister-Ämter, Ghost-Slider |
| 5 | **Crash-Aufpreis 3–4×** (Zeit-Geld-Kurs: sofort vs. über Jahre) | Civ 6, 4.2 | Großprojekte/Programme bekommen ehrlichen Eil-Preis | S | Großprojekte, Haushalt |
| 6 | **Nichtlineare Regler-Wirkung** (Stufe 1 = Leistung bricht ein, Stufe 5 = schwacher Grenznutzen + Nebenwirkung) | Cities: Skylines 10.2 | „Alles auf Maximum" scheitert strukturell (Tor-A-Anforderung) | S | 9-Regler-Haushalt |
| 7 | **Klammer-Anzeige für Großentscheidungen** („−2 Monate Spielraum" neben Lira) | Suzerain 5.1, Rizia BPT | Lira-Billionen werden vergleichbar; Mentorin-Sprache | S | Haushalt-UI, Mentorin |
| 8 | **Effective-Procurement-Dilemma** (saubere Vergabe = +10 % Kosten/Tempo, −Skandal-Risiko) | Rebel Inc. 6.3 | Korruption wird ehrlicher Trade-off statt Button | S | Bauvergabe-Flag, Regierungsprogramme |
| 9 | **Korruptions-Risiko als verzögertes Zufalls-Konto** + Pressefreiheit als Entdeckungs-Multiplikator | Rebel Inc. 6.3 | Auftraggeber-Beispiel (Pressefreiheit) mechanisch exakt abgebildet | M | Ereignismotor, Politiknetz |
| 10 | **Rating mit Hysterese-Stufen** (IG-Schwelle kippt, Upgrade dauert doppelt so lang) + Halbjahres-Reviews | D4 1.3 + Eversim 8.2 | Zinsdienst (14,7 % Start!) bekommt dramatische Struktur | M | Risikoaufschlag Z8, Staatskalender |
| 11 | **Gläubiger als 3–4 benannte Gruppen mit Quartals-Verhandlung** | Power & Revolution 8.2 | Schulden werden Beziehungen; Verhandlungstisch bekommt Finanz-Agenda | M | Verhandlungstisch, Schuldenmodell Z7 |
| 12 | **Devisen-Topf getrennt von Lira** (Reserven/Swap/Energie-Rechnung; nicht druckbar) | Ostalgie 7.2 + Rizia 5.3 | Türkei-Realismus pur; Außenpolitik wird Zahlungsmittel | M | Makromodell Z4/Z5, Länderbeziehungen |
| 13 | **IWF-Stand-by-Analog mit Review-Rhythmus und „Abzocke-ablehnbar durch Diplomatie"** | Suzerain 5.3 + Eversim 8.2 | Kern-Szenario Türkei; zeigt: Verbündete sind die billigste Währung | M | Verhandlungstisch, 4-Dimensionen-Modell |
| 14 | **Preisband 25–175 % für 4–6 Schlüsselpreise** mit Shortage-Kaskade (−5 %, dann −1 %/Tag, klebrig) | Victoria 3, 2.5 | Gefühlte Teuerung (Z11) bekommt benannte Preise (Miete! Energie!) | M | Politiknetz, Provinz-Ebene |
| 15 | **Belastungs-Leiter mit Legitimations-Tor** (Konsum-Abgabe in Stufen, freigeschaltet durch Krise/Parlament/Opferbereitschaft) | HOI4, 3.2 | Kriegs-/Krisenwirtschaft als stufiger, reversibler Pfad | L | MIL-1-Pfad, Politiknetz |

**Danach (Reserve, bewusst nicht Top-15):** Privater Investitionspool als Knoten (Vic3 2.3, L — kommt mit Fachbereich Wirtschaft); Anno-Konzentrationssteuer für Provinzen (10.1, M); Subventions-Auslaufkurve als Anti-Snowball (10.2, S); Baukosten-Endogenität der Großprojekte (Vic3 2.3, M); Levy-Analog „Kapazität auf Zeit mit Verfallsdatum" (Civ 6, M); Tropico-Angebotskarte für Handelsdeals (9.2, M).

---

## Anhang: Unsicherheiten und offene Verifikationen

1. **HOI4 Total Mobilization Konsumgüter:** 10 % (Construction-Wiki, versions-verifiziert; Guides; Mods) vs. 15 % (Ideas-Wiki-Tabelle). Überwiegend 10 %; vor Zitaten in öffentlichen Texten Gegencheck im aktuellen Build.
2. **Vic3 Investment-Pool-Basissätze:** Dev Diary #71 (1.2): Kapitalisten 20 % / Aristokraten 10 % / Farmer+Shopkeeper 5 %; aktuelle Wiki impliziert Aristokraten-Basis 20 % (Industry Banned +25 % → 45 %). Versionsdrift — bei Übernahme ohnehin nur die *Struktur* (fester % der Dividenden + Effizienz-Multiplikatoren) relevant.
3. **D4 PC-Einzelpreise** (z. B. exakte Einführungskosten Todesstrafe): nur strukturell belegt (CSV-Spalten Introduce/Cancel/Raise/Lower + qualitative Skala „wenig" bis „vast"); Zahlen je Politik aus `policies.csv` extrahierbar, falls gewünscht — hier nicht verifiziert.
4. **Suzerain 1.0 vs. 2.0:** Kredit-Downgrade bei −8 gilt für 1.0 (Community); 2.0 „Amendment" baute auf Tiers (hoch/mittel/niedrig, Start 7) um — Schwellen können verschoben sein. Rizia-Werte (Guide 3.1) sind patchsensitiv („the values of many decisions had changed").
5. **Rebel Inc. Korruptions-Formeln:** Wiki-Snippet verstümmelt („(c3.6)×6", „1.15×c2") — Richtung sicher (monatlicher Reputations-Abzug ∝ Korruption; Support-Schaden überlinear), Koeffizienten `[unverifiziert]`.
6. **Civ-6-Kaufkurs 4:1:** Community-Faustregel, breit dokumentiert; exakter Engine-Parameter hier nicht aus Primärquelle verifiziert. Faith ≈ halber Goldkurs.
7. **Anno Royal Taxes:** 9 % ab 1.000 je Stufe, max 40 % (fandom); die Progression „+1 %/125 Einwohner" nur aus Tutorial-Blog `[unverifiziert]`.
8. **Ostalgie/CitK Devisen-Detail:** Zweitwährungs-These stützt sich auf Gameplay-Material und Serien-Berichte; kein offizielles Wiki mit Zahlen gefunden — als Design-Beleg ausreichend, als Zahlen-Quelle nicht.
