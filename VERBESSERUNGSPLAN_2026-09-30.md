# VERBESSERUNGSPLAN — Stand 30. September 2026

Großer Änderungs- und Verbesserungsplan für das Spiel (Arbeitsname NWO / „Staatsräson").

## 0. Grundlage und Methode

Dieser Plan stützt sich auf drei vollständige Bestandsaufnahmen vom selben Tag:

- **Design-Stand**: alle Designdokumente (SPIELDESIGN v0.5, ENTSCHEIDUNGEN Blöcke A–M/T2, POLITIKNETZ, VERHANDLUNGSTISCH, PERSONEN, WIRTSCHAFTSAKTE, FACHBEREICHE u. a.) — Details in `analyse/DESIGN_BESTANDSAUFNAHME.md`
- **Code-Stand**: das komplette Spiel unter `game/` (~36.000 Zeilen TS/React, 335 Tests), Bereich für Bereich mit Dateipfaden geprüft
- **Recherche-Stand**: REFERENZANALYSE, RECHERCHE_MECHANIKEN, RECHERCHE_KONKURRENZ_FACHBEREICHE, ANALYSE_SPIELBARKEIT_2026-09-29 — Auswertung in `AUSWERTUNG_RECHERCHEBESTAND.md`

Verbindliche Vorgaben aus ENTSCHEIDUNGEN.md werden nicht angetastet, sondern als Rahmen behandelt. Der Plan dupliziert keine Recherche, sondern verzahnt die ~25 als „sofort" markierten Übernahmen aus RECHERCHE_MECHANIKEN mit den Stufen 0–5 der Spielbarkeitsanalyse und dem tatsächlichen Implementierungsstand.

**Lesart der Prioritäten**: P0 = jetzt (nächste Arbeitspakete), P1 = danach, P2 = vor Veröffentlichung. Aufwand: S < 1 Tag, M = 1–3 Tage, L > 3 Tage.

---

## 1. Gesamturteil

Das Projekt ist weiter als die Spielbarkeitsanalyse vom 29.09. („Simulation ja, Spiel nein") vermuten ließ: Die diagnostizierten Sofortfehler sind seitdem größtenteils behoben — 81 Provinzen mit Echtdaten, Ortsbezug bei Maßnahmen, Karte hochauflösend, Ereignismotor, Politisches Kapital mit Überziehung, Beschluss-/Parlamentskern, E2E-Spieltest. Der Code-Stand von heute ist **ein spielbares Spiel**, kein Simulationsgerüst mehr.

Die drei verbleibenden strukturellen Hauptprobleme:

1. **Kalibrierung ist durchgehend Platzhalter.** Praktisch jede Simulationskonstante (Netz-Gewichte, Wirtschaftsparameter, Bewertungsformeln) ist im Code als „Spielparameter, keine Tatsachen" markiert. Damit ist Balance — und damit Spielspaß — weiterhin unbewiesen. Die Langpartie-Tests prüfen „läuft", nicht „fordert".
2. **Die KI sitzt nur an einem Ort.** Neun Anbieter sind angebunden, aber nur der Präsidialamt-Chat nutzt sie. Personengespräche, Verhandlungsdialoge, Ereignistexte, Presse — alles regelbasierte Bausteine. Das ist die größte ungenutzte Alleinstellung.
3. **Krieg existiert nicht — auch nicht als Vorgang.** Die Entscheidung „strategisch/abstrakt, der Präsident bestellt und verantwortet, er kommandiert nicht" ist richtig und bleibt. Aber selbst diese abstrakte Ebene (Einsatz als mehrstufiger Vorgang mit Eskalation, Besatzung, Friedensschluss) ist weder designt im Detail noch implementiert. Der Parser sagt ehrlich „gibt es nicht".

Dazu kommt eine Reihe gezielter, billiger Übernahmen aus den Referenzspielen, die Recherche und Analyse schon fertig vorbereitet haben.

---

## 2. Vergleichsmatrix: Wo steht das Spiel gegenüber den Vorbildern?

| Bereich | Civ 6 | HOI4 | Suzerain | Democracy 4 | Victoria 3 | **Dieses Spiel (Stand 30.09.)** |
|---|---|---|---|---|---|---|
| Politiknetz/Wirkungsketten | — | Tooltips kausal | Flags unsichtbar | Netz, Hysterese, Ghost-Slider | Institutionen | **103 Maßnahmen, 100 Größen, 412 Kanten, Hysterese, je Provinz** — übertrifft D4 (Region, „Warum"-Sätze) |
| Regionale Tiefe | Distrikte, Adjacency | Provinzen (Taktik) | keine | keine | Staaten | **81 Provinzen mit Echtdaten, Bezirke als Overlay** — Alleinstellung gegenüber D4/Suzerain |
| Wirtschaft | abstrakt | Produktion/IC | Budget-Klammern | Sim-Kern | Preisformel 25–175 % | **Taylor-Regel, Zentralbank A/B/C, 9-Regler-Haushalt, Monte-Carlo-Prognose** — fehlt: Außenwirtschaft |
| Parlament/Gesetze | Weltkongress | PP-Gesetze | Verfassung 2/3 | PC-Preise | Legitimität | **Gesetz/Erlass, Fraktionsverhandlung, Stimmenkauf, Überziehung** — rund |
| Bauen | Wunder exklusiv, Queue | Ziv/Mil-Fabriken | 3-Firmen-Vergabe | — | zweigeteilte Queue | **Reich-Bausystem, 100+ Vorhaben, Baukapazität/Verwaltungskraft** — fehlt: Vergabeoptionen, PE-Kurve |
| Militär | Einheiten-Taktik | Fronten/Designer | — | — | Fronten abstrakt | **Beschaffung/Doktrinen/Bereitschaft voll; Krieg = 0** (bewusst, aber Lücke) |
| Diplomatie | Grievances, Lens | Sperrfristen | Vertrags-Exklusivität | — | Klauselpakete | **54 Klauseln, Rote Linien, Gegenangebote, Vermittlung (Alleinstellung!)** |
| Personen | — | — | Figuren mit Privatleben | Minister 3 Rollen | — | **10 Ämter, 7 Gesprächsansätze, Zusagen, Nachfolge** — mechanisch, ohne KI-Text |
| Erzählerik/Feedback | Wunderfilme | National Spirits | Zeitung, 450k Wörter | Event-Wettbewerb | — | **Chronik, Bilanz-Geschichtsbuch** — fehlt: Zeitung, In-Character-Labels |
| Zeit | Runden | pausierbar | 12 Turns à 4 Monate | Quartale | Echtzeit | **pausierbare Tage, 5 Geschwindigkeiten, Staatskalender** — rund |
| KI-Einsatz | keine | keine | keine | keine | keine | **9 Anbieter, aber nur 1 Einsatzort** — größte ungenutzte Differenzierung |

**Kernbefund**: In der *breiten* Mechanik-Abdeckung ist das Spiel den Vorbildern ebenbürtig oder voraus (Region, Vermittlung, freie Sprache, Agenda). Der Rückstand liegt in drei Punkten: (a) ausgereifte Zahlen, (b) narrative Präsentation (Suzerain-Niveau), (c) Krieg als erlebbarer Vorgang.

---

## 3. Bereichspläne

### 3.1 Militär, Krieg, innere Sicherheit

**Stand**: Beschaffungskette mit 27 real recherchierten Vorhaben (KAAN, Altay, Stahlkuppel, F-35-Sperre über S-400), 13 Politiknetz-Knoten (Bereitschaft je Teilstreitkraft, Moral, Offiziersvertrauen, Abschreckung, Autarkie), 3 ausschließende Doktrinen, Haushaltsregler, Generalsvertrauen. Krieg: nicht vorhanden, Parser-Antwort ehrlich. Geheimdienst/dunkle Wege: designt (Block D), nicht gebaut.

**Referenzvergleich**:
- HOI4 ist das Tiefen-Vorbild, aber die abgelehnten Teile (Echtzeit-Taktik, Divisionsdesigner, Score-Auktion) sind zugunsten der Präsidentenperspektive richtig abgelehnt.
- Was HOI4 trotzdem hat und hier fehlt: **Mobilisierungsleiter** (Gesetzesstufen Isolation → Totalmobilmachung mit War-Support-Gate), **Krisen-Spirits** („Rising Inflation" blockiert Gesetze — exakt die Domäne dieses Spiels), **Produktions-Effizienz-Lernkurve** (10 % → 50 %, Retention beim Umstellen), **Besatzungsmodell** (`25 % + 65 % × Compliance`).
- Suzerain zeigt, dass Krieg auf Präsidentenebene funktioniert: wenige, irreversible Entscheidungen mit voller Folge.

**Vorschläge**:

| # | Vorhaben | P | Aufwand | Begründung |
|---|---|---|---|---|
| MIL-1 | **Krieg als Vorgangsobjekt** (kein Taktikspiel): Zustände Spannung → Drohkulisse → Einsatzbeschluss (Parlament!) → Verlauf in Phasen (Wochen-Schritte, abstrakte Frontlage aus Bereitschaft/Moral/Nachschub/Doktrin) → Waffenruhe → Frieden in Schritten. Folgen voll: Märkte, CDS, Wählergruppen, Offiziersvertrauen, EGMR, Ausstrahlung auf Drittländer. Nutzt das vorhandene Vorgangs-Objekt (6 Zustände). | P1 | L | Größte Design- und Code-Lücke; Entscheidung Block C verlangt „Krieg strategisch/abstrakt, Folgen voll" — das ist exakt umsetzbar, ohne Taktik zu bauen |
| MIL-2 | **Mobilisierungsleiter** (HOI4-Übernahme, schon in MECHANIKEN vorgemerkt): 4–5 Stufen Wirtschaft/Wehrpflicht, Wechsel kostet Kapital + Zeit, hohe Stufen nur bei akuter Krise (War-Support-Gate = Öffentlichkeits-Schwelle), mit Rückstellungs-Rechnung nach Kriegsende | P1 | M | Billige Übernahme, verleiht Militär Politikpreis |
| MIL-3 | **Krisen-Blocker** (HOI4 „National Spirits"): akute Zustände (Inflation > Schwelle, Erdbeben, Krieg) sperren/passivieren bestimmte Maßnahmen und zeigen das im Netz als Blocker-Badge | P0 | S–M | Steht in der Sofort-Liste der Mechanik-Recherche; erhöht Härte der Spielschleife, adressiert „alles gleichzeitig geht" |
| MIL-4 | **Produktions-Effizienz für Rüstungsvorhaben** (HOI4 PE): Serienreife-Faktor je laufendem Programm, Umstellung/Runderneuerung kostet Effizienz — macht Doktrinwechsel teuer und träge | P2 | M | Realismus plus Entscheidungsgewicht bei Doktrin-Ästen |
| MIL-5 | **Geheimdienst/dunkle Wege** (Block D) als eigenes Modul: Operationen mit Entdeckungswahrscheinlichkeit, Geheimhaltung als Verbrauchsgut, Blowback-Ereignisse; bewusst nach Krieg (MIL-1), weil Blowback dort andockt | P2 | L | In ENTSCHEIDUNGEN verbindlich („die hässlichen Wege"), aber erst sinnvoll, wenn es etwas zu eskalieren gibt |
| MIL-6 | Innere Sicherheit schärfen: bestehende Probleme (Terror GTI 36, Drogen 311.793 Ereignisse, Haftüberfüllung 142 %) mit **Polizei-Reserven und Einsatzermüdung** verknüpfen (Gaffer-Effekt: Überzugehen kostet Legitimität) | P2 | M | Vertieft Innenpolitik, kein neues System nötig |

**Bewusst NICHT** (Negativliste der Recherche bestätigt): keine Einheitenbewegung auf der Karte, kein Schlachten-Interface, keine Echtzeit-Anforderungen.

### 3.2 Wirtschaft

**Stand**: Am weitesten ausgebaut (~85 %). Makromodell Z1–Z9 mit Taylor-artiger Regel, Zentralbank A/B/C mit Druck-Formeln, Haushalt mit 9 Reglern à 5 Stufen und Paketen, ~21 Kennzahlen mit 120-Monats-Verläufen und Treiber-Zerlegung, Monte-Carlo-Prognosebänder in Web Workern, Veröffentlichungsverzögerung (PublishedValue), Außenwelt-Indizes (Öl, EU-Nachfrage, Weltzins).

**Referenzvergleich**:
- Democracy 4: Political-Capital-Preise je Aktion — hier vorhanden und erweitert (Überziehung bis −20).
- Victoria 3: **Preisband 25–175 %** und **Goldreserve-Deckel 20 % BIP** — hier fehlt beides; Außenwirtschaft ist nur Index-Rauschen.
- Suzerain: Haushalts-Parallelität (Budget-Zug in einem Zug) — vorgemerkt, nicht umgesetzt; hier gibt es jederzeitige Regler, was Härte nimmt.
- Anno/W&R: Produktionsketten, „Set minimal fertility"-Schwellen — nicht übertragen (bewusst kein Warenspiel), aber die **Ketten-Diagramme** sind eine UI-Übernahme wert.

**Vorschläge**:

| # | Vorhaben | P | Aufwand | Begründung |
|---|---|---|---|---|
| WIR-1 | **Kalibrierung Makro-Kern an Lernfällen**: Replay 2019 (Rezession), 2021 (Zinsstreit/Lira-Sturz), 2023 (Erdbeben + Wahl) als automatisierte Szenario-Tests; Ziel: Verläufe qualitativ richtig (Richtung + Größenordnung), nicht punktgenau | P0 | L | Ohne kalibrierte Zahlen ist alles andere Dekoration; die drei Lernfälle sind in der Spielbarkeitsanalyse als Kalibrierungsmaß schon benannt |
| WIR-2 | **Außenwirtschaftsmodell minimal**: Leistungsbilanz, Devisenreserven (Start aus WIRTSCHAFTSAKTE), Netto-Auslandsverschuldung; Wechselkursreaktion bei Reserven < Schwelle; IWF-Ereignisvorlage wird echte Option mit Bedingungen | P1 | M–L | Im Design als Lücke ausgewiesen („fehlt mangels Modellgrößen"); die Türkei-Geschichte 2018–2023 ist ohne Devisen nicht erzählbar |
| WIR-3 | **Haushalts-Zyklus mit Parallelität** (Suzerain): Regler jederzeit, aber **Haushaltsgesetz einmal jährlich im Oktober** als großer parlamentarischer Akt mit Paketlogik; Zwischenänderungen nur gegen Aufpreis | P1 | M | Erzeugt Rhythmus (Staatskalender hat den Slot schon) und Härte; jetzt sind Regler folgenlos verschiebbar |
| WIR-4 | **Political-Capital-Zweispaltung** (aus Mechanik-Liste): Trennung Kanzlei-Kapital (Tagesgeschäft) / Parlaments-Kapital (Gesetze) — verhindert, dass ein Topf alles finanziert | P1 | S–M | Sofort-Übernahme, erhöht Zielkonflikt |
| WIR-5 | **Subventions-Slider mit Doppelwirkung** (Cities: Skylines 2 „subsidize-then-tax"): Subventionen senken Preise und treiben Defizit + Branchenverzerrung sichtbar ins Netz | P2 | S | Billig, lehrreich (Lernkonzept) |
| WIR-6 | Treiber-Zerlegung um **Gegenrechnung** erweitern: „Was müsste passieren, damit diese Zahl X erreicht?" (inverse Abfrage über dieselben Kanten) | P2 | M | Alleinstellung ausbauen; Lern-Tor profitiert |

### 3.3 Recht, Justiz, Verfassung, Korruption

**Stand**: Gesetz (301/600, 21 Tage) vs. Erlass (doppelte Kosten, Vertrauensverlust), Fraktionsverhandlung mit 4 Stufen, Duldung/Sachkoalition, Stimmenkauf mit Lückenanzeige, Parlament mit D'Hondt je Provinz. Justiz als Fachbereich: Sitze-Besetzungsmodell (AYM 15 = 12+3, HSK 13) wirkt monatlich auf `justiz_unabhaengigkeit`, EGMR-/AYM-Ereignisse, Haftrevolte. Korruption regelbasiert mit 4 Affärenvarianten und 420 Tagen Sperrzeit.

**Referenzvergleich**:
- Suzerain: **Verfassungsänderung als Endgegner** (2/3 + Oberstes Gericht) — hier komplett fehlend, obwohl das Türkei-Szenario danach ruft (Präsidialsystem, Amtszeit).
- CK3: **Haken-System** (starker Haken erzwingt, 5 Jahre Abklingzeit) — Steigerung des vorhandenen Stimmenkaufs.
- Victoria 3: Legitimität < 25 blockiert Institutionen — hier ist Legitimität nur weiche Währung.

**Vorschläge**:

| # | Vorhaben | P | Aufwand | Begründung |
|---|---|---|---|---|
| REC-1 | **Verfassungsreform als mehrstufiger Vorgang**: Paket schnüren (Amtszeit, Wahlrecht, Justiz, Notstand), Hürden 301 vs. 360 (Referendumspflicht), AYM-Anfechtung mit echter Chance je nach Sitze-Stand, Referendum als Mini-Wahl | P1 | L | Politisch der größte Hebel der Türkei-Bühne; Suzerain beweist die Dramaturgie; baut auf vorhandenen Systemen auf |
| REC-2 | **Notstands-System**: Ausnahmezustand mit Nutzen (Sicherheitsmaßnahmen sofort, Blocker aufgehoben) und Zähler (Legitimität, EGMR, Wirtschaft) — begrenzt, verlängerbar, mit Abgewöhnungspreis | P2 | M | Passt zu Krisen-Blocker (MIL-3); realhistorisch zentral (2016–2018) |
| REC-3 | **Haken/Gefallen-Ökonomie** (CK3/Suzerain): Gefallen von Fraktionsführern und Figuren als sichtbares Konto; starker Haken erzwingt eine Stimme, einmalig, lange Abklingzeit | P1 | M | Steht auf der Übernahmeliste; macht PERSONEN-System und Parlament zusammen reicher |
| REC-4 | **Medien-System als eigener Bereich**: Eigentümerstruktur (Pool vs. unabhängig), RSF 163/180 als lebender Wert, Maßnahmen von Förderung bis Schließung; wirkt auf Umfrage-Fehler und Ereignis-Sichtbarkeit | P2 | M–L | Im Design als Lücke genannt; verstärkt den dunklen Pfad und den Wahrheits-/Informationsgedanken |
| REC-5 | Verwaltungskapazität sichtbar machen: Überlast (max. 8 Vorhaben) als **Ressort-Stauanzeige** je Ministerium statt einer globalen Zahl | P1 | S | Konkurrenzrecherche: „Verwaltungskraft als Währung" ist schon entschieden — jetzt fühlbar machen |

### 3.4 Infrastruktur, Bauen, Großprojekte, Regionen

**Stand**: Reich-Bausystem mit Baukapazität (~110 + Industrie), Verwaltungskraft, Verfall/Pflege, Zustand 0–100; über 100 Vorhaben in vier Katalogen (Infrastruktur 36, Militär 27, Kultur 24, Recht 14) mit Bestand/im Bau/Voraussetzungen/Ausschluss-Ästen; 81 Provinzen mit Echtdaten, 53 UNESCO-Stätten; regionale Maßnahmen mit Ortsfaktor; WunderFenster (in Arbeit, uncommittete Änderungen).

**Referenzvergleich**:
- Civ 6: **Wunderlogik** (exklusiv, Standortregeln, 50 %-Rückerstattung bei Verlust, **Wunderfilm als Belohnung**), **Produktions-Queue FIFO**, **Lens-System**, Distrikt-Adjacency mit Unumkehrbarkeit.
- Suzerain: **Bauvergabe an drei Firmentypen** (billig-korrupt / teuer-sauber / Mittelweg) — die beste Vorlage für Vergabe als *politische* Entscheidung.
- Victoria 3: zweigeteilte Bauqueue (staatlich/privat).
- Tropico 6: Weltwunder mit *politischer* Wirkung (nicht Geld) — „Vorteil ohne Geld".
- Anno: Ketten-Diagramme; HOI4: Baukosten-Anker.

**Vorschläge**:

| # | Vorhaben | P | Aufwand | Begründung |
|---|---|---|---|---|
| INF-1 | **Bauvergabe mit 3 Optionen** (Suzerain-Übernahme, steht auf der Sofort-Liste): je Vorhaben Vergabe an (a) schnell/teuer/loyale Firma, (b) günstig/langsam, (c) transparente Ausschreibung (langsamster Start, kein Korruptionsrisiko, EU-freundlich); Korruptions- und Skandalrisiken differieren | P0 | M | Macht Bauen zur Entscheidung statt zur Warteschlange; dockt an vorhandene Korruptionsregeln an |
| INF-2 | **Wunderlogik schärfen** (Civ 6): Prestige-Vorhaben (Kanal Istanbul-Typ) als exklusive Projekte mit Standortregeln, internationaler Konkurrenz (wer zuerst?), Fertigstellungs-**Film/Sequenz** als emotionale Belohnung; Abbruch = Prestigeverlust + Teilrückerstattung | P1 | M | WunderFenster existiert schon — die *Regeln* drumherum fehlen |
| INF-3 | **Bau-Queue mit Sichtbarkeit** (Civ 6 FIFO + Vic3-Zweiteilung): öffentliche Reihenfolge, „was verdränge ich, wenn ich das vorziehe?" — Vorziehen kostet Verwaltungskraft extra | P0 | S–M | Direkte Antwort auf „keine Härte/kein Preis" aus der Spielbarkeitsanalyse |
| INF-4 | **Freie Großprojekt-Eingabe** (Entscheidung Block I, GRO-01/02): Spieler tippen („Autobahn bis China"), Pipeline schätzt über 3-Ebenen-Modell (Gravitation −0,8…−1,1, Kostenüberschreitung Schiene 45 %/Straße 20 %, Verkehrsillusion 25–60 %), Mentorin erklärt Bandbreite, Bagdadbahn-Logik für Grenzübertritte | P1 | L | Alleinstellungsmerkmal, Parameterbasis liegt fertig in PLANERWEITERUNG vor |
| INF-5 | **Katastrophen-Modul** (Entscheidung Block D): Erdbeben als Risiko-Layer über Provinzen (53.537 Tote 2023 als Anker), AFAD-Bereitschaft als Größe, Versprechensschuld-Mechanik (319.000 vs. 201.431 Wohnungen als Mahnung im Spiel) | P1 | M | Realistisch, moralisch ernst, einzigartig im Genre |
| INF-6 | Lens-System formalisieren: die 11 Ebenen sind de facto Lenses — ergänze **Platzierungs-Lens** (Civ 6: „wo baue ich was?") mit Adjacency-Hinweisen für Infrastrukturketten | P2 | M | UI-Übernahme, vertieft Regionale-Entscheidungen |

### 3.5 Innenpolitik

**Stand**: Herzstück (~80 %). Politiknetz 103 Maßnahmen / 100 Größen / 15 Probleme / 412 Kanten mit Verzögerungen und Begründungen, je Provinz gerechnet, Hysterese; benannte Skalen (Regime statt Prozent); Ampeln + „was bringt am meisten"-Vorschläge; 11 Wählergruppen mit Ursachenketten; Modernisierungsleitern; 10 Minister-Ämter mit monatlicher Wirkung; 8 Regierungsprogramme (36 Schritte) als Fokusbaum-Analog; 68 Ereignisvorlagen; Wahl dreiteilig (Wahlkampf kompakt, TV-Duell, Wahlabend).

**Referenzvergleich**:
- Democracy 4: **Kantenformel** (`Ziel, f(x), Inertia`) mit CSV-Datenhaltung — hier sind Gewichte flache Konstanten; D4s **Implementierungs-Delay + Ghost-Slider** („Zeige, wo der Regler hinlaufen wird") fehlt; **Event-Wettbewerb alle 3 Runden** mit Grudge-Decay fehlt.
- HOI4: **Fokusbaum** — die Programme sind das Analog, aber ohne Sichtbarkeit des Baums; **National Spirits** fehlen (s. MIL-3).
- Civ 6: **Grievance-Konten** (`10−x`/Runde) — Gruppen-Groll ist nur ein Skalar pro Figur.
- Suzerain: Wahlkampf als Ereigniskette mit Versprechen — hier nur kompakt.

**Vorschläge**:

| # | Vorhaben | P | Aufwand | Begründung |
|---|---|---|---|---|
| INN-1 | **Kantenformel statt Flachgewichte** (D4-Kern): nichtlineare Antworten (Sättigung, Schwellen) pro Kante, Inertia je Größe; Datenhaltung in maschinenlesbarer Form (CSV/JSON-Tabelle) mit Begründungspflicht je Kante — das existiert schon als Text, fehlt als Struktur | P0 | L | Sofort-Übernahme Nr. 1 der Mechanik-Recherche; Voraussetzung für ehrliche Kalibrierung (WIR-1) |
| INN-2 | **Implementierungsbalken + Ghost-Slider** (D4): Maßnahmen zeigen Fortschritt 0→100 % über Umsetzungsdauer (Mindestlohn 1 Monat, Schulbau 24, Bahn 48); Vorschau zeigt Zielstand gestrichelt | P0 | M | Steht in der Sofort-Liste; behebt „keine Verzögerung fühlbar" — die Absicht/Beschluss/Wirkung-Bildsprache (gestrichelt/durchgezogen) ist dafür schon designt |
| INN-3 | **Wählergruppen-Inkonsistenz bereinigen**: Dokumente sagen 7 / 8 / 11, Code hat 11. Entscheidung dokumentieren: 11 bleibt (Code-Stand), INNENPOLITIK.md und ENTSCHEIDUNGEN-Block-L-Zahlen angleichen | P0 | S | Inkonsistenz verwirrt jede weitere Arbeit |
| INN-4 | **National Spirits / Dauerzustände** (HOI4): sichtbare Zustandsbanner („Lira-Vertrauen erschüttert", „Justiz im Umbau") mit Effekten und erwarteter Restdauer | P1 | M | Feedback-Schicht; macht Folgen von Beschlüssen langlebig sichtbar |
| INN-5 | **Wahlkampf als Handlungsphase** (Suzerain): 6–8 Wochen vor Wahl mit Reisehandlungen (Provinz besuchen = Ortsbezug!), Versprechen mit Zusagen-System, TV-Duell mit Vorbereitungskosten; Manipulations-Stufenleiter wie designt | P1 | M–L | „Wahlkampf kompakt" ist die derzeit dünnste Stelle des Wahlzyklus; Reisen nutzt die Provinz-Daten endlich spielerisch |
| INN-6 | **Oppositions-Modul**: Oppositionsführer als Figur (PERSONEN-System recyceln), Gegenprogramme, wirksame Angriffe abhängig von echten Schwachstellen (Probleme rot → Angriff trifft) | P2 | M | Erhöht Härte ohne neue Systeme |
| INN-7 | **Partei-Innenleben light**: Parteitag alle 2 Jahre, Flügel fordern Politik, Unzufriedenheit kann Fraktionsstimmen kosten | P2 | M | Im Design offen; erst nach INN-1 sinnvoll kalibrierbar |

### 3.6 Außenpolitik, Verhandlungstisch, Mediation

**Stand**: 17 Länder + EU mit 4 Dimensionen und Anliegen; Verhandlungstisch mit 54 Klauseln, 18 Länderprofilen, Roten Linien, Bewertungsformel, Gegenangeboten, Laufzeiten, jährlicher Prüfung, Vertragsbruch mit Erinnerung, Ausstrahlung auf Dritte; **Vermittlung zwischen Drittstaaten implementiert — Alleinstellung**; 14 Auslandsereignisse; Welt-Kartenebene nach Beziehung gefärbt.

**Referenzvergleich**:
- Victoria 3: Klauselpaket-Bewertung — hier bereits übernommen und verfeinert (Gegenseitigkeit, Erinnerung).
- CK3: Annahme-Faktorenliste sichtbar — hier teils sichtbar, könnte vollständig aufgeklappt werden.
- Civ 6: Grün/Rot-Gründe in der Diplomatie-UI („warum lehnt er ab?") — hier im Detail ausbaufähig.
- Cicero (Science 2022) als Blaupause für KI-Verhandlungsdialoge — noch ungenutzt.

**Vorschläge**:

| # | Vorhaben | P | Aufwand | Begründung |
|---|---|---|---|---|
| AUS-1 | **Länder-Eigeninitiative**: Länder kommen von sich aus mit Forderungen/Angeboten (4 generische Vorlagen existieren bereits als Ereignisse — daraus echte Verhandlungseröffnungen am Tisch machen); sture Regierungen mit 5 Wegen wie designt | P1 | M | Im Design als Lücke markiert; macht die Welt lebendig statt reaktiv |
| AUS-2 | **EU-Beitrittsprozess als mehrjähriger Vorgang**: Kapitel (35), Eröffnung/Schließung mit Bedingungen (Justiz, Medien, Zypern-Konflikt-Verknüpfung), Fortschrittsbericht jährlich, „Alibikapitel"-Erkennung | P1 | M–L | Größtes verschenktes Langzeitziel; reine Anliegen-Maßnahme ist zu flach für die Türkei-Bühne |
| AUS-3 | **KI am Verhandlungstisch** (s. KI-2): Gegenangebote und Rote-Linie-Begründungen als KI-Text über vorhandene Anbieter-Infrastruktur, Fallback = regelbasiert | P1 | M | Cicero-Blaupause liegt in der Recherche; hebt die stärkste Mechanik auf Suzerain-Niveau |
| AUS-4 | **Mediation ausbauen**: ZOPA-Anzeige für den Vermittler, ripeness-Bewertung, Spoiler-Ereignisse, Garantie-Optionen mit eigenen Kosten; Kalibrierung Istanbul 2022/Getreideabkommen als Testfall | P1 | M | Alleinstellung — hier lohnt Vertiefung am meisten; Design (ZOPA/ripeness/Spoiler) liegt fertig vor |
| AUS-5 | **NATO/UN-Verfahren** skizziert → konkret: Bündnisrat-Abstimmungen als Mini-Verhandlung, Beistandsklausel-Ereignis; UN-Resolutionen als Ausstrahlungs-Mechanik | P2 | M | Zurückgestellt laut Plan — bewusst P2 |
| AUS-6 | **Vertrags-Exklusivitäten** (Suzerain): bestimmte Klauseln schließen einander aus (S-400 vs. F-35 ist schon als `sperre` gebaut — auf alle Verträge verallgemeinern) | P1 | S | Muster existiert im Code, Verallgemeinerung ist billig |

### 3.7 Personen und Gespräche

**Stand**: 10 Ämter mit Profil (Stil, Fähigkeit, Ehrgeiz, Groll, Lager), Leistung = 60 % Fähigkeit + 40 % Loyalität, 7 Gesprächsansätze komplett regelbasiert (821 Zeilen), Zusagen-System mit Kipppunkten (40/80), Nachfolge-Archetypen, Rücktritt < 12 Loyalität, Personenereignisse (Skandal, Intrige, Leck). Keine KI-Texte, keine verdeckten Beziehungswerte.

**Referenzvergleich**:
- Suzerain: 450.000 Wörter, Figuren mit Privatleben, verdeckte Gunst, Gefallen-Ökonomie — hier liegt der größte narrative Abstand.
- Democracy 4: Minister 3 Rollen, „jaded"-Loyalität, Reshuffle-Mechanik mit Preis.
- CK3: Haken, 5-Jahres-Abklingzeit, Faktorenlisten.

**Vorschläge**:

| # | Vorhaben | P | Aufwand | Begründung |
|---|---|---|---|---|
| PER-1 | **KI-Gespräche mit Figuren** (Teil von KI-2): Gesprächsmodul bleibt mechanisch führend (Ansätze, Konsequenzen, Abkühlung), aber Antworttexte kommen vom Sprachmodell mit Figuren-Seele (Ziel, Schwäche, Stimme, Erinnerung) im Prompt; Fallback = heutige Bausteine | P1 | M | Der Unterschied zwischen „mechanisch" und „lebendig" — Suzerain-Feeling ohne 450.000 Wörter zu schreiben |
| PER-2 | **Verdeckte Gunst** (Suzerain, auf der Übernahmeliste): zusätzlich zur sichtbaren Loyalität eine verborgene Beziehungsstatistik, die Leaks/Intrigen/Aussagen von Ehemaligen steuert; Mentorin kann Andeutungen machen | P1 | M | Erzeugt Misstrauen im Umfeld — Kern der Präsidenten-Fantasie |
| PER-3 | **Minister-Reshuffle mit Preis** (D4): Umbildung kostet Kapital + Groll der Entlassenen + Märkte-Reaktion (Finanzen +30 Risikoaufschlag existiert schon) — fehlt: „jaded"-Effekt (wiedereingesetzte Minister tragen Groll dauerhaft) | P0 | S | Sofort-Übernahme, eine Zeile Design, kleiner Eingriff in `nachfolge.ts`/`personen.ts` |
| PER-4 | **Mentorinnen 2 und 3** benennen und profilieren (Design: 2–3 neutrale Figuren, bisher nur Defne Arslan konkret) | P1 | S | Lernkonzept hängt daran |
| PER-5 | **Privatleben** (Entscheidung Block E, Suzerain-Vorbild): Familie/Gesundheit/Freunde als Ereignisquelle und Ressourcenkonkurrenz (Zeit!), kein separates System | P2 | M | Zurückgestellt im Plan; Tiefe fürs Endgame |
| PER-6 | Figurenliste für S1 vervollständigen (>20 Hauptfiguren designt, 10 implementiert) | P1 | S–M | Designblock E verlangt schrittweise Einführung — die restlichen 10 ausarbeiten |

### 3.8 Zeit, Spielfluss, Agenda, Härte

**Stand**: Tagesschritte, 5 Geschwindigkeiten, Auto-Stopps, Amtszeit 5 Jahre + Wiederwahl, Sturz nach 6 Monaten < 25 %, Politisches Kapital mit Überziehung, 10 Amtsziele, Fortschrittsbilanz/Geschichtsbuch, 3 Schwierigkeiten, Prolog, Speichern, Staatskalender. Agenda-System mit 8 Antwortklassen designt (Block I), Schreibtisch-Tagesbriefing implementiert (537 Zeilen).

**Referenzvergleich**:
- Suzerain: 12 Turns à 4 Monate zwingen zu Prioritäten — hier ist die Zeit reichlich; Härte muss aus Engpässen kommen, nicht aus Rundenknappheit.
- D4: Event-Wettbewerb (>70 %-Konkurrenz alle 3 Runden) verhindert Event-Flut — hier gibt es Dichte-Dämpfung (>6/Jahr), aber keinen Qualitätswettbewerb.

**Vorschläge**:

| # | Vorhaben | P | Aufwand | Begründung |
|---|---|---|---|---|
| ZEI-1 | **Ereignis-Wettbewerb** (D4): pro Monat konkurrieren ausgelöste Ereignisse um maximal 2–3 Slots nach Dringlichkeit; der Rest prallt ab oder eskaliert still (mit Haken in der Chronik, damit es nachvollziehbar bleibt) | P0 | S | Verhindert Popup-Müdigkeit; Sofort-Übernahme |
| ZEI-2 | **Agenda-Empfehlungen an den Schreibtisch** (Entscheidung Block I): die 8 Antwortklassen sind designt — das Tagesbriefing soll Agenda-Fortschritt als eine seiner 5 Ratschläge führen („Agenda 1 verlangt…") | P1 | M | Alleinstellung; Briefing-Infrastruktur existiert |
| ZEI-3 | **Sitzungsbogen prüfen**: Designziel 30–60 Min pro Sitzung — mit Auto-Stopps messen (Telemetrie nur lokal/dev), Ziel: ≥ 3 bedeutungsvolle Entscheidungen pro Sitzung | P1 | S | Spielspaß-Tor endlich messbar machen |
| ZEI-4 | **„Alles auf 100"-Test als Dauertest**: die Spielbarkeitsanalyse fand Degeneration (Preiskontrollen +16,9 Vertrauen); solche Extrem-Eingaben als Regressionstests festschreiben, die fehlschlagen müssen (d. h. Vertrauen darf NICHT monoton steigen) | P0 | S | Verankert Härte dauerhaft in der Test-Suite |
| ZEI-5 | Schwierigkeitsgrade schärfen: aktuell 3 Stellschrauben — ergänzen um Oppositionsstärke (designt: Bot-Messung 8/7/2) und Startkapital, als sichtbare Pakete „Entspannt/Normal/Hart" | P2 | S | Designt, nicht verdrahtet |

### 3.9 Karte, Grafik, UI, Präsentation

**Stand**: Three.js-Karte mit Relief-Tiles, 81 Provinzen + Bezirke beim Zoomen, 11 Ebenen, Kamerafahrten, Atlas-Typografie; komplettes Fenstersystem (Schreibtisch als Heimat); Art-Direction (EB Garamond/Fraunces/Inter/Caveat, Cameos, Ornamente); Wunder-Bilder; `kunst.html` als Art-Arbeitsplatz.

**Referenzvergleich**:
- Suzerain: **Zeitung als Soft-Dashboard** — die eleganteste Feedback-Form des Genres; hier fehlt sie (Chronik ist nüchtern).
- HOI4: **drei-Schichten-UI mit kausalen Tooltips** — teilweise vorhanden (Treiber-Zerlegung), nicht flächendeckend.
- Civ 6: Wunderfilm, Lens-System; D4: PC-Ringsegmente, Wirkungslinien (Pfeilgeschwindigkeit = Stärke).
- Suzerain-Warnung: 2.0-UI-Debakel (Mobile-Optik am PC) — hier kein Risiko, aber die Blackbox-Kritik (Trial-and-Error) gilt: „Jede Zahl beantwortet Warum" muss überall eingelöst sein.

**Vorschläge**:

| # | Vorhaben | P | Aufwand | Begründung |
|---|---|---|---|---|
| UI-1 | **Die Zeitung** (Suzerain-Übernahme, auf der Sofort-Liste): monatlich oder nach Großereignissen eine Frontseite, die Weltzustand in-character spiegelt (Regierungsblatt vs. Oppositionsblatt — Medien-System REC-4 dockt hier an); später optional KI-geschrieben | P1 | M | Feedback-Schicht, die aus Zahlen eine Welt macht; höchster Atmosphäre-Gewinn pro Aufwand |
| UI-2 | **Kausale Tooltips flächendeckend** (HOI4): jede Zahl in jedem Fenster zeigt Top-3-Treffer aus der Treiber-Zerlegung; wo Zerlegung fehlt, ist das ein Bug-Kandidat | P1 | M | Löst die Blackbox-Kritik vorab; Infrastruktur (Treiber-Zerlegung) existiert schon |
| UI-3 | **In-Character-Labels** (auf der Sofort-Liste): interne Größen bekommen Sprache („angespannt", „brodelnd") statt 0–100 im Spieler-UI; Zahlen bleiben über Tooltip/Mentorin abrufbar | P2 | M | Immersion; bewusst nicht P0, weil es Kalibrierung erschwert, solange Zahlen im Fluss |
| UI-4 | **Wirkungslinien im Netz** (D4): Pfeilstärke/-geschwindigkeit nach Kantengewicht animieren, Filter je Themenfeld | P2 | M | Netzansicht ist Alleinstellung, verdient Politur |
| UI-5 | **Fertigstellungs-Sequenzen** (Civ 6 Wunderfilm → s. INF-2) und Amtszeit-Rückblick als kurze Montage aus echten Partiedaten (Bilanz existiert — inszenieren) | P2 | M | Emotionale Bezahlung |
| UI-6 | Audio: Ton/Musik (Nachtarbeit-Rest) — dezente Stimmen, Zeitungsblättern, Kartenrauschen; Musik erst nach Stilfestlegung | P2 | M–L | Komplett offen; bewusst spät, weil Stilfrage |

### 3.10 KI-Integration (Querschnitt)

**Stand**: 9 Anbieter, 3 Verbindungswege, gehärtete Vite-Middleware, strenges JSON-Aktionsprotokoll, Tokenzähler, vollwertiger regelbasierter Fallback (`befehle.ts`, 886 Zeilen), 29 KI-Tests. **Aber: nur der Präsidialamt-Chat nutzt KI.**

**Vorschläge**:

| # | Vorhaben | P | Aufwand | Begründung |
|---|---|---|---|---|
| KI-1 | **Kostenbudget-Wächter**: Kostenziel < 0,30 USD/Sitzung (Designvorgabe) als konfigurierbares Budget mit Warnschwelle; Tokenzähler existiert — fehlt: Budget-Logik und Anbieter-Kostentabelle | P1 | S | Designvorgabe, sonst ungebremst |
| KI-2 | **KI an drei weitere Orte** (in dieser Reihenfolge): (a) Figuren-Gespräche (PER-1), (b) Verhandlungstisch-Dialoge (AUS-3), (c) Zeitungstexte (UI-1). Alle drei: Regelwerk bleibt führend, KI schreibt nur Text innerhalb vorgegebener Fakten; Fallback immer regelbasiert | P1 | je M | Verwandelt das Spiel, ohne die deterministische Simulation anzufassen; Anbieter-Infrastruktur ist schon gebaut |
| KI-3 | **Sprachmodell für freie Großprojekte** (KI-00/GRO-02): freie Eingabe → strukturierte Schätzung → 3-Ebenen-Wirkungsmodell | P1 | M–L | Voraussetzung für INF-4 |
| KI-4 | Streaming-Antworten im Chat und lange Antworten abschnittsweise | P2 | S | Komfort |
| KI-5 | Lokaler Standard: llama.cpp/Ollama als empfohlener Offline-Pfad prominent dokumentieren (existiert technisch schon) | P2 | S | Kostenziel + Datenschutz-Argument |

---

## 4. Roadmap — Verzahnung in vier Stufen

Die Stufen bauen aufeinander auf; innerhalb einer Stufe ist die Reihenfolge frei. Jede Stufe endet mit einem spielbaren Stand und einem Langpartie-Test.

### Stufe A — Härte und ehrliche Zahlen (P0-Block)

Ziel: Das Spiel *widersteht* dem Spieler. Ohne diese Stufe ist alles Weitere Dekoration.

1. INN-1 Kantenformel + Datenhaltung (Voraussetzung für echte Kalibrierung)
2. WIR-1 Kalibrierung an 2019/2021/2023 (größter Einzelposten; parallelisierbar mit 3.–7.)
3. ZEI-4 „Alles auf 100"-Regressionstests (Härte dauerhaft festschreiben)
4. MIL-3 Krisen-Blocker (National-Spirits-Light)
5. INN-2 Implementierungsbalken + Ghost-Slider
6. INF-3 Bau-Queue mit Verdrängungspreis
7. INF-1 Bauvergabe mit 3 Optionen
8. PER-3 Reshuffle-„jaded"-Effekt
9. ZEI-1 Ereignis-Wettbewerb
10. INN-3 Wählergruppen-Inkonsistenz bereinigen (S, sofort)

**Tor A**: Langpartie-Test zeigt — eine passive Amtszeit endet in Krise oder Sturz; „alle Regler auf Maximum" ruiniert die Wirtschaft; die drei Lernfälle verlaufen qualitativ richtig.

### Stufe B — Die Welt wird lebendig (P1-Block 1)

1. MIL-1 Krieg als Vorgang (der größte Brocken; früh anfangen, in Scheiben: erst Eskalationsleiter + Beschluss, dann Verlauf, dann Frieden)
2. AUS-1 Länder-Eigeninitiative
3. UI-1 Die Zeitung (Fallback regelbasiert geschrieben)
4. KI-2a Figuren-Gespräche mit KI-Text
5. WIR-2 Außenwirtschaft minimal
6. WIR-3 Haushalts-Zyklus Oktober
7. REC-1 Verfassungsreform als Vorgang (kann nach Stufe C wandern, wenn MIL-1 länger dauert)

**Tor B**: Eine normale Partie erzeugt pro Sitzung mindestens eine Situation, die es so noch nie gab (Kombination aus Eigeninitiative, Zeitung, Gespräch).

### Stufe C — Die Alleinstellungen ausbauen (P1-Block 2)

1. AUS-4 Mediation vertiefen (ZOPA, Spoiler, Garantien)
2. INF-4 + KI-3 Freie Großprojekt-Eingabe
3. KI-2b KI am Verhandlungstisch
4. INN-5 Wahlkampf als Handlungsphase
5. AUS-2 EU-Beitrittsprozess
6. INF-5 Katastrophen-Modul
7. PER-2 Verdeckte Gunst; PER-6 restliche Figuren
8. ZEI-2 Agenda im Tagesbriefing
9. WIR-4 Kapital-Zweispaltung; INN-4 National Spirits sichtbar

**Tor C**: Die vier Alleinstellungen (freie Sprache, Agenda, freie Großprojekte, Mediation) sind jeweils einmal pro Partie erlebbar.

### Stufe D — Politur vor Veröffentlichung (P2-Auswahl)

Aus dem P2-Pool (MIL-4/5/6, WIR-5/6, REC-2/4, INF-6, INN-6/7, AUS-5/6, PER-5, UI-3/4/5/6, KI-4/5, ZEI-5) nach zwei Kriterien auswählen: (a) was Tester am häufigsten vermissen, (b) was die Kalibrierung nicht erneut destabilisiert. Dazu gehören die ausstehenden Spielspaß-Referenzen (CK3, Frostpunk, Papers Please, Football Manager) als Recherche-Nachtrag, bevor P2 festgezurrt wird.

---

## 5. Was dieser Plan bewusst NICHT ändert

- **Keine Taktik-Kämpfe, kein Einheiten-Designer, keine Score-Auktion, keine Echtzeit-Pflicht, kein Mobile-First, keine Einzelbürger-Simulation, kein Mehrspieler** — Negativliste der Recherche und ENTSCHEIDUNGEN bleiben maßgeblich.
- **Der Präsident kommandiert nicht** — MIL-1 baut Krieg als *politischen* Vorgang, nicht als Schlachten-Spiel.
- **Regelwerk bleibt führend, KI schreibt Text** — die deterministische Simulation bleibt die Wahrheit; KI-Ausgaben gehen weiter nur über die geprüften Aktionsfunktionen.
- **Kommunalpolitik als eigene Ebene bleibt ausgeschlossen** (bewusste Design-Entscheidung); Kommunalwahlen bleiben kompakt.
- **Reihenfolge-Grundsatz**: Kalibrierung (Stufe A) vor neuen Systemen dort, wo neue Systeme alte Zahlen verwerfen würden. Ausnahmen: INF-1/INF-3 (Interaktions-Härte, keine Zahlen), MIL-3 (Krisen-Logik, kalibrierungsarm).

---

## 6. Dokumenten-Hygiene (sofort, je S)

Gefundene Inkonsistenzen, die vor Weiterarbeit zu schließen sind:

1. **Wählergruppen**: 7 (INNENPOLITIK) vs. 8 (ENTSCHEIDUNGEN Block L) vs. 11 (POLITIKNETZ + Code) → auf 11 festlegen, Dokumente angleichen (= INN-3).
2. **Länderzahl**: 12 (Block L) vs. 18 Länderprofile (Verhandlungstisch) vs. 17 Länder + EU (Code) → Zählweise klären (EU als Partner ja/nein), einheitlich schreiben.
3. **Netz-Größe**: 199 Knoten (ältere Texte) vs. 236 Knoten/871 Kanten (POLITIKNETZ 30.09.) vs. 203 Knoten/412 Kanten (Code: 103 Maßnahmen + 100 Größen) → die beiden Zählweisen (Knoten inkl. Probleme/Gruppen vs. nur Netz-Knoten) im Dokument erklären.
4. **Mehrheit 301/600** als gewollte Vereinfachung ausdrücklich an allen Stellen kennzeichnen (tatsächlich 301 = einfache Mehrheit; Referendums-Hürde 360 kommt mit REC-1).
5. **PLANERWEITERUNG-P0 (Anwalt/Steam/Preis) vs. Entscheidung J (Spielbarkeit zuerst)** — Widerspruch ist dokumentiert, aber unaufgelöst; Empfehlung: Entscheidung J bestätigt sich, Vorlaufspur bleibt Vorlauf (kein Code), P0 des Plans hier ersetzt die kommerziellen P0 bis Tor B.
6. Szenario-Nummerierung S1–S19 mit Lücke (S16–S18) bereinigen.

---

## 7. Kalibrierungs- und Teststrategie (Querschnitt)

1. **Drei Lernfälle als Szenario-Tests** (WIR-1): 2019, 2021, 2023 als Startzustände mit bekanntem Verlauf; Akzeptanzkriterium = Richtung und Größenordnung der 14 Kerngrößen, dokumentierte Abweichungen.
2. **Degenerations-Tests** (ZEI-4): passive Partie, Maximal-Partie, Zufalls-Partie — alle müssen *nicht*-trivial enden.
3. **E2E ausbauen**: `test:e2e`-Skript in package.json; das vorhandene Playwright-Skript (86 Zeilen) um Parlament, Verhandlungstisch und eine volle Legislatur im Schnelllauf erweitern.
4. **Balance-Dashboard** (dev-only): Langpartie-Test schreibt Zeitreihen der 14 Kerngrößen + Vertrauen + Kapital als CSV; visuelle Prüfung statt „Tests prüfen nur, dass es läuft".
5. **Echte Spieler** (aus Nachtarbeit-Resten): frühestens nach Tor B; vorher Kalibrierung an Lernfällen, danach an Menschen.

---

## 8. Erfolgsmessung des Plans

- **Tor A bestanden**: passive Partie scheitert; Maximal-Partie ruiniert; Lernfälle qualitativ richtig.
- **Tor B bestanden**: ≥ 3 bedeutungsvolle Entscheidungen pro 30-Minuten-Sitzung (gemessen über dev-Telemetrie, ZEI-3).
- **Tor C bestanden**: vier Alleinstellungen je einmal pro Partie erlebbar; Lern-Tor ≥ 60 % (Lernkonzept) in einer kleinen Testrunde.
- **Dauerhaft**: „Jede Zahl beantwortet Warum?" ohne Ausnahme; keine Popup-Flut (Ereignis-Wettbewerb); keine Regressionswarnung aus ZEI-4-Tests.

*Ende des Plans. Quellen: DESIGN_BESTANDSAUFNAHME.md (analyse/), AUSWERTUNG_RECHERCHEBESTAND.md, Code-Bestandsaufnahme game/ vom 30.09.2026.*
