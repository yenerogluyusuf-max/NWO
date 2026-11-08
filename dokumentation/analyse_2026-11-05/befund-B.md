# Befund B: Politik, Parlament, Gesetze, Verfassung, Justiz

Prüfer B, 5. November 2026. Maßstab: `AUFTRAG.md`. Grundlage:
- Rundgangsbilder 003 bis 011 (`rundgang/`).
- Eigene Bilder und Textauszüge, kopflos mit Playwright gegen `http://localhost:5173/?schnellstart`, in `/private/tmp/claude-501/-Users-yusufyeneroglu/904f44f4-7b5f-44c2-9447-c69e44ab880b/scratchpad/analyse-B/`:
  - `recht0–3.png`: Bereich Recht und Justiz
  - `mindestlohn_tafel.png`, `mwst.png`, `notstand.png`: Regler geöffnet
  - `notstand_netz0–3.png`: Maßnahmenblatt
  - `fraktionen0–4.png`, `verfassung0–2.png`, `justiz0–2.png`, `justizref0–2.png`, `umsetzung0–1.png`, `nachabst.png`
- Ausgezogene Daten: `ms2.txt` (alle 117 Maßnahmen mit allen 609 ausgehenden Kanten) und `tabelle.md`.
- Code unter `game/src` vollständig gelesen, soweit unten zitiert.

Hinweis zum Schnellstart: Er würfelt das Parlament neu aus. Im Rundgang hatte das Lager 347 Sitze, in meinen Läufen 328 und 319. Die Zahlen in den Bildern weichen deshalb voneinander ab.

## Kurzurteil

Der Bereich hat drei echte Stärken, die bleiben sollen:
- das Halbrund mit 600 Sitzen,
- die Verfassungswerkstatt mit Waage und Ja-Delta am Knopf,
- die Maßnahmenzeile, die Fassung, Kapital, Mehrheit, Dauer und Haushalt in einem Feld zeigt.

Er bricht aber an drei Stellen den eigenen Maßstab:

1. **Die Regler sprechen keine echte Sprache.** 81 von 117 Maßnahmen zeigen „NN % des Ausgangs“. Die drei echten Sätze laufen in unsinnigen Schritten, etwa Mehrwertsteuer 17 % oder 23 % und Spitzensatz bis 80 %. Auf derselben Seite stehen drei Einheiten nebeneinander: Prozent des Ausgangs, „Index 0–100“ und „Stufe 50“.
2. **Der Weg zum Gesetz ist kein Spiel.** Er ist auch nicht das türkische Verfahren. Eine Idee wird mit einem Klick zum Entwurf, dann wartet man 21 Tage und kauft Stimmen anonym für 0,5 Kapital das Stück. Ausschuss, Rückgabe durch den Präsidenten, Sammelgesetz und Abweichler mit Namen fehlen. Die Erlassregel ist an mehreren Stellen genau falsch herum.
3. **Dasselbe steht an vielen Orten.** Das gilt für Zahlen, Wirkungen und ganze Gesetzeslisten. Es gibt fünf verschiedene Gesetzgebungsmechaniken (Maßnahme, Versorgungsvorlage, Haushalt, Verfassung, Justizvorhaben). Rund 1.900 Zeilen fertig recherchierter Gesetzesbausteine mit Klauseln liegen ungenutzt im Code.

---

## 1. Ansichten

Noten von 1 (sehr gut) bis 5, in dieser Reihenfolge: Möglichkeiten · Logik · Erklärung · Bild/Artwork · Schrift · Gestaltung · Sprache · Spielgefühl.

**Politik › Bereiche › Überblick (Bild 003)**
- **Frage:** Wo brennt es, und wo muss ich hin?
- **Antwort:** teilweise. Die 15 Kreise mit Ampelring und roter Zahl zeigen, wo es brennt, aber nicht warum.
- **Länge:** 1,04 Bildschirme.
- **Noten:** 3 · 3 · 3 · 2 · 2 · 3 · 2 · 3
- **Urteil:** Ein schönes, ruhiges Bild nach Democracy 4. Zwei Dinge verwässern die eine Antwort: Die Leiste links wiederholt dieselben 15 Bereiche mit denselben Zahlen, und oben stehen vier Zähler mit drei Ampelwörtern („angespannt“, „Achtung“, „ruhig“) plus „akute Probleme“.

**Politik › Bereich mit Maßnahmentafel (eigene Bilder `recht0–3`, `mindestlohn_tafel`)**
- **Frage:** Wie steht der Bereich, was kann ich stellen, und was kostet es?
- **Antwort:** teilweise. Die Lage erscheint als Indexbalken. Die Regler sind übersichtlich, Preis und Wirkung stehen aber erst nach dem Klick da.
- **Länge:** etwa 2,5 Bildschirme (geschätzt aus vier Bildschirmaufnahmen).
- **Noten:** 2 · 3 · 3 · 3 · 2 · 2 · 3 · 2
- **Urteil:** Das ist der beste Ort zum Regieren: eine Zeile je Maßnahme, darunter Fassungsknöpfe, Kapital, Mehrheit, Dauer, Haushalt und wer dafür oder dagegen ist. Verdorben wird er durch „100 % des Ausgangs“ und dadurch, dass die eigene Partei unter „Dagegen“ steht.

**Politik › Vorschläge (Bild 004)**
- **Frage:** Was sollte ich jetzt tun?
- **Antwort:** ja, als Rangliste mit Gesicht.
- **Länge:** 1,6 Bildschirme.
- **Noten:** 2 · 3 · 3 · 2 · 2 · 2 · 3 · 2
- **Urteil:** Suzerain-artige Ministerkarten sind der richtige Weg. Aber alle vier Karten stammen von Erkan Özer, alle mit „Loyalität 60“. Karte 2 empfiehlt „Warten“, ohne den Grund zu nennen. Die Empfehlungen lauten „Industrieller Wohnungsbau: ausbauen: von 100 % des Ausgangs auf 180 % des Ausgangs“.

**Politik › Maßnahmenblatt / Wirkungsnetz (Bild 005, eigene Bilder `notstand_netz0–2`)**
- **Frage:** Was bewirkt diese Maßnahme, und wie beschließe ich sie?
- **Antwort:** teilweise. Der Graph aus Ursachen und Wirkungen mit dem Siegel „Beschluss der Regierung“ ist gut. Dieselben Wirkungen stehen aber noch zweimal als Liste da.
- **Länge:** 3,15 Bildschirme.
- **Noten:** 2 · 3 · 3 · 2 · 3 · 4 · 3 · 3
- **Urteil:** Inhaltlich das reichste Blatt. Es ist aber dreimal zu lang. Im Kopf stehen drei Einheiten, die Mentorin sagt bei jeder Maßnahme denselben Absatz, und der Name „Notstandsdek rete“ bricht ohne Trennstrich um.

**Parlament › Tagesordnung (Bild 006)**
- **Frage:** Was wird wann abgestimmt, und reicht es?
- **Antwort:** leer nein (nur ein Satz und ein Knopf). Mit Vorlage teilweise: ein Balken je Vorlage.
- **Länge:** 1 Bildschirm, davon zwei Drittel leer.
- **Noten:** 4 · 3 · 3 · 5 · 3 · 4 · 3 · 4
- **Urteil:** Wie ein Formular. Die Zeilen wiederholen die Gesetzesliste im Reiter „Fraktionen und Abstimmung“ samt denselben Knöpfen.

**Parlament › Fraktionen und Abstimmung (Bild 007, eigene Bilder `fraktionen0–4`)**
- **Frage:** Habe ich eine Mehrheit, und wie bekomme ich eine?
- **Antwort:** ja, das Halbrund mit 301er-Marke beantwortet sie.
- **Länge:** 3,0 Bildschirme.
- **Noten:** 2 · 3 · 3 · 1 · 2 · 4 · 3 · 3
- **Urteil:** Das Halbrund ist das stärkste Bild des Bereichs. Darunter folgt eine lange Wand aus Verhandlungskarten, die unterschiedlich hoch sind und große weiße Flächen lassen. Dieselbe Mehrheitszahl steht fünfmal da.

**Parlament › Umsetzung (Bild 008, eigenes Bild `nachabst.png`)**
- **Frage:** Was habe ich beschlossen, und wirkt es schon?
- **Antwort:** nein. Am Start stehen nur Nullen, und der Zähler zählt Falsches.
- **Länge:** 1,14 Bildschirme.
- **Noten:** 4 · 4 · 2 · 4 · 3 · 3 · 3 · 4
- **Urteil:** Die Idee „Beschluss ist noch keine Wirkung“ ist richtig und gut erklärt. Gezählt werden aber eingebrachte Entwürfe und „Ziele der Amtszeit: keine.“, und der Zähler sagt „1 Beschlüsse“.

**Parlament › Verfassung (Bild 009, eigene Bilder `verfassung0–2`)**
- **Frage:** Welche Verfassungsänderung bekomme ich durch, und was kostet sie?
- **Antwort:** ja. Die Waage zwischen Parlament und Palast, das Halbrund des Pakets und das Ja-Delta an jedem Knopf beantworten sie.
- **Länge:** 1,83 Bildschirme.
- **Noten:** 2 · 3 · 2 · 1 · 2 · 2 · 3 · 1
- **Urteil:** Das gelungenste Spielstück des Bereichs: ein Entwurf auf Papier mit Artikelnummern am Rand und eine Wahl wie mit dem Marker gesetzt. Schwächen sind „−22 Ja“ ohne Erklärung, die Variante „Vorgezogene Neuwahl“ (sie ist keine Verfassungsänderung) und Variantennamen, die nicht übersetzt werden.

**Parlament › Justiz (Bild 010, eigene Bilder `justiz0–2`, `justizref0–2`)**
- **Frage:** Wie unabhängig und leistungsfähig ist die Justiz, und was kann ich tun?
- **Antwort:** teilweise. Acht Indexbalken stehen da, die Besetzung der Gerichte ist als Punktreihe gut zu sehen.
- **Länge:** 2,0 Bildschirme.
- **Noten:** 3 · 3 · 2 · 2 · 2 · 3 · 2 · 3
- **Urteil:** Die echten, belegten Zahlen sind gut (17 Richter je 100.000 Einwohner, 228 Tage Verfahrensdauer, 142 % Belegung). Aber die Lage steht identisch in der Politik, und die Hebel liegen an vier Orten: Maßnahmen, Vorhaben, Verfassungsartikel und Richterrat.

**Parlament › Mehrheitslage (Bild 011)**
- **Frage:** Wie sicher ist meine Mehrheit?
- **Antwort:** nein. Gezeigt wird „Lage: angespannt · Auffällig: Unabhängige Justiz: 32“ mit dem Knopf „Justiz öffnen“.
- **Länge:** 1 Bildschirm.
- **Noten:** 4 · 4 · 4 · 3 · 2 · 3 · 3 · 4
- **Urteil:** Falscher Name oder falscher Inhalt. Die vier Porträts sind schön, haben aber keine erkennbare Funktion.

---

## 1a. Querschnitt: Der Weg eines Gesetzes. Ist „Idee → Entwurf → Mehrheit → Abstimmung → Umsetzung → Gericht“ erlebbar?

**Kurz: Er ist vorhanden, aber verstreut, dünn und an keiner Stelle sichtbar.** Die Schritte liegen auf vier Reiter in zwei Akten. Kein Bild zeigt, wo ein Gesetz gerade steht.

| Stufe | Im Spiel | Wo | Echtes Verfahren in der Türkei | Democracy 4 |
|---|---|---|---|---|
| Idee | Problem → Hebel → Regler, oder Ministervorschlag | Politik › Bereich, Vorschläge | Ressort oder Fraktion entwirft. Seit 2017 dürfen nur Abgeordnete Gesetze einbringen (Verfassung Art. 88); der Präsident nur den Haushalt. | Regler ziehen |
| Entwurf | Fassung „Scharf/Kompromiss/Verwässert“. Das ist nur die Schrittweite (`sim/gesetzgebung.ts:236–249`). | Maßnahmenzeile | Text mit Artikeln, oft als **Sammelgesetz** („torba kanun“) mit vielen Maßnahmen | – |
| Ausschuss | **fehlt** | – | Fachausschuss, Änderungsanträge der Fraktionen (RECHERCHE_GESETZGEBUNG_TUERKEI §3, empfohlen in RECHERCHE_GLM_8 §5.1) | – |
| Mehrheit sichern | Anonymer Stimmenkauf für 0,5 Kapital je Stimme (`sim/handeln.ts:44`) oder Verhandlungskarten je Fraktion | Tagesordnung **und** Fraktionen (doppelt) | Fraktionsdisziplin, Absprachen mit Partnern, Abweichler mit Namen | Kapital statt Mehrheit |
| Abstimmung | Nach 21 Tagen, fest 301 Ja (`sim/handeln.ts:41–42`) | Abstimmungskarte (nicht selbst gesehen) | Mehrheit der Anwesenden, mindestens 151 (Art. 96). 301 gilt nur bei der Wiederannahme nach einer Rückgabe (Art. 89). | entfällt |
| Präsident | **fehlt** | – | 15 Tage zum Veröffentlichen oder zur Rückgabe (Art. 89); Haushalt ausgenommen | – |
| Umsetzung | Monate je Maßnahme, Fortschrittsbalken | Parlament › Umsetzung | Verordnungen, Verwaltung | Verzögerung am Regler |
| Gericht | Normenkontrolle nur bei Erlassen und grundrechtsnahen Gesetzen, wenn mindestens 120 Abgeordnete klagen können (`sim/gesetzgebung.ts:56–65`). Das ist gut belegt. | Tagesordnung als Zeile „Gericht“ | Klage durch den Präsidenten, die zwei größten Fraktionen oder ein Fünftel der Abgeordneten, binnen 60 Tagen (Art. 150, 151) | – |

Was gegenüber dem türkischen Verfahren **zusätzlich** fehlt oder falsch ist:
- **Kein Unterschied zwischen Präsidialerlass und Präsidialbeschluss.** Steuersätze (Mehrwertsteuer, Verbrauchsteuer auf Kraftstoff, Zusatzzölle) ändert der Präsident in der Wirklichkeit per Beschluss in den Grenzen des Gesetzes. Das belegt der Code selbst: `data/skalen.ts:256` nennt für den Mehrwertsteuersatz von 20 % den „Präsidialbeschluss Nr. 7346“. Im Spiel brauchen diese Sätze ein Gesetz (`data/gesetzesvorhaben.ts`, `gv_mwst erlass: "nein"`). Umgekehrt dürfen Verteidigungsausgaben, Polizei und Grenzschutz per Erlass geändert werden (`sim/handeln.ts:91`), obwohl es Haushaltsgeld ist.
- **Mindestlohn:** Ihn setzt die Mindestlohnkommission fest (Arbeitsgesetz Art. 39, `RECHERCHE_TARIFRUNDEN_MINDESTLOHN §1`), nicht das Parlament. Im Spiel heißt er „Mindestlohngesetz“.
- **Ausnahmezustand:** Der Präsident ruft ihn aus, das Parlament bestätigt noch am selben Tag. Er dauert höchstens sechs Monate und kann um je vier Monate verlängert werden (Art. 119–121). Im Spiel ist er ein Gesetz mit 21 Tagen Wartezeit und ohne Frist.
- **Vorgezogene Wahl** (Art. 116, 360 Stimmen) ist ein Parlamentsbeschluss. Im Spiel steht sie als Verfassungsvariante.
- Es gibt **keine Vorlagen der Opposition**, also nichts, wogegen der Spieler sein Veto einlegen könnte.

Gegenüber **Democracy 4** fehlt dreierlei:
- Preis und Wirkung stehen nicht immer am Regler, sondern erst nach dem Klick.
- Beim Darüberfahren gibt es keine Linien zu Wählergruppen.
- Die Verlierer werden nicht durchgehend gezeigt (siehe B-14).

Das Spiel geht über Democracy 4 hinaus, wo es ein echtes Parlament, Fassungen und ein Verfassungsgericht hat. Diese Teile sind aber nicht zu einer Geschichte verbunden.

---

## 2. Befunde

Schwere: 1 = bricht Sinn oder Spiel, 2 = deutlich störend, 3 = Feinschliff.

### Regler und Einheiten

**B-1** · Politik › alle Regler · `data/skalen.ts:271`, `ui/NetView.tsx:282`, `ansichten.json lernen.m.stand` · Art: Sinn · Schwere 1 · Aufwand groß
- **Befund:** 81 von 117 Maßnahmen zeigen „{p} % des Ausgangs“. Auf dem Maßnahmenblatt stehen drei Einheiten auf einen Blick:
  - „100 % des Ausgangs“
  - „(Index 0–100; beim Amtsantritt 50,0)“
  - die Mentorin: „Aktuell steht sie im Landesdurchschnitt auf Stufe 50; beim Amtsantritt war es 50.“
- **Warum es stört:** Genau das hat der Projektinhaber verboten (Regel 5). „Mindestlohn 140 % des Ausgangs“ sagt keinem Spieler, ob er Arbeitern 5.000 Lira mehr gibt oder 500. „Index 50,0“ verletzt zusätzlich die Regel „Indizes ohne Kommastelle“.
- **Vorschlag:** Jede Maßnahme bekommt in `skalen.ts` eine Einheit und einen Umrechner (Tabelle in Abschnitt 5). Wo es keinen echten Wert gibt, gelten benannte Zustände. Die Zeile „(Index 0–100 …)“ und der Mentorsatz entfallen. Neufassung `lernen.m.stand`: „Heute: {wert}. Beim Amtsantritt: {startwert}.“

**B-2** · Politik › Mehrwertsteuer, Einkommensteuer, Körperschaftsteuer · `ui/politik/MassnahmenTafel.tsx:22`, `data/skalen.ts:270`, `data/skalen.ts:292` · Art: Logik · Schwere 1 · Aufwand mittel
- **Befund:** Die echten Sätze werden linear aus dem Index umgerechnet:
  - Mehrwertsteuer: 0, 3, 7, 10, 13, 17, 20, 23, 27, 30, 33 % (eigenes Bild `mwst.png`: „20 % → 17 %“).
  - Einkommensteuer: Spitzensatz 0 bis 80 % in Schritten von 8 Punkten.
  - Die Tafel bietet 11 Halte (0, 10, …, 100), das Maßnahmenblatt 5 Halte (±20, ±40). Derselbe Regler hat also an zwei Orten verschiedene Schritte.
- **Warum es stört:** Kein Finanzminister senkt die Mehrwertsteuer auf 17 %. Ein Spitzensatz von 0 % oder 80 % ist kein Spielraum, sondern ein Fehler.
- **Vorschlag:** Je Satz eine Liste echter Halte, etwa Mehrwertsteuer `[16, 18, 20, 22, 25]` und Spitzensatz `[30, 35, 40, 45, 50]`. Beide Ansichten lesen dieselbe Liste.

**B-15** · Politik › Regime-Regler · `data/skalen.ts` (`m_religioese_schulen`, `m_richterrat`, `m_notstand`, `m_urteilsumsetzung`, `m_minderheitenrechte`, `m_wehrdienst`, `m_offiziersauswahl`) · Art: Logik · Schwere 2 · Aufwand klein
- **Befund:** Sieben Zustände heißen „Wie heute“. Nach einer Reform heißt der alte Zustand weiter „Wie heute“, obwohl er es nicht mehr ist.
- **Warum es stört:** Der Spieler liest nach dem Beschluss „Jetzt: Wie heute → Neu: …“ und versteht nicht mehr, was gilt.
- **Vorschlag:** Den Zustand selbst benennen und „heute“ nur als Marke zeigen, wie es bei den anderen schon geschieht. Beispiele:
  - `m_richterrat.25` → „Minister und Parlament bestimmen“
  - `m_notstand.10` → „Antiterrorgesetze, kein Notstand“
  - `m_wehrdienst.30` → „6 Monate mit Freikauf“

**B-16** · Politik › Energie › „Akkuyu-Vertrag nachverhandeln“ · `data/politiknetz.ts:573` · Art: Sinn · Schwere 2 · Aufwand klein
- **Befund:** Eine Verhandlung ist als Mengenregler gebaut („ausbauen“, „140 % des Ausgangs“). Dasselbe gilt für „Sakarya Phase 3“ (ein Bauprojekt) und „Preiswahrheit“.
- **Warum es stört:** „Akkuyu-Vertrag zu 180 % nachverhandeln“ ergibt keinen Sinn.
- **Vorschlag:** Benannte Zustände: „Vertrag halten“, „Nachverhandlung anbieten“, „Nachverhandlung erzwingen“. Sakarya wird ein Vorhaben mit Bauzeit unter Land › Infrastruktur.

**B-36** · Politik › Maßnahmentafel › Zeile · `ui/politik/MassnahmenTafel.tsx:110–176` · Art: Design · Schwere 2 · Aufwand mittel
- **Befund:** Die Zeile zeigt nur Name, Regler und Wert. Kapital, Haushalt und Mehrheit erscheinen erst, wenn man den Regler bewegt.
- **Warum es stört:** Regel 4 verlangt „Preis und Wirkung am Regler“. In Democracy 4 sieht man die laufenden Kosten jeder Politik immer.
- **Vorschlag:** Rechts in jeder Zeile eine kleine graue Zeile: „kostet 0,6 % BIP · ±1 Stufe 4 Kapital“.

### Gesetzgebung und Recht

**B-3** · Parlament › Kopf und Abstimmung · `sim/handeln.ts:41–42`, `:619`, `oberflaeche2.json ui2.ui.parlament.ParlamentKopf.418c8d2` · Art: Logik · Schwere 1 · Aufwand groß
- **Befund:** „600 Sitze. Gesetze brauchen 301 Stimmen …“. Der Präsident „bringt den Gesetzentwurf ein“. Zwischen Einbringen und Abstimmung liegen fest 21 Tage, ohne Ausschuss und ohne Rückgabe.
- **Warum es stört:** Im echten Verfahren genügt die Mehrheit der Anwesenden, mindestens 151 (Art. 96). Einbringen dürfen nur Abgeordnete (Art. 88). Nach der Annahme kann der Präsident das Gesetz zurückgeben (Art. 89). Die Projektrecherche (RECHERCHE_GESETZGEBUNG_TUERKEI §6) nennt die 301 selbst eine „Spielkürzung“, die Oberfläche verkauft sie als Regel. Vor allem fehlt der spannende Teil: Im Ausschuss wird um Klauseln gerungen.
- **Vorschlag:**
  - Text: „Ihre Fraktion bringt den Antrag ein.“
  - Ausschussstufe mit einer Entscheidung: „Klausel opfern für Stimmen“ (die Bausteine dafür liegen schon vor, siehe B-8).
  - Mehrheit als „Ja über Nein bei Anwesenheit“, mit einer Anwesenheitsrate je Fraktion.
  - 301 nur bei Wiederannahme nach einer Rückgabe.
  - Bleibt die Vereinfachung, dann ehrlich: „Im Spiel braucht jedes Gesetz 301 Stimmen.“

**B-4** · Politik › Weg „Gesetz/Erlass“ · `sim/handeln.ts:91–92`, `data/gesetzesvorhaben.ts` (`gv_mwst`, `gv_mindestlohn`), `data/skalen.ts:256` · Art: Logik · Schwere 1 · Aufwand mittel
- **Befund:** Ein Erlass ist nur in den Themen Sicherheit, Außen und Militär erlaubt. Deshalb gilt:
  - „Verteidigungsausgaben“, „Polizei und Gendarmerie“ und „Grenzschutz“ gehen per Erlass, obwohl es Haushaltsgeld ist.
  - Mehrwertsteuer, Kraftstoffsteuer und Zölle brauchen ein Gesetz. Der eigene Beleg in `skalen.ts:256` nennt für den Mehrwertsteuersatz aber einen Präsidialbeschluss.
  - Der Ausnahmezustand (Thema „recht“) braucht ein Gesetz mit 21 Tagen Wartezeit.
  - Der Mindestlohn ist ein „Mindestlohngesetz“, wird aber in Wirklichkeit von einer Kommission festgesetzt.
- **Warum es stört:** Wer die Türkei kennt, stolpert sofort. Gerade die Macht des Präsidenten über Steuersätze und den Notstand ist der Kern des Präsidialsystems und ein starker Spielhebel.
- **Vorschlag:** Je Maßnahme ein Feld `weg`:
  - „gesetz“
  - „beschluss“ (Präsidialbeschluss in den Grenzen des Gesetzes: Mehrwertsteuer, Verbrauchsteuern, Zusatzzölle, Energiepreise)
  - „erlass“ (Präsidialerlass Art. 104 Abs. 17, anfechtbar)
  - „haushalt“ (nur über den Haushalt: Verteidigung, Polizei, Personal)
  - „kommission“ (Mindestlohn im Dezember: Druck auf die Kommission statt Gesetz)
  - „notstand“ (Ausrufen, Bestätigung am selben Tag, Frist)

**B-5** · Politik › Recht › „Ausnahmezustand und Sonderbefugnisse“ · `data/skalen.ts:213`, `data/politiknetz.ts:1367` · Art: Funktion · Schwere 1 · Aufwand mittel
- **Befund:** Die Stufe verspricht „Höchstens sechs Monate, das Parlament stimmt am selben Tag zu und kann um vier Monate verlängern.“ In der Simulation gibt es weder Frist noch Verlängerung noch Auslöser. `m_notstand` wird außerhalb des Netzes nur in `sim/figuren.ts:224/362` gelesen.
- **Warum es stört:** Das ist ein Text, der eine Wirkung verspricht, die es nicht gibt (Regel 7). Außerdem lässt sich der Ausnahmezustand ohne Anlass ausrufen und für immer behalten.
- **Vorschlag:** Den Notstand als Vorgang bauen:
  - Anlass nötig (Beben, Anschlag, Krieg, schwere Wirtschaftskrise; Art. 119)
  - Bestätigung durch das Parlament am selben Tag, mit Stimmenprognose
  - Ablauf nach 180 Tagen, Verlängerung um 120 Tage als neue Abstimmung
  - Notstandserlasse als eigener Weg

**B-7** · Gesetzgebung insgesamt · `ui/politik/MassnahmenTafel.tsx`, `ui/gueter/VersorgungsMehrheitsWege.tsx`, `sim/haushaltsmehrheit.ts`, `sim/verfassung.ts`, `data/reich/recht.ts:128–141` · Art: Konsistenz · Schwere 1 · Aufwand groß
- **Befund:** Es gibt fünf Wege zu einem Beschluss mit verschiedener Mechanik:
  1. Maßnahme → Gesetz (Fassungen, Stimmenkauf)
  2. Versorgungsvorlage (Klauseln, „So sichern Sie die Mehrheit“, „Herausnehmen: {klausel}“)
  3. Haushalt (eigene Mehrheit)
  4. Verfassung (Paket, 360/400)
  5. Justiz-Vorhaben „Gesetz über mehrere Anwaltskammern“: eine Bauzeile mit Kapital und Monaten, ganz ohne Parlament
- **Warum es stört:** „Sieht wieder alles verschieden aus“. Ausgerechnet das beste Werkzeug, der Klauseltausch der Mehrheitswege, gibt es nur bei der Versorgung.
- **Vorschlag:** Ein Vorlagenmodell für alle (Titel, Klauseln, Fraktionsprognose, Termin, Gericht) und eine Karte für alle. Die Mehrheitswege werden zum Standard für jedes Gesetz. Das Kammergesetz läuft über die Tagesordnung.

**B-8** · Gesetzeskatalog · `sim/gesetzgebung.ts:410` (`gesetzesTisch`), `:421` (`bringeVorhabenEin`), `:373` (`kalender`), `data/gesetze/` (kern1.ts, kern2.ts) · Art: Sinn · Schwere 1 · Aufwand mittel
- **Befund:**
  - `gesetzesTisch` und `bringeVorhabenEin` werden nirgends aufgerufen. Der Katalog mit 26 Vorhaben ist für den Spieler nur als Fassungsknöpfe an einzelnen Zeilen sichtbar.
  - Das Feld `kalender` („Mindestlohn im Dezember“) wirkt nur auf den Rang in diesem ungenutzten Tisch.
  - `data/gesetze/` mit 20 Gesetzesbausteinen, Klauseln und Konfliktlinien (1.900 Zeilen) wird von keiner Datei importiert.
- **Warum es stört:** Der Spieler kann nicht nachsehen, welche Gesetze er überhaupt einbringen könnte. Die beste Recherche des Projekts ist nur Ablage.
- **Vorschlag:** Reiter „Gesetze“ im Parlament als Katalog: 26 Karten mit Titel, Lager dafür und dagegen, Monat und den Klauseln aus den Bausteinen. Ein Klick auf eine Karte öffnet die Vorlage.

**B-9** · Politik › Fassungen · `sim/gesetzgebung.ts:236–249`, `data/gesetzesvorhaben.ts` · Art: Sinn · Schwere 2 · Aufwand mittel
- **Befund:** „Scharf/Kompromiss/Verwässert“ ist nur die Schrittweite (30/18/8 Punkte). Die Vorhaben gelten nur in eine Richtung: Mehrwertsteuer und Wehrdienst nur senken, Polizei nur ausbauen. In die Gegenrichtung ist es eine „freie Änderung ohne Fassung“, ohne Lager und ohne Gericht.
- **Warum es stört:** „Kompromiss“ verspricht Inhalt, nämlich wem man etwas gibt. Eine Steuererhöhung hat bei diesem System keine Gegner.
- **Vorschlag:** Die Fassungen aus den Klauseln der Bausteine bilden, zum Beispiel „Mehrwertsteuer senken nur auf Nahrung“. Jedes Vorhaben bekommt beide Richtungen.

**B-10** · Parlament › „Stimmen sichern“ · `sim/handeln.ts:44`, `:395`, `:708–722` · Art: Sinn · Schwere 1 · Aufwand mittel
- **Befund:** „{n} Stimmen sichern · {kosten}“. Die Stimmen werden anonym gekauft, für 0,5 Kapital das Stück. Dazu der Text: „danach schuldet niemand jemandem etwas“.
- **Warum es stört:** Es ist die einfachste und billigste Lösung jedes Mehrheitsproblems: 30 Stimmen kosten 15 Kapital. Es gibt keine Gesichter, keine Folgen und keine Abwägung, also keinen Suzerain-Moment.
- **Vorschlag:** Die Stimmen kommen von benannten Abweichlern oder Kleinfraktionen. Jeder Kauf ist eine Zusage mit Folge („Abgeordnete aus Konya wollen die Umgehungsstraße“). Der Preis steigt je Kauf, und es gibt ein Aufdeckungsrisiko in der Presse.

**B-18** · Parlament › Justiz › Reformen und Vorhaben › „Gesetz über mehrere Anwaltskammern“ · `data/reich/recht.ts:128–141` · Art: Logik · Schwere 2 · Aufwand klein
- **Befund:** „Weitere Kammern in Großstädten, wie es das Gesetz von 2020 vorsieht“. Das Gesetz gilt also schon. Hier wird es als neues Gesetz gebaut, mit „Bau 30, 4 Monate“ und ohne Abstimmung.
- **Warum es stört:** Ein Gesetz ohne Parlament untergräbt die eigene Regel „ein Weg zum Gesetz“ (ENTSCHEIDUNGEN W 2).
- **Vorschlag:** Umbenennen in „Zweite Anwaltskammer in Istanbul zulassen“ (Verwaltungsakt) oder als Gesetz über die Tagesordnung führen.

**B-19** · Politik › Maßnahmenzeile › „Dafür/Dagegen“ · `sim/gesetzgebung.ts:117–123`, `sim/fraktionen.ts:84–93` · Art: Logik · Schwere 2 · Aufwand klein
- **Befund:** Beim Mindestlohngesetz (eigenes Bild `mindestlohn_tafel.png`) stehen nebeneinander „Dagegen: AKP, AP, YENİ Parti, Arbeitgeberverbände“ und „Mehrheit steht (348 von 301 nötig)“. „AP“ ist die eigene Partei, als Kürzel, denn `PARTEI_NAME` kennt „AP“ nicht. YENİ ist Partner im Lager.
- **Warum es stört:** Die eigene Partei und der Partner sind dagegen, und trotzdem steht die Mehrheit. Das versteht niemand.
- **Vorschlag:** Eigene Partei und Partner nach dem Ja-Anteil zeigen: „Ihre Partei: 70 % stimmen mit“. „AP“ wird zu „Aufbruchspartei“. Neufassung `po2.steht`: „steht: {ja} Ja, nötig {noetig}“.

**B-31** · Parlament › Verfassung · `sim/verfassung.ts:125–175`, `ansichten.json vf.deltaJa` · Art: Logik / Sprache · Schwere 2 · Aufwand klein
- **Befund:**
  - „Vorgezogene Neuwahl“ steht als Variante des Artikels zur Amtszeit. Das ist aber ein Beschluss nach Art. 116 mit 360 Stimmen, keine Verfassungsänderung.
  - Die Marke „−22 Ja“ ist nicht erklärt.
  - Was fehlt: Bei 400 Stimmen kann der Präsident trotzdem eine Volksabstimmung ansetzen (Art. 175), und er kann eine Änderung zurückgeben.
- **Warum es stört:** Die vorgezogene Wahl ist das wichtigste Machtmittel nach Art. 116 und gehört in die Parlamentsakte.
- **Vorschlag:**
  - Die vorgezogene Wahl als eigenen Vorgang im Parlament führen.
  - Neufassung `vf.deltaJa`: „{n} Stimmen“, dazu der Hinweis am Mauszeiger: „So viele Ja-Stimmen gewinnt oder verliert das Paket mit dieser Fassung.“
  - Bei mindestens 400 Stimmen die Wahl anbieten „direkt verkünden oder zur Volksabstimmung geben“.

### Logik der Maßnahmen

**B-6** · Politik › Maßnahmenkatalog · `data/politiknetz.ts` · Art: Konsistenz · Schwere 1 · Aufwand mittel
- **Befund:** Doppelte oder gegenläufige Regler für dieselbe Sache:
  - Energiesubventionen (Zustände, kostet 1,0 % BIP) gegen „Preiswahrheit bei Energie“ (Menge, bringt 0,8 % BIP). Beide stehen gleichzeitig auf „voll“.
  - „Heimische Gasförderung“ und „Sakarya Phase 3“: beide auf `sakarya_gas`.
  - „Ausbau von Sonne und Wind“ und „YEKA-Ausschreibungsserie“.
  - „Stromnetzausbau“ und „Netzmodernisierung und Speicher“.
  - „Berufsausbildungsprogramme“, „Berufsschulen“ und „Fachkräfte und Weiterbildung“.
  - „Polizei“ und „Moderne Sicherheitsverwaltung“.
  - „Krankenhausbau“ und „Medizintechnik“.
  - „Moderne Bewässerung“, „Saatgut“ und „Agrarforschung“ (Tropfbewässerung und Sorten doppelt).
  - Die Justizreform hat die Stufen „Mehr Richter, schnellere Verfahren“ und „Unabhängige Ernennungen“. Dafür gibt es aber eigene Regler „Richterstellen“ und „Richterrat“, und der Text sagt das sogar selbst.
  - „Alle Urteile umsetzen … etwa Kavala“ ist eine Stufe und zugleich das Justiz-Vorhaben „Urteile im Fall Kavala umsetzen“.
- **Warum es stört:** Regel 8 (nichts doppelt). Der Spieler weiß nicht, welcher Regler zählt, und kann Widersprüchliches beschließen.
- **Vorschlag:**
  - Zusammenlegen: Energiepreise wird ein Regler mit den Zuständen „Deckel für alle“, „Staffeltarif“ und „Marktpreis mit Sozialtarif“.
  - Gasförderung als Regler, Sakarya als Bauvorhaben.
  - Erneuerbare: „Ausschreibung GW je Jahr“.
  - Bildung: ein Regler „berufliche Bildung, Plätze je Jahr“.
  - Die Justizreform auf Verfahrensrecht beschränken, die Stufen umbenennen.

**B-11** · Politik › Haushaltszeile „kostet … % des BIP“ · `data/politiknetz.ts` (`cost`) · Art: Zahl · Schwere 2 · Aufwand mittel
- **Befund (Vermutung, nachrechnen):**
  - Mehrwertsteuer von 20 auf 17 % kostet im Spiel 0,20 % BIP. Bei einem Aufkommen in der Größenordnung von 5 bis 6 % BIP wären es eher 0,8 %.
  - Die ganze Spanne der Verteidigung kostet 1,0 % BIP, schon der Startwert liegt aber bei 1,9 % BIP (RECHERCHE_REALWELT_TUERKEI_2026.md:405).
  - Lehrergehälter auf „180 % des Ausgangs“ kosten 0,32 % BIP.
- **Warum es stört:** Sobald echte Einheiten am Regler stehen (B-1), fällt jede falsche Größenordnung auf.
- **Vorschlag:** `cost` aus den Haushaltsdaten ableiten (`data/haushalt_ministerien_2026.ts`) und je Maßnahme als „Euro je Einheit“ hinterlegen, mit Quelle oder dem Vermerk „Spielparameter“.

**B-12** · Politik › Preis beim Senken · `sim/handeln.ts:289`, `:411` · Art: Logik · Schwere 2 · Aufwand klein
- **Befund:** Jede Senkung zahlt den „Exit-Preis“ (Faktor 1,6), auch eine Senkung der Mehrwertsteuer. Der Hinweis dazu: „Exit-Preis: Das Zurücknehmen kostet das 1,6-Fache des Einführens — Besitzstände, Apparate und Lager wehren sich.“ (eigenes Bild `mwst.png`).
- **Warum es stört:** Eine Steuersenkung ist beliebt, niemand verteidigt einen Besitzstand an hohen Steuern. Die Richtung „senken = streichen“ stimmt nur bei Leistungen.
- **Vorschlag:** Den Preis je Maßnahme nach „wer verliert“ richten: Bei Sätzen ist die Erhöhung teuer. Den Hinweis nur zeigen, wenn wirklich jemand etwas verliert.

**B-13** · Politik › Haushalt › „Privatisierung“ · `data/politiknetz.ts:273`, `:300` · Art: Logik · Schwere 2 · Aufwand klein
- **Befund:** Die Begründung sagt „Verkaufserlöse entlasten den Haushalt, aber nur einmal.“ Das Modell bucht dagegen dauerhaft −0,2 % BIP je Jahr und eine dauerhafte Kante auf die Steuereinnahmen.
- **Warum es stört:** Der Text verspricht etwas anderes als die Rechnung.
- **Vorschlag:** Einmalerlös in Mrd. Dollar beim Beschluss, danach entgangene Dividenden als kleine laufende Kosten.

**B-14** · Politik › Maßnahmen ohne Verlierer · `data/politiknetz.ts` · Art: Sinn · Schwere 2 · Aufwand mittel
- **Befund:** 36 Maßnahmen haben keine Verbindung zu einer Wählergruppe, 78 keine negative. Beispiele für Maßnahmen, die außer Geld nur gewinnen:
  - „Beförderung im Obersten Militärrat“ nach Leistung
  - „Ausbildung und Übungen“, „Frühwarnsystem“, „Ausbau der Katastrophenbehörde“
  - „Breitband“, „Bahn“
- **Warum es stört:** „Hinter jeder Entscheidung muss etwas stecken“. Ohne Verlierer gibt es eine einzige richtige Antwort, nämlich alles hochdrehen, sobald Geld da ist.
- **Vorschlag:** Je Maßnahme mindestens ein Verlierer mit Begründung. Beispiele:
  - Offiziersauswahl nach Leistung: Loyalität der Generäle sinkt.
  - Bahnausbau: Lkw-Gewerbe und Enteignete.
  - Übungen: Treibstoffkosten und Lärm in den Garnisonsstädten.

**B-17** · Politik › Bildung › „Neue Universitäten“ · `data/politiknetz.ts:420` · Art: Zahl · Schwere 2 · Aufwand klein
- **Befund:** „Universitäten in jeder Provinz.“ Soweit mir bekannt, hat seit etwa 2008 jede Provinz eine staatliche Universität (prüfen).
- **Warum es stört:** Das Ziel ist längst erreicht, der Regler hat keinen Sinn.
- **Vorschlag:** Umbauen zu „Studienplätze je Jahrgang“ oder „Qualität statt Zahl der Hochschulen“.

**B-43** · Politik › Gesundheit › „Hausarztsystem“, Zustand „Hausarzt-Pilotprojekte“ · `data/skalen.ts` (`m_hausarzt`) · Art: Zahl · Schwere 2 · Aufwand klein
- **Befund:** Der heutige Zustand heißt „Erste Provinzen testen das System.“ Das Familienarztsystem gilt nach meinem Wissen seit 2010 landesweit (prüfen).
- **Warum es stört:** Der Startzustand ist falsch.
- **Vorschlag:** Die Zustände neu ordnen: „Familienarzt landesweit, freier Zugang zu Kliniken“ ist heute, „Überweisungspflicht“ ist der nächste Schritt.

**B-42** · Politik › Energie › „Kernkraft“ · `data/politiknetz.ts:514` · Art: Zahl · Schwere 3 · Aufwand klein
- **Befund:** Bis zur vollen Wirkung vergehen 48 Monate für „Ein zweites Kraftwerk“. Akkuyu ist seit 2018 im Bau (Vermutung: erster Block 2025 oder 2026).
- **Warum es stört:** Vier Jahre für ein Kernkraftwerk sind unglaubwürdig.
- **Vorschlag:** Als Bauvorhaben mit 8 bis 10 Jahren führen, dazu Zwischenstufen (Standortwahl, Vertrag, Bau).

**B-27** · Politik › Maßnahmenblatt › „Wo soll es gelten?“ · `ui/NetView.tsx:307` · Art: Sinn · Schwere 2 · Aufwand klein
- **Befund:** Die Ortswahl („Ganzes Land / Wo es akut ist / Region / Provinzen“) steht bei jeder Maßnahme, auch bei „Annäherung an die EU“, Mehrwertsteuer, Wehrdienst und Verfassungsnähe.
- **Warum es stört:** „Wehrdienst nur in Konya“ ist sinnlos (hinterfrag jeden Klick).
- **Vorschlag:** Ein Feld `ort: "land" | "region" | "provinz"` je Maßnahme. Ohne Wahl entfällt Schritt 1.

### Ansichten und Gestaltung

**B-20** · Parlament › Fraktionen und Abstimmung · `ui/parlament/ParlamentKopf.tsx`, `ui/Beschlussbuch.tsx:96–109`, `:161–245`, `ui/parlament/Tagesordnung.tsx:57–98` · Art: Konsistenz · Schwere 2 · Aufwand mittel
- **Befund:** Die Mehrheitszahl steht auf einem Bild fünfmal:
  - Kopfleiste „328/600“
  - Aktenkopf „Mehrheit (mit Duldung) 328“
  - Kachel „328 Lager, Mehrheit steht“
  - Halbrund „328 Regierungsmehrheit“
  - Satz „Ihr Lager hat 328 von 600 Sitzen …“

  Laufende Gesetze stehen mit denselben Knöpfen „Stimmen sichern“ und „Zurückziehen“ in der Tagesordnung und im Reiter „Fraktionen und Abstimmung“.
- **Warum es stört:** Regel 8. Die Seite wird 3 Bildschirme lang.
- **Vorschlag:** Die Zahl nur im Halbrund. Gesetze nur in der Tagesordnung, die Fraktionsseite verlinkt dorthin.

**B-21** · Parlament › Tagesordnung, leerer Zustand · `tagesordnung.json to.leer`, Bild 006 · Art: Design · Schwere 2 · Aufwand mittel
- **Befund:** „Keine Vorlage im Parlament. Gesetze bringen Sie in der Politik ein: an der Maßnahme, die Sie ändern wollen.“ Dazu ein Knopf und zwei Drittel weiße Fläche.
- **Warum es stört:** Es fehlt das eine Bild (Regel 1), und der Spieler findet keinen Einstieg, nur einen Verweis.
- **Vorschlag:** Eine Zeitleiste der nächsten 90 Tage (Haushaltsfenster im Oktober, Mindestlohnkommission im Dezember, Fristen des Verfassungsgerichts). Darunter „Was Ihre Fraktion einbringen könnte“: die drei dringendsten Katalogvorhaben als Karten.

**B-22** · Parlament › Fraktionen und Abstimmung, Verhandlungskarten · eigene Bilder `fraktionen1–2.png`, `ui/Beschlussbuch.tsx:96–97` · Art: Design · Schwere 2 · Aufwand mittel
- **Befund:**
  - Die Karte der AKP ist etwa drei Bildschirme hoch, die der MHP daneben einen halben. Daneben bleibt eine große leere Spalte.
  - Ressortverantwortung und Versorgungstagesordnung stehen mitten in der Parlamentsseite.
  - Fraktionsabkommen zeigen „Heutiger Stand Stufe 55,0“ und „Landesweit zugesagt Stufe 75“.
- **Warum es stört:** Die Seite wirkt wie ein Formular. Dazu kommen Stufen und Kommazahl (Regeln 5 und 10).
- **Vorschlag:** Eine Fraktion je Zeile mit drei Knöpfen (Gespräch, Duldung, Koalition). Das Abkommen klappt auf. Zusagen in echter Einheit: „Autobahnbau: heute 55 km je Jahr → zugesagt 75“.

**B-23** · Parlament › Umsetzung · `ui/Beschlussbuch.tsx:54`, `oberflaeche.json ui.politik.UmsetzungAkte.00c5907`, `sim/spiel.ts:274` · Art: Funktion · Schwere 2 · Aufwand klein
- **Befund:** „1 Beschlüsse seit dem Amtsantritt“ zählt alle Protokolleinträge der Art „entscheidung“. Darunter sind „Ziele der Amtszeit: keine.“ und „Gesetzentwurf … eingebracht“ (eigenes Bild `nachabst.png`: „2 Beschlüsse“, obwohl nichts beschlossen ist). Dazu „0,00 % BIP“ mit zwei Nachkommastellen.
- **Warum es stört:** Die Zahl ist falsch und das Wort grammatisch falsch.
- **Vorschlag:** Nur angenommene Gesetze, Erlasse und Beschlüsse zählen. `{n, plural, one {# Beschluss} other {# Beschlüsse}} seit dem Amtsantritt`. Kosten mit einer Nachkommastelle.

**B-24** · Mehrere Texte mit „Stufe“ · `sim/handeln.ts:530` und `:619`, `protokoll.json protokoll.gesetz.ja`, `oberflaeche2.json ui2.ui.Beschlussbuch.42b4e5e`, `fraktionsabkommen.json fa.stufe`, `gesetze.json gesetz.ui.stufe`, NetView „Einführen (+10 Stufen)“ · Art: Sprache · Schwere 2 · Aufwand mittel
- **Befund:** Die Rohzahl erscheint in vielen Texten, zum Beispiel „Gesetzentwurf „Mindestlohngesetz · Kompromiss“ im ganzen Land auf Stufe 70 eingebracht.“ oder „Das Parlament nimmt „{name}“ {ort} an ({ja} zu {nein}). Stufe {stufe}.“
- **Warum es stört:** Regel 5. Die Chronik spricht eine interne Sprache.
- **Vorschlag:** Überall `stufenName(id, w)` einsetzen. Neufassung: „Ihre Fraktion bringt das Mindestlohngesetz (Kompromiss) ein: Mindestlohn von 28.076 auf 33.000 Lira netto. Abstimmung am 26. Juni.“

**B-25** · Politik › Maßnahmenblatt · eigene Bilder `notstand_netz1–2.png`, `ui/NetView.tsx:155–250` · Art: Design · Schwere 2 · Aufwand mittel
- **Befund:**
  - Dieselben Wirkungen stehen dreimal: im Graphen, unter „Was folgt daraus? Wirkungen im Land“ und rechts unter „Wirkungen“.
  - Die Pfeilfarbe zeigt die Richtung, nicht die Güte: „Terrorgefahr ▼“ ist rot, obwohl ein Rückgang gut ist. Die Politikseite erklärt dagegen „rot heißt schlechter“.
  - Das Blatt ist 3,15 Bildschirme lang.
- **Warum es stört:** Gleiches soll gleich aussehen, und das Blatt ist zu lang.
- **Vorschlag:** Den Graphen behalten, am Mauszeiger die Begründung zeigen. Die rechte Liste streichen. Farbe nach Güte (grün besser, rot schlechter), die Richtung als Pfeil.

**B-26** · Politik › Maßnahmenblatt › „Die Mentorin erklärt“ · Bild 005 · Art: Sprache · Schwere 3 · Aufwand klein
- **Befund:** Bei jeder Maßnahme steht derselbe Absatz: „Eine Maßnahme ist ein Regler, den Sie beschließen. Jede Stufe sagt, was sie bedeutet …“.
- **Warum es stört:** Er ist trocken und wiederholt sich, statt diese Maßnahme zu erklären.
- **Vorschlag:** Je Maßnahme zwei Sätze: wer gewinnt, wer verliert, und ein echtes Beispiel. Etwa: „Der Mindestlohn wird jedes Jahr im Dezember von einer Kommission festgesetzt. Jede Erhöhung freut Beschäftigte und treibt die Preise.“

**B-28** · Parlament › Aktenkopf · `ui/akte/akte.css:161`, Bild 006 · Art: Design · Schwere 3 · Aufwand klein
- **Befund:** Der Aufmacher „GESETZGEBUNG & PARLAMENTARISCHE KONTROLLE · 5. JUNI 2028“ steht in Schreibmaschinenschrift (`var(--maschine)`), rot und gesperrt. Die Politikakte hat keinen solchen Kopf. Hinter den Kennzahlkarten scheint ein Bild durch (Flagge, Balken).
- **Warum es stört:** Es ist eine vierte Schrift im Kopf, und das durchscheinende Bild wirkt wie ein Darstellungsfehler.
- **Vorschlag:** Kapitälchen wie in allen Akten. Das Hintergrundbild entweder ganz zeigen (Meclis-Saal, oben links) oder weglassen.

**B-29** · Parlament › Reiter „Mehrheitslage“ · Bild 011 · Art: Sinn · Schwere 2 · Aufwand klein
- **Befund:** Der Reiter heißt „Mehrheitslage“, zeigt aber „Auffällig: Unabhängige Justiz: 32“ und „Justiz öffnen“. Er ist rechts abgesetzt und anders gestaltet als die übrigen Reiter.
- **Warum es stört:** Der Name verspricht etwas anderes, als der Reiter zeigt.
- **Vorschlag:** Den Reiter entfernen. Die Lagebewertung kommt als eine Zeile unter den Aktenkopf.

**B-30** · Parlament › Justiz › Lage und Politik › Recht und Justiz › Lage · Bild 010 und eigenes Bild `recht0.png` · Art: Konsistenz · Schwere 2 · Aufwand klein
- **Befund:**
  - Dieselben 8 Größen stehen an zwei Orten.
  - „Überfüllung der Haftanstalten 71“ steht als Index neben „etwa 142 Prozent Belegung“: zwei Zahlen für dieselbe Sache.
  - „Ausnahmerecht 10“ ist nicht erklärt.
- **Warum es stört:** Der Spieler weiß nicht, ob 71 oder 142 die gemeinte Zahl ist.
- **Vorschlag:** Echte Einheit als Hauptwert („142 % belegt“, „17 Richter je 100.000“, „228 Tage“) und den Index nur als Balkenlänge. Die Lage nur in Justiz, die Politik verlinkt dorthin.

**B-33** · Politik › Überblick · `ui/politik/Politik.tsx:169–185` und `:263–277` · Art: Konsistenz · Schwere 3 · Aufwand klein
- **Befund:** Die Leiste links und das Kreisraster zeigen dieselben 15 Bereiche mit denselben Zahlen. Gelb heißt im Zähler „Achtung“ (`ui2.ui.politik.Politik.fe6ddf0`), am Kreis ebenfalls „Achtung“ (`pd.ampel.gelb`), im Englischen aber einmal „Caution“ und einmal „watch“.
- **Warum es stört:** Regel 8, und das Englische ist uneinheitlich.
- **Vorschlag:** Die Leiste im Überblick weglassen (erst im Bereich zeigen). Ein Schlüssel für Gelb.

**B-34** · Politik › Vorschläge · Bild 004, `ministerfluss.json mfl.m.stufe`, `mfl.e.warten` · Art: Sprache · Schwere 3 · Aufwand klein
- **Befund:**
  - Alle vier Vorschläge kommen von einem Minister.
  - Karte 2 sagt „Empfehlung Warten“, der Grund (`mfl.e.warten`) steht nur aufgeklappt.
  - „Industrieller Wohnungsbau: ausbauen: von 100 % des Ausgangs auf 180 % des Ausgangs“ hat zwei Doppelpunkte.
  - „Mietpreisbremse: von „Milde Begrenzung“ zu „Deckel für Bestandsmieten““ verschachtelt gleiche Anführungszeichen.
- **Warum es stört:** Die Liste wirkt eintönig, und die Sätze holpern.
- **Vorschlag:** Höchstens zwei Vorschläge je Minister. Den Grund in einem Satz auf der Karte. Neufassungen:
  - „Industrieller Wohnungsbau: 4.000 statt 2.000 Fertigteilwohnungen im Jahr“
  - „Mietpreisbremse: von ‚Milde Begrenzung‘ zu ‚Deckel für Bestandsmieten‘“

**B-35** · Politik › Maßnahmentafel, Rückmeldung · `ui/politik/MassnahmenTafel.tsx:99` · Art: Funktion · Schwere 3 · Aufwand klein
- **Befund:** Nach dem Einbringen in „Wirtschaft“ steht dieselbe Rückmeldung auch in „Haushalt und Steuern“ (eigener Auszug `haushalt.txt`).
- **Warum es stört:** Die Meldung erscheint am falschen Ort.
- **Vorschlag:** Die Rückmeldung beim Bereichswechsel zurücksetzen, etwa über einen `key` am Bereich.

**B-37** · Politik › Mehrwertsteuer › Fassung · `gesetze.json gesetz.v.gv_mwst.titel` · Art: Logik · Schwere 2 · Aufwand klein
- **Befund:** Der Regler senkt den Regelsatz (20 → 17 %), das Gesetz heißt aber „Mehrwertsteuersenkung auf Grundbedarf“.
- **Warum es stört:** Grundbedarf ist der ermäßigte Satz (1 % oder 10 %), nicht der Regelsatz.
- **Vorschlag:** Zwei Regler: „Regelsatz“ und „ermäßigter Satz für Lebensmittel“. Oder den Titel ändern in „Senkung des Mehrwertsteuersatzes“.

**B-38** · Parlament › Sitztabelle · `ui/parlament/ParlamentKopf.tsx:203` · Art: Design · Schwere 3 · Aufwand klein
- **Befund:** Die Spalte „22,3 % / 14 % / 10,3 %“ hat keine Überschrift. Gemeint ist der Stimmenanteil, nicht der Sitzanteil (176 Sitze sind 29 %). Die Kommastellen sind uneinheitlich.
- **Warum es stört:** Der Spieler hält die Zahl für den Sitzanteil.
- **Vorschlag:** Überschriften „Sitze“ und „Stimmen 2028“, immer eine Nachkommastelle.

**B-41** · Politik › Maßnahmenblatt, großer Wert · eigenes Bild `notstand_netz0.png` · Art: Design · Schwere 3 · Aufwand klein
- **Befund:** „Notstandsdek / rete“ bricht ohne Trennstrich um.
- **Warum es stört:** Das sieht wie ein Satzfehler aus.
- **Vorschlag:** `hyphens: auto` mit `lang="de"` am Wert, oder kleinere Schrift ab 14 Zeichen.

### Sprache und Übersetzung

**B-32** · Fest verdrahtete deutsche Wörter · Art: Übersetzung · Schwere 2 · Aufwand mittel
- **Befund:** Diese Stellen umgehen die Kataloge (Regel 11):
  - `sim/handeln.ts:394–435, 442, 530, 558–578, 619–620, 701–719`: alle Hinweise und Rückmeldungen beim Einbringen, etwa „Die Verwaltung ist mit … überlastet“, „Dem Lager fehlen …“, „Exit-Preis: …“, „Dafür braucht der Präsident ein Gesetz …“, „Das ist schon die aktuelle Stufe.“.
  - In `handeln.ts:395` erscheint `${REGELN.kaufKostenProStimme}` als „0.5“ mit englischem Dezimalpunkt im deutschen Satz.
  - `ui/NetView.tsx:25–35` (`KIND_LABEL`, `DIRECTION`), `:107–108` („Inflation“, „Wachstum“), `:220` (Plural mit `"e"`), `:226` („Im Kabinett“), `:282` („(Index 0–100; “).
  - `ui/Beschlussbuch.tsx:183` („erwartet … Ja“), `:194` („und“, „stimm-t/-en“; der Ausdruck `"ihre" : "ihre"` ist ohne Wirkung).
  - `ui/politik/Politik.tsx:59` („gestiegen/gesunken/besser/schlechter“), `:162` („Zurück zu …“), `:377` („wirkt …“).
  - `ui/parlament/ParlamentKopf.tsx:18–25` (`ZUSTAND_KURZ`, `ZUSTAND_HILFE`).
  - `sim/verfassung.ts:131, 141, 153, 166, 192, 201` (Variantennamen „Wie bisher“, „Weitere Wiederwahl“, „Keine Begrenzung“, „Vorgezogene Neuwahl“, „Vier Jahre“, „Sieben Jahre“; in keinem Katalog vorhanden).
  - `ui/Verfassung.tsx:189, 395` (deutsche Anführungszeichen im Code).
  - Mehrere `toLocaleString("de-DE")`.
- **Warum es stört:** Die englische und die türkische Fassung zeigen mitten im Satz deutsche Wörter.
- **Vorschlag:** Alles in die Kataloge verschieben und Zahlen über `zahl()` aus `i18n` formatieren. Pluralformen als ICU-Regeln.

**B-39** · Türkisch und Englisch · `tr/daten_skala.json`, `en/…` · Art: Übersetzung · Schwere 3 · Aufwand klein
- **Befund:**
  - TR `daten.skala.m_wehrdienst.60.name` „Bedelsiz 12 ay“ heißt „kostenlos 12 Monate“. Gemeint ist „ohne Freikauf“.
  - TR-Knöpfe im Infinitiv: „Büyük ölçüde genişletmek“ (`skala.menge.p2`), „Tüm kararları uygulamak“.
  - EN „{p} % of the start“ ist unidiomatisch.
  - EN Gelb heißt einmal „watch“, einmal „Caution“.
- **Warum es stört:** Die Übersetzungen klingen maschinell oder sind falsch.
- **Vorschlag:** TR „Bedelli olmadan 12 ay“, „Büyük ölçüde genişlet“, „Tüm kararlar uygulanır“. EN „{p} % of baseline“ und einheitlich „Caution“.

**B-40** · Fachjargon in Maßnahmentexten · `data/politiknetz.ts:568–577`, `handeln.ts:411` · Art: Sprache · Schwere 3 · Aufwand klein
- **Befund:** Unerklärte Kürzel und Fachwörter: „FSRU- und Regasifizierungs-Ausbau“, „zweite FPU“, „YEKA-Ausschreibungsserie“, „Akkuyu-Vertrag“ mit „PPA“ in der Kennung, „BOTAŞ trägt ihn vor“, „TEİAŞ-Programm“, „schwächen die Winter-Hooks ab“, „Exit-Preis“, „die Stufenleiter braucht Menschen“.
- **Warum es stört:** Englische Reste und Kürzel ohne Erklärung (Regel 10).
- **Vorschlag:** Neufassungen:
  - „Schwimmende Flüssiggas-Terminals“
  - „Zweite Förderplattform im Schwarzen Meer“
  - „Staatliche Ausschreibungen für Wind und Sonne“
  - „Volle Speicher tragen durch einen kalten Februar.“
  - „Rücknahmepreis“ statt „Exit-Preis“

---

**Zählung:** 43 Befunde: Schwere 1: 9 (B-1 bis B-8 und B-10), Schwere 2: 24, Schwere 3: 10.

**Gutes, das bleiben soll:**
- das Halbrund mit Abweichlern und die 301er-Marke
- die Verfassungswerkstatt (Entwurf auf Papier, Waage, Ja-Delta, Sperrfrist)
- die Maßnahmenzeile mit Fassungsknöpfen, „Dafür/Dagegen“ und Preisfeld
- die belegten Regime-Zustände bei Medien, Justiz, Wehrdienst und Minderheiten
- die Normenkontrolle mit Klagebefugnis ab 120 Abgeordneten und 60 Tagen Frist
- echte Begründungen an jeder Kante (`why`)
- Kantenformen (Sättigung, Schwelle, Potenz) mit Begründung im Kommentar
- die Justizzahlen mit Quelle in den Daten

---

## 3. Wortprüfung

Schlüssel: alt → neu.

- `skala.anteil`: „{p} % des Ausgangs“ → entfällt; echte Einheit je Maßnahme (B-1). Übergangsweise: „{p} % des Stands von 2028“.
- `lernen.m.stand`: „Aktuell steht sie im Landesdurchschnitt auf Stufe {jetzt}; beim Amtsantritt war es {start}.“ → „Heute: {wert}. Beim Amtsantritt: {startwert}.“
- `lernen.m.beschlossen`: „Beschlossen ist Stufe {ziel}; die Umsetzung läuft noch.“ → „Beschlossen: {zielName}. Die Umsetzung läuft noch.“
- `protokoll.gesetz.ja`: „Das Parlament nimmt „{name}“ {ort} an ({ja} zu {nein}). Stufe {stufe}.“ → „Das Parlament nimmt das {name} an, {ja} zu {nein}. Neu gilt: {zielName}.“
- `sim/handeln.ts:619` (fest im Code): „Gesetzentwurf „…“ im ganzen Land auf Stufe 70 eingebracht. Die Abstimmung ist in 21 Tagen; nach der Annahme läuft die Umsetzung über etwa 1 Monat.“ → Katalog `gesetz.eingebracht`: „Ihre Fraktion bringt das {name} ein. Abstimmung am {datum}. Danach dauert die Umsetzung {monate, plural, one {einen Monat} other {# Monate}}.“
- `sim/handeln.ts:395`: „… sie lassen sich mit Kapital kaufen (0.5 Kapital je Stimme, sofort bezahlt; danach schuldet niemand jemandem etwas).“ → „Es fehlen etwa {n} Stimmen. Sie können sie mit Zusagen an einzelne Abgeordnete gewinnen.“
- `sim/handeln.ts:411`: „Exit-Preis: Das Zurücknehmen kostet das 1,6-Fache des Einführens — Besitzstände, Apparate und Lager wehren sich.“ → „Zurücknehmen ist teurer: {f}-mal so viel Kapital, weil die Begünstigten sich wehren.“
- `sim/handeln.ts:435`: „Dafür braucht der Präsident ein Gesetz; ein Erlass ist nur in Sicherheit und Außenbeziehungen zulässig.“ → „Das regelt nur ein Gesetz. Ein Erlass ist hier nicht erlaubt.“ (Inhalt nach B-4 neu fassen.)
- `oberflaeche2.json ui2.ui.parlament.ParlamentKopf.418c8d2`: „{p0} Sitze. Gesetze brauchen {p1} Stimmen, Verfassungsänderungen {p2} mit Volksabstimmung oder {p3} ohne.“ → „{p0} Sitze. Ein Gesetz braucht im Spiel {p1} Ja-Stimmen; eine Verfassungsänderung {p2} für die Volksabstimmung, {p3} für den direkten Beschluss.“
- `po2.steht`: „steht ({ja} von {noetig} nötig)“ → „steht: {ja} Ja, nötig {noetig}“
- `to.sichern`: „{n} Stimmen sichern ·“ → „{n} Stimmen gewinnen · {kosten} Kapital“ (die Einheit fehlt bisher)
- `to.leer`: „Keine Vorlage im Parlament. Gesetze bringen Sie in der Politik ein: an der Maßnahme, die Sie ändern wollen.“ → „Nichts zur Abstimmung. Vorlagen entstehen in der Politik: Wählen Sie eine Maßnahme und bringen Sie sie ein.“
- `vf.deltaJa`: „{n} Ja“ → „{n} Stimmen“
- `ui.politik.UmsetzungAkte.00c5907`: „Beschlüsse seit dem Amtsantritt“ mit davorgesetzter Zahl → „{n, plural, one {# Beschluss} other {# Beschlüsse}} seit dem Amtsantritt“
- `protokoll.ziele_keine`: „Ziele der Amtszeit: keine.“ → nicht als Beschluss führen (Art „ereignis“).
- `akte.b.kern.mehrheit`: „Mehrheit (mit Duldung)“ → „Ja-Stimmen sicher“
- `ui2.ui.parlament.ParlamentKopf.316c13d`: „Lager, Mehrheit steht“ → „Ihr Lager“ (die Aussage „Mehrheit steht“ gehört zur Marke 301)
- `rn.gesetzgebung`: „Gesetzgebung & parlamentarische Kontrolle“ → „Gesetzgebung und Kontrolle“ (kein „&“ im Fließtext)
- `fa.stufe`: „Stufe {n}“ → echte Einheit der Maßnahme
- `gesetz.ui.stufe`: „Stufe {von} → {nach}“ → „{vonName} → {nachName}“
- `ui2.ui.Beschlussbuch.42b4e5e`: „{p0} · Stufe {p1} · Abstimmung in {p2} Tagen ({p3})“ → „{p0} · {zielName} · Abstimmung am {p3}“
- `gesetz.v.gv_mwst.titel`: „Mehrwertsteuersenkung auf Grundbedarf“ → „Senkung des Mehrwertsteuersatzes“ (oder ein eigener Regler für den ermäßigten Satz)
- Regime „Wie heute“ (7 Schlüssel `daten.skala.*`) → benannter Zustand, siehe B-15
- `daten.skala.m_hausarzt.45.name`: „Hausarzt-Pilotprojekte“ → „Familienarzt landesweit“ (prüfen, B-43)
- `politiknetz m_unigruendungen.text`: „Universitäten in jeder Provinz.“ → „Mehr Studienplätze in den Provinzen.“
- `politiknetz m_gasspeicher` (Kante): „… und schwächen die Winter-Hooks ab.“ → „… und mildern die Folgen eines kalten Winters.“
- `politiknetz m_regas_ausbau.name`: „FSRU- und Regasifizierungs-Ausbau“ → „Schwimmende Flüssiggas-Terminals“
- `politiknetz m_sakarya_phase3.name`: „Sakarya Phase 3 (zweite FPU)“ → „Zweite Förderplattform im Schwarzen Meer“
- `politiknetz m_yeka_serie.name`: „YEKA-Ausschreibungsserie“ → „Ausschreibungen für Wind und Sonne“
- `politiknetz m_fachkraefteprogramm.text`: „… die Stufenleiter braucht Menschen, die sie bedienen.“ → „… neue Maschinen brauchen Menschen, die sie bedienen.“
- `politiknetz m_mechanisierung` (Kante landflucht): „Rentable Betriebe halten Menschen auf dem Land, doch Maschinen ersetzen auch Arbeitskräfte.“ → widerspricht der Richtung. Entweder zwei Kanten oder: „Rentable Betriebe halten Familien auf dem Land.“
- `ministerfluss.json mfl.m.stufe`: „{tun}: von {jetzt} auf {ziel}“ (ergibt „ausbauen: von …“ nach „Name:“) → „{name} {tun}: {jetzt} → {ziel}“
- `oberflaeche2.json ui2.ui.politik.VorschlagKarte.48d7c7b`: „von „{p0}“ zu „{p1}““ (verschachtelt) → „von ‚{p0}‘ zu ‚{p1}‘“
- `sim/verfassung.ts`: Variantennamen fest auf Deutsch → Katalogschlüssel `vf.v.{artikel}.{variante}`
- EN `skala.anteil`: „{p} % of the start“ → „{p} % of baseline“
- EN `pd.ampel.gelb` „watch“ / `ui2.ui.politik.Politik.fe6ddf0` „Caution“ → einheitlich „Caution“
- TR `daten.skala.m_wehrdienst.60.name`: „Bedelsiz 12 ay“ → „Bedelli olmadan 12 ay“
- TR `skala.menge.p2`: „Büyük ölçüde genişletmek“ → „Büyük ölçüde genişlet“ (ebenso alle Knopfnamen im Infinitiv)
- TR `daten.skala.m_urteilsumsetzung.80.name`: „Tüm kararları uygulamak“ → „Tüm kararlar uygulanır“
- `ui/NetView.tsx:220`: Plural über angehängtes „e“ → ICU-Plural im Katalog
- `ui/Beschlussbuch.tsx:194`: „… stimm{t|en} … {ihre|ihre} …“ → Katalogsatz „{parteien} {n, plural, one {stimmt} other {stimmen}} mit, weil das Gesetz {n, plural, one {ihre Forderung} other {ihre Forderungen}} erfüllt.“

---

## 4. Die fünf wichtigsten Verbesserungen

**1. Jeder Regler spricht eine echte Sprache (B-1, B-2, B-15, B-16).** Das hat die größte Wirkung, weil es 117 Zeilen betrifft.

```
Mindestlohn                [−] ●───────○──── [+]   28.076 ₺ netto  →  33.700 ₺ (+20 %)
                                                   Staat 0,1 % BIP · 6 Kapital · Kommission im Dezember
Mehrwertsteuer (Regelsatz) [−]  16 · 18 · [20] · 22 · 25 %  [+]
Cannabis                        verboten · [medizinisch] · entkriminalisiert · legal
```
(Cannabis ist das Beispiel des Inhabers. Unter den 117 Maßnahmen gibt es die Maßnahme noch nicht.)

- Satz: echte Halte.
- Menge: echte Größe (Lira, km, Plätze).
- Zustand: Name.
- Unter jeder Zeile steht klein und grau der Preis, auch ohne Klick.

**2. Ein Gesetz als Lebenslauf an einer Stelle (B-3, B-7, B-8, B-21).** Die Tagesordnung wird zur Werkbank. Oben steht eine Laufleiste je Vorlage:

```
Mindestlohngesetz (Kompromiss)
 Entwurf ──● Ausschuss ──○ Plenum 26.6. ──○ Präsident ──○ Gericht? ──○ Umsetzung
             Arbeit: AKP will Klausel „Zuschuss für Kleinbetriebe“  [annehmen +18 Ja] [ablehnen]
             Erwartet 312 Ja · nötig 301 · knapp
```

- Jede Stufe ist eine Entscheidung mit Preis: Klausel tauschen, Abweichler gewinnen, unterschreiben oder zurückgeben.
- Grundlage sind die vorhandenen Bausteine (`data/gesetze/`) und die Mehrheitswege der Versorgung.
- Der leere Zustand zeigt den Kalender (Mindestlohn im Dezember, Haushalt im Oktober) und drei Vorlagen „Ihre Fraktion könnte einbringen“.

**3. Die richtigen Wege der Macht (B-4, B-5, B-31).** Der Weg hängt an der Maßnahme:

```
Auf welchem Weg?   (●) Präsidialbeschluss · sofort · 9 Kapital · Gericht unwahrscheinlich
                   ( ) Gesetz · 21 Tage · 4 Kapital
```

- Mehrwertsteuer und Kraftstoffsteuer: Präsidialbeschluss in den Grenzen des Gesetzes.
- Verteidigung und Polizei: nur über den Haushalt.
- Mindestlohn: Druck auf die Kommission.
- Notstand: ausrufen, Bestätigung am selben Tag (Halbrund klappt auf), Uhr über 180 Tage, Verlängerung als neue Abstimmung.
- Vorgezogene Wahl: ein Knopf im Parlament (360).

So entsteht die eigentliche Spannung des Präsidialsystems: schnell und angreifbar gegen langsam und sicher.

**4. Stimmen haben Gesichter (B-10, B-19, B-22).** Kein anonymer Kauf mehr. Im Halbrund leuchten 10 bis 20 „wackelige“ Sitze. Ein Klick zeigt eine Karte:

```
Hasan Y., AKP, Konya: will Umgehungsstraße Konya-Süd · 3 Kapital + Zusage (Frist 90 Tage)
```

- Gebrochene Zusagen kosten Glaubwürdigkeit.
- Jeder Kauf erhöht den nächsten Preis.
- Die Presse kann Absprachen aufdecken.
- Die eigene Partei zeigt ihren Ja-Anteil statt „Dagegen: AP“.

**5. Nichts doppelt, kürzer (B-6, B-20, B-25, B-30, B-33).**
- Die doppelten Maßnahmen zusammenlegen (117 → etwa 100).
- Die Mehrheitszahl nur im Halbrund.
- Gesetze nur in der Tagesordnung.
- Justizlage nur in der Justiz.
- Auf dem Maßnahmenblatt nur der Graph mit Begründung am Mauszeiger.
- Ziel: jede Ansicht höchstens 1,5 Bildschirme. Das Maßnahmenblatt passt dann in einen Bildschirm:

```
links:  Graph (Ursachen → Maßnahme → Wirkungen, Farbe = Güte)
rechts: Ort, Stufe, Weg
```

---

## 5. Alle 117 Maßnahmen

Spalten:
- **Art:** Satz (senken/anheben), Menge (zurückfahren/ausbauen) oder Zustände (benannt). Abgeleitet aus `data/skalen.ts` (`SATZ`, `REGIME`).
- **Heute angezeigt:** der Wert, den die Zeile beim Spielstart zeigt (`stufenName` am Startwert).
- **Startgröße 2026:** nur genannt, wo sie in den Projektdaten belegt ist oder ich mir sicher bin. Sonst „recherchieren“. „Prüfen“ heißt: sehr wahrscheinlich richtig, vor Übernahme gegen die Primärquelle prüfen.
- **Kosten und Wirkung:** Prüfung von Richtung, Größe und Verlierern anhand der 609 ausgehenden Kanten (`data/politiknetz.ts`, ausgezogen in `ms2.txt`).

**Auswertung:**
- 81 Maßnahmen zeigen nur „100 % des Ausgangs“.
- 3 zeigen einen echten Satz (Mehrwertsteuer 20 %, Spitzensatz 40 %, Körperschaftsteuer 25 %), aber in unsinnigen Schritten.
- 33 zeigen benannte Zustände. Davon heißen 7 „Wie heute“, und 2 haben vermutlich einen falschen Startzustand (Hausarzt, Universitäten im Text).
- Für 73 Maßnahmen ist die echte Startgröße zu recherchieren.
- 4 Maßnahmen sind keine Regler, sondern Vorhaben oder Verhandlungen (Akkuyu, Sakarya, Preiswahrheit, Frühwarnsystem).
- Mindestens 10 Gruppen sind doppelt (B-6).

| Nr | Maßnahme (Bereich) | Art | Heute angezeigt | Richtige Einheit oder Zustände | Startgröße 2026 | Kosten und Wirkung |
|---|---|---|---|---|---|---|
| 1 | Mindestlohn (Wirtschaft) | Satz | 100 % des Ausgangs | Lira netto und brutto je Monat; Schritte als Erhöhung in % zum Vorjahr (0, 10, 20, 30, 40 %), dazu „Mindestlohn ÷ Durchschnittslohn“ als Nebenangabe | netto 28.075,50 Lira/Monat seit 1.1.2026 (tuerkei/STARTDATEN.md); brutto 33.030 Lira (Vermutung, prüfen) | Richtung plausibel, Verlierer da (Mittelstand, Junge, Schattenarbeit). Falscher Weg: wird von der Mindestlohnkommission festgesetzt (Arbeitsgesetz Art. 39), nicht per Gesetz; Kalender Dezember wirkt nicht (B-8). |
| 2 | Exportförderung (Wirtschaft) | Menge | 100 % des Ausgangs | Exportkredite der Eximbank in Mrd. Dollar je Jahr oder Fördervolumen in Mrd. Lira | recherchieren | Nur Gewinner; Verlierer fehlen (Haushalt, Wettbewerbsverzerrung, Zinslast). |
| 3 | Investitionsanreize (Wirtschaft) | Menge | 100 % des Ausgangs | Fördervolumen in Mrd. Lira je Jahr (Steuerverzicht plus Zuschüsse) | recherchieren | Plausibel; Ungleichheit +0,01 als einzige Kehrseite, kein Steuerausfall als Kante. |
| 4 | Staatliche Kreditgarantien (Wirtschaft) | Menge | 100 % des Ausgangs | Bürgschaftsrahmen des Kreditgarantiefonds in Mrd. Lira | recherchieren | Plausibel; fehlt: Ausfallrisiko im Haushalt, Inflation über Kreditboom. |
| 5 | Preiskontrollen für Lebensmittel (Wirtschaft) | Zustände | Vereinzelte Kontrollen | Zustände passen (Freie Preise … Umfassende Preisdeckel) | benannter Zustand passt | Gut gebaut: Soforteffekt klein, Schwarzmarkt, Erzeuger verlieren. |
| 6 | Tourismuswerbung (Wirtschaft) | Menge | 100 % des Ausgangs | Werbebudget in Mio. Dollar je Jahr | recherchieren | Nur Gewinner; Sättigungskurve gut. |
| 7 | Mittelstandsförderung (Wirtschaft) | Menge | 100 % des Ausgangs | Fördervolumen (KOSGEB) in Mrd. Lira je Jahr | recherchieren | Nur Gewinner bis auf das Geld. |
| 8 | Einfuhrzölle (Wirtschaft) | Satz | 100 % des Ausgangs | Durchschnittlicher Zollsatz außerhalb der Zollunion in % (oder Zusatzzoll in %) | recherchieren | Verbraucherpreise fehlen als Kante (Zölle verteuern Waren, Verlierer Arme). Real meist per Präsidialbeschluss geändert, im Spiel Gesetz. |
| 9 | Bankenaufsicht (Wirtschaft) | Zustände | Streng | Zustände passen; besser mit Kernkapitalquote je Stufe (z. B. 8/10/12/14 %) | benannter Zustand passt | Plausibel. |
| 10 | Einkommensteuer (Haushalt) | Satz | Spitzensatz 40 % | Spitzensatz in % wie jetzt, aber Schritte in ganzen Punkten (35/37/40/42/45 %) und Spanne 15–50 %; nicht 0–80 % linear | Tarif 15–40 %, Spitze 40 % (in skalen.ts belegt) | Bereich 0–80 % in 8-Punkte-Schritten ist unsinnig (B-2). Einnahmen je Punkt vermutlich zu klein. |
| 11 | Mehrwertsteuer (Haushalt) | Satz | 20 % | Regelsatz in ganzen Punkten (16/18/20/22 %); ermäßigte Sätze 1 und 10 % als eigene Zustände („Grundbedarf“) | 20 % Regelsatz (belegt), ermäßigt 10 und 1 % | Schritte 3,3 Punkte (17 %, 23 %) unsinnig; 3 Punkte kosten im Spiel 0,20 % BIP, Größenordnung vermutlich 0,8 % (B-11). Real per Präsidialbeschluss änderbar (B-4). |
| 12 | Körperschaftsteuer (Haushalt) | Satz | 25 % | Satz in ganzen Punkten (20/23/25/27/30 %) | 25 % (belegt); Banken 30 % (prüfen) | Wie MwSt: lineare Umrechnung 0–50 %; Einnahmen vermutlich zu klein. |
| 13 | Steuer auf Kraftstoff (Haushalt) | Satz | 100 % des Ausgangs | Lira je Liter Benzin und Diesel (ÖTV) | recherchieren | Plausibel; Landwirte und Pendler als Verlierer da. Real per Präsidialbeschluss, im Spiel Gesetz (B-4). |
| 14 | Steuer auf Immobilien und Vermögen (Haushalt) | Satz | 100 % des Ausgangs | Grundsteuer in Promille des Werts (Wohnung, sonstige) plus Satz der Steuer auf teure Wohnungen | Grundsteuer 1 ‰ Wohnung, 2 ‰ sonstige, in Großstädten doppelt (Grundsteuergesetz Nr. 1319 Art. 8; Werte prüfen) | Plausibel; Verlierer „Unternehmer“ für Eigentümer ist eine Notlösung. |
| 15 | Steueramnestie (Haushalt) | Zustände | Kleine Regelung | Zustände passen | benannter Zustand passt | Gut: kurzer Gewinn, lange Steuermoral-Kosten. |
| 16 | Steuerfahndung (Haushalt) | Menge | 100 % des Ausgangs | Zahl der Prüfer oder Prüfquote in % der Betriebe | recherchieren | Plausibel. |
| 17 | Privatisierung (Haushalt) | Zustände | Wenige Verkäufe | Zustände passen; dazu Erlös in Mrd. Dollar als einmaliger Betrag | benannter Zustand passt | Logikfehler: Text „nur einmal“, Modell bucht dauerhafte Einnahmen (B-13). |
| 18 | Rentenerhöhungen (Arbeit) | Menge | 100 % des Ausgangs | Erhöhung in Prozentpunkten über der Inflation je Halbjahr; dazu Mindestrente in Lira | Lücke (Mindestrente 2026 nicht gefunden, RECHERCHE_GLM_1) | Kosten 1,2 % BIP für die ganze Spanne; Rentenausgaben real ein Vielfaches (Vermutung). Exit-Preis 2,5 sinnvoll. |
| 19 | Frühverrentung (Arbeit) | Menge | 100 % des Ausgangs | Renteneintrittsalter in Jahren (Frauen/Männer) oder Zahl der Jahrgänge mit Frühverrentung | Regelalter steigt bis 65; EYT-Regel 2023 (prüfen) | Plausibel; fehlt Gewinner Arbeitnehmer kurz vor Rente. |
| 20 | Kindergeld und Familienhilfe (Arbeit) | Menge | 100 % des Ausgangs | Lira je Kind und Monat (bzw. Geburtenhilfe in Lira) | recherchieren | Plausibel. |
| 21 | Sozialhilfe (Arbeit) | Menge | 100 % des Ausgangs | Lira je Haushalt und Monat oder Zahl der Empfängerhaushalte | recherchieren | Plausibel. |
| 22 | Arbeitslosengeld (Arbeit) | Menge | 100 % des Ausgangs | Ersatzquote in % des Bruttolohns und Bezugsdauer in Tagen | 40 % des Bruttolohns, höchstens 80 % des Bruttomindestlohns, 180–300 Tage (Gesetz Nr. 4447 Art. 50; prüfen) | Plausibel. |
| 23 | Gewerkschaftsrechte (Arbeit) | Zustände | Eingeschränktes Streikrecht | Zustände passen | benannter Zustand passt | Plausibel. |
| 24 | Kinderbetreuung (Arbeit) | Menge | 100 % des Ausgangs | Plätze je 100 Kinder unter 6 Jahren | recherchieren | Nur Gewinner. |
| 25 | Berufsausbildungsprogramme (Arbeit) | Menge | 100 % des Ausgangs | Teilnehmer je Jahr (İŞKUR-Kurse) | recherchieren | Dreifach mit Berufsschulen und Fachkräfteprogramm (B-6). |
| 26 | Krankenhausbau (Gesundheit) | Menge | 100 % des Ausgangs | Betten je 1.000 Einwohner oder neue Betten je Jahr | recherchieren | Doppelt mit Medizintechnik (B-6). |
| 27 | Gehälter im Gesundheitswesen (Gesundheit) | Menge | 100 % des Ausgangs | Einstiegsgehalt Arzt/Pflege in Lira brutto je Monat | recherchieren | Kosten vermutlich zu klein. |
| 28 | Hausarztsystem (Gesundheit) | Zustände | Hausarzt-Pilotprojekte | Zustände passen; heute besteht das Familienarztsystem landesweit seit 2010 (prüfen) – „Pilotprojekte“ als heutiger Stand ist vermutlich falsch | Familienarztsystem landesweit (Vermutung, prüfen) | Heutiger Zustand vermutlich falsch benannt. |
| 29 | Zuzahlungen der Patienten (Gesundheit) | Satz | 100 % des Ausgangs | Lira je Arztbesuch und % bei Medikamenten | recherchieren | Plausibel. |
| 30 | Lehrergehälter (Bildung) | Menge | 100 % des Ausgangs | Einstiegsgehalt Lehrkraft in Lira netto je Monat | recherchieren | „180 % des Ausgangs“ (+80 % Gehalt) kostet 0,32 % BIP; Größenordnung vermutlich zu klein (B-11). |
| 31 | Schulbau (Bildung) | Menge | 100 % des Ausgangs | Neue Klassenräume je Jahr oder Schüler je Klasse | recherchieren | Plausibel. |
| 32 | Religiöse Schulen (İmam-Hatip) (Bildung) | Zustände | Wie heute | Anteil der İmam-Hatip-Schüler an allen Schülern in %; Zustände dazu | recherchieren | „Wie heute“ als Stufenname (B-15). |
| 33 | Berufsschulen (Bildung) | Menge | 100 % des Ausgangs | Schüler in Berufsschulen in % oder Plätze | recherchieren | Doppelt (B-6). |
| 34 | Neue Universitäten (Bildung) | Menge | 100 % des Ausgangs | Zahl der staatlichen Universitäten | jede Provinz hat seit etwa 2008 eine Universität (Vermutung, prüfen); Text „Universitäten in jeder Provinz“ ist also erreicht | Text veraltet; als Ausbau sinnlos, eher „Studienplätze“. |
| 35 | Stipendien (Bildung) | Menge | 100 % des Ausgangs | Stipendiaten je Jahr oder Lira je Monat (KYK) | recherchieren | Plausibel. |
| 36 | Forschungsförderung (Bildung) | Menge | 100 % des Ausgangs | FuE-Ausgaben in % des BIP | recherchieren | Nur Gewinner. |
| 37 | Wissenschaftsfreiheit (Bildung) | Zustände | Teilweise autonom | Zustände passen | benannter Zustand passt | Plausibel, Verlierer da. |
| 38 | Autobahn- und Brückenbau (Infrastruktur) | Menge | 100 % des Ausgangs | Neue Autobahn-Kilometer je Jahr | recherchieren | Plausibel; Umweltkosten da. |
| 39 | Garantien für Betreiberprojekte (Infrastruktur) | Menge | 100 % des Ausgangs | Garantiezahlungen in Mrd. Dollar je Jahr | recherchieren | Plausibel, gut mit verdeckter Schuld. |
| 40 | Bahnausbau (Infrastruktur) | Menge | 100 % des Ausgangs | Neue Schnellbahn-Kilometer je Jahr | recherchieren | Nur Gewinner bis auf Geld. |
| 41 | Nahverkehr (Infrastruktur) | Menge | 100 % des Ausgangs | Neue Schienen-Kilometer in Städten je Jahr | recherchieren | Nur Gewinner. |
| 42 | Breitbandausbau (Infrastruktur) | Menge | 100 % des Ausgangs | Glasfaser-Haushalte in % | recherchieren | Nur Gewinner. |
| 43 | Regionalförderung (Infrastruktur) | Menge | 100 % des Ausgangs | Fördervolumen in Mrd. Lira je Jahr | recherchieren | Plausibel. |
| 44 | Energiesubventionen (Energie) | Zustände | Preisdeckel für alle | Zustände passen; dazu Anteil des Endpreises, den der Staat trägt | benannter Zustand passt (prüfen) | Gegenregler zu Preiswahrheit (B-6). |
| 45 | Ausbau von Sonne und Wind (Energie) | Menge | 100 % des Ausgangs | Zubau in Gigawatt je Jahr | recherchieren | Doppelt mit YEKA-Serie (B-6). |
| 46 | Kernkraft (Energie) | Zustände | Das erste Kraftwerk | Zustände passen; Leistung in Megawatt | Akkuyu 4 × 1.200 MW im Bau/Anlauf (prüfen) | Umsetzung 48 Monate für ein neues Kraftwerk vermutlich viel zu kurz; „Kein weiterer Reaktor“ und „Das erste Kraftwerk“ sagen fast dasselbe. |
| 47 | Heimische Gasförderung (Energie) | Menge | 100 % des Ausgangs | Förderung in Mio. m³ je Tag | recherchieren | Doppelt mit Sakarya Phase 3 (B-6). |
| 48 | Umweltauflagen (Energie) | Zustände | Basisgrenzwerte | Zustände passen | benannter Zustand passt | Plausibel. |
| 49 | CO₂-Preis (Energie) | Zustände | Symbolischer Preis | Zustände passen; dazu Preis in Euro je Tonne | Klimagesetz 2025 mit Emissionshandel im Aufbau (prüfen) | Plausibel; Exportkante +0,01 erklärt sich nur über den EU-Grenzausgleich. |
| 50 | Stromnetzausbau (Energie) | Menge | 100 % des Ausgangs | Investitionen in Mrd. Dollar oder Kilometer Leitung | recherchieren | Doppelt mit Netzmodernisierung (B-6). |
| 51 | LNG-Langzeitverträge (Energie) | Menge | 100 % des Ausgangs | Zusätzliche Vertragsmenge in Mrd. m³ je Jahr (Text nennt 2–4) | recherchieren | Gute Abwägung (teurer, aber sicherer). |
| 52 | FSRU- und Regasifizierungs-Ausbau (Energie) | Menge | 100 % des Ausgangs | Anlandekapazität in Mio. m³ je Tag | recherchieren | Nur Gewinner. |
| 53 | Gasspeicher-Ausbau (Energie) | Menge | 100 % des Ausgangs | Speicherkapazität in Mrd. m³ (Ziel 14,4 im Text) | recherchieren | Jargon „Winter-Hooks“ in der Begründung (B-40). |
| 54 | YEKA-Ausschreibungsserie (Energie) | Menge | 100 % des Ausgangs | Ausgeschriebene Gigawatt je Jahr (Text: mindestens 2) | recherchieren | Doppelt mit Sonne und Wind (B-6). |
| 55 | Sakarya Phase 3 (zweite FPU) (Energie) | Menge | 100 % des Ausgangs | Zustände: nicht begonnen / im Bau / in Betrieb; Förderung in Mio. m³ je Tag | recherchieren | Ein Projekt, kein Mengenregler. |
| 56 | Akkuyu-Vertrag nachverhandeln (Energie) | Menge | 100 % des Ausgangs | Zustände: Vertrag halten / Nachverhandlung anbieten / Nachverhandlung erzwingen; Preis in US-Cent je kWh | 12,35 US-Cent je kWh (im Text) | Als Mengenregler sinnlos (B-16). |
| 57 | Heimische Kohle (Afşin-Elbistan) (Energie) | Menge | 100 % des Ausgangs | Zugebaute Leistung in Megawatt (Text: +688 MW) | recherchieren | Gute Abwägung. |
| 58 | Effizienz, Wärmepumpen, E-Mobilität (Energie) | Menge | 100 % des Ausgangs | Fördervolumen in Mrd. Lira oder Zahl geförderter Wärmepumpen/E-Autos | recherchieren | Nur Gewinner. |
| 59 | Preiswahrheit bei Energie (Energie) | Menge | 100 % des Ausgangs | Zustände: Deckel für alle / Staffeltarif / Marktpreis mit Sozialtarif – gehört in den Regler Energiesubventionen | — | Doppelregler (B-6). |
| 60 | Gas-Hub und Transit-Ausbau (Energie) | Menge | 100 % des Ausgangs | Transitkapazität in Mrd. m³ je Jahr | recherchieren | Gute Abwägung (Russland-Bindung). |
| 61 | Agrarsubventionen (Landwirtschaft) | Menge | 100 % des Ausgangs | Lira je Dekar oder Gesamtvolumen in Mrd. Lira | recherchieren | Plausibel. |
| 62 | Moderne Bewässerung (Landwirtschaft) | Menge | 100 % des Ausgangs | Bewässerte Fläche mit Tropf/Beregnung in % | recherchieren | Doppelt mit Agrarforschung (Tropfbewässerung). |
| 63 | Staudämme und Speicher (Landwirtschaft) | Menge | 100 % des Ausgangs | Speichervolumen oder Zahl der Talsperren im Bau | recherchieren | Plausibel. |
| 64 | Wasserleitungen und Kläranlagen (Landwirtschaft) | Menge | 100 % des Ausgangs | Leitungsverluste in % oder Anschlussgrad Kläranlage in % | recherchieren | Plausibel. |
| 65 | Saatgut- und Erzeugerprogramme (Landwirtschaft) | Menge | 100 % des Ausgangs | Fördervolumen oder Anteil zertifizierten Saatguts in % | recherchieren | Doppelt mit Agrarforschung. |
| 66 | Landwirtschaftliche Mechanisierung (Landwirtschaft) | Menge | 100 % des Ausgangs | Traktoren je 1.000 ha oder Fördervolumen | recherchieren | Begründung widerspricht der Richtung (Landflucht sinkt, „doch Maschinen ersetzen Arbeitskräfte“). |
| 67 | Agrarforschung und Hochtechnologie (Landwirtschaft) | Menge | 100 % des Ausgangs | Forschungsausgaben in Mio. Lira | recherchieren | Überschneidet Saatgut und Bewässerung. |
| 68 | Industrielle Modernisierung (Wirtschaft) | Menge | 100 % des Ausgangs | Fördervolumen in Mrd. Lira je Jahr | recherchieren | Gute Abwägung (Jobs fallen weg). |
| 69 | Digitale Verwaltung und Steuertechnik (Haushalt) | Menge | 100 % des Ausgangs | Zustände: Papier / teilweise digital / E-Rechnung Pflicht / vollständig vernetzt | recherchieren | Text selbst beschreibt Stufen („von Papierakten zu vernetzten Verfahren“). |
| 70 | Fachkräfte und Weiterbildung (Arbeit) | Menge | 100 % des Ausgangs | Teilnehmer je Jahr | recherchieren | Dreifach (B-6). |
| 71 | Bildungstechnik und digitales Lernen (Bildung) | Menge | 100 % des Ausgangs | Ausgaben je Schüler in Lira oder Geräte je Schüler | recherchieren | Nur Gewinner. |
| 72 | Medizintechnik und Krankenhausmodernisierung (Gesundheit) | Menge | 100 % des Ausgangs | Investitionen in Mrd. Lira je Jahr | recherchieren | Doppelt mit Krankenhausbau. |
| 73 | Intelligente Infrastruktur (Infrastruktur) | Menge | 100 % des Ausgangs | Investitionen in Mrd. Lira je Jahr | recherchieren | Nur Gewinner. |
| 74 | Netzmodernisierung und Speicher (Energie) | Menge | 100 % des Ausgangs | Batteriespeicher in Gigawatt | recherchieren | Doppelt mit Stromnetzausbau. |
| 75 | Industrieller Wohnungsbau (Wohnen) | Menge | 100 % des Ausgangs | Fertigteil-Wohnungen je Jahr | recherchieren | Nur Gewinner (Kosten Mieten −, Qualität +). |
| 76 | Moderne Sicherheitsverwaltung (Sicherheit) | Menge | 100 % des Ausgangs | Ausgaben in Mrd. Lira je Jahr | recherchieren | Doppelt mit Polizei. |
| 77 | Digitale Öffentlichkeit und Beteiligung (Gesellschaft) | Menge | 100 % des Ausgangs | Zustände: keine / Portal / Beteiligung mit Antwortpflicht | recherchieren | Plausibel. |
| 78 | Moderne Zoll- und Handelssysteme (Außen) | Menge | 100 % des Ausgangs | Abfertigungszeit in Stunden | recherchieren | Nur Gewinner. |
| 79 | Staatlicher Wohnungsbau (Wohnen) | Menge | 100 % des Ausgangs | TOKİ-Wohnungen je Jahr | recherchieren | Plausibel. |
| 80 | Mietpreisbremse (Wohnen) | Zustände | Milde Begrenzung | Zustände passen | Erhöhung höchstens 12-Monats-Mittel der Verbraucherpreise (Obligationengesetz Art. 344; Deckel 25 % lief Juli 2024 aus; prüfen) | „Milde Begrenzung“ trifft den heutigen Stand. |
| 81 | Erdbebensichere Stadterneuerung (Wohnen) | Menge | 100 % des Ausgangs | Ersetzte Wohnungen je Jahr | recherchieren | Plausibel. |
| 82 | Bauaufsicht (Wohnen) | Zustände | Stichproben | Zustände passen | benannter Zustand passt | Plausibel. |
| 83 | Günstige Baukredite (Wohnen) | Menge | 100 % des Ausgangs | Zinsvorteil in Prozentpunkten oder Kreditvolumen | recherchieren | Plausibel. |
| 84 | Bauamnestie (Wohnen) | Zustände | Kleine Einzelfälle | Zustände passen | benannter Zustand passt | Gut: kurzer Gewinn, langer Schaden. |
| 85 | Gebäude-Verstärkungsprogramm (Wohnen) | Menge | 100 % des Ausgangs | Ertüchtigte Gebäude je Jahr | recherchieren | Nur Gewinner bis auf Geld. |
| 86 | Katastrophen-Pflichtversicherung (Wohnen) | Menge | 100 % des Ausgangs | Versicherungsquote der Gebäude in % | recherchieren | Plausibel. |
| 87 | Frühwarnsystem (Sicherheit) | Menge | 100 % des Ausgangs | Zustände: keine / Beben-Warnung / Beben und Flut auf allen Telefonen | recherchieren | Nur Gewinner. |
| 88 | Ausbau der Katastrophenbehörde (AFAD) (Sicherheit) | Menge | 100 % des Ausgangs | Personal der AFAD oder Stützpunkte | recherchieren | Nur Gewinner. |
| 89 | Polizei und Gendarmerie (Sicherheit) | Menge | 100 % des Ausgangs | Personal von Polizei und Gendarmerie (Köpfe) oder je 100.000 Einwohner | recherchieren | Per Erlass möglich, obwohl es Haushaltsgeld ist (B-4). |
| 90 | Justizreform (Recht) | Zustände | Langsam und abhängig | Zustände; die Stufen „Mehr Richter“ und „Unabhängige Ernennungen“ gehören zu den Reglern Richterstellen und Richterrat | benannter Zustand passt | Überschneidung (B-6). |
| 91 | Korruptionsbekämpfung (Recht) | Zustände | Nur Einzelverfahren | Zustände passen | benannter Zustand passt | Gut: erst mehr Skandale. |
| 92 | Friedensprozess (Sicherheit) | Zustände | Gespräche im Gang | Zustände passen | Gesetz vom 10.8.2026 (tuerkei/STARTDATEN.md) – „Gespräche im Gang“ passt | Plausibel. |
| 93 | Verteidigungsausgaben (Streitkräfte) | Menge | 100 % des Ausgangs | Ausgaben in % des BIP (wie NATO-Ziel) und in Mrd. Lira | 1.202 Mrd. Lira Haushalt 2026; 1,9 % des BIP 2025 (RECHERCHE_REALWELT_TUERKEI_2026.md) | Ganze Spanne kostet 1 % BIP, real liegt schon der Startwert bei 1,9 % (B-11). Per Erlass statt Haushaltsgesetz (B-4). |
| 94 | Heimische Rüstungsindustrie (Streitkräfte) | Menge | 100 % des Ausgangs | Fördervolumen oder Exportumsatz in Mrd. Dollar | recherchieren | Plausibel. |
| 95 | Medienaufsicht (Gesellschaft) | Zustände | Strenge Aufsicht mit Strafen | Zustände passen | benannter Zustand passt | Gut mit Verlierern. |
| 96 | Internetsperren (Gesellschaft) | Zustände | Umfangreiche Sperren und Drosselung | Zustände passen | benannter Zustand passt | Gut. |
| 97 | Staatliche Medien und Werbung (Gesellschaft) | Zustände | Große Staatssender | Zustände passen | benannter Zustand passt | Plausibel. |
| 98 | Budget der Religionsbehörde (Gesellschaft) | Menge | 100 % des Ausgangs | Haushalt der Religionsbehörde in Mrd. Lira | recherchieren | Plausibel. |
| 99 | Schutz vor Gewalt gegen Frauen (Gesellschaft) | Zustände | Lückenhaft | Zustände passen | benannter Zustand passt | Plausibel. |
| 100 | Versammlungsfreiheit (Gesellschaft) | Zustände | Eingeschränkt | Zustände passen | benannter Zustand passt | Gut. |
| 101 | Rückkehrprogramm für Geflüchtete (Außen) | Zustände | Freiwillige Anreize | Zustände passen; dazu Rückkehrer je Jahr | recherchieren | Plausibel. |
| 102 | Integration von Geflüchteten (Außen) | Zustände | Grundangebote | Zustände passen | benannter Zustand passt | Plausibel. |
| 103 | Grenzschutz (Außen) | Zustände | Mauer und Patrouillen | Zustände passen | benannter Zustand passt | Per Erlass möglich, obwohl Mauer und Personal Haushaltsgeld sind. |
| 104 | Annäherung an die EU (Außen) | Zustände | Distanzierte Zusammenarbeit | Zustände passen | benannter Zustand passt | „Wo soll es gelten?“ mit Provinzwahl ist hier sinnlos (B-27). |
| 105 | Richter- und Staatsanwaltsstellen (Recht) | Menge | 100 % des Ausgangs | Richter und Staatsanwälte je 100.000 Einwohner (heute 17, Europa 22 laut Knotentext) | 17 je 100.000 (netzknoten.json justiz_kapazitaet) | Gut; die Zahl steht schon im Text, der Regler zeigt sie nicht. |
| 106 | Besetzung des Richterrats (Recht) | Zustände | Wie heute | Zustände passen | benannter Zustand passt (Verfassung Art. 159) | „Wie heute“ als Name (B-15); Preis für den Präsidenten (weniger Durchgriff, Gerichte kippen Erlasse) nur indirekt. |
| 107 | Haftvermeidung und Bewährung (Recht) | Menge | 100 % des Ausgangs | Untersuchungshäftlinge in % der Häftlinge (Text Knoten: 65.227 von 433.520) | rund 15 % in U-Haft (aus recht.ts errechnet) | Gut. |
| 108 | Ausnahmezustand und Sonderbefugnisse (Recht) | Zustände | Wie heute | Zustände passen; die Stufe „Ausnahmezustand“ braucht Dauer in Monaten und Verlängerung | kein Ausnahmezustand seit Juli 2018 (prüfen) | Versprochene Frist fehlt in der Simulation (B-5); falscher Weg (B-4). |
| 109 | Umsetzung von Gerichtsurteilen aus Straßburg und Ankara (Recht) | Zustände | Wie heute | Zustände passen; dazu offene Straßburger Urteile (Zahl) | recherchieren | Doppelt mit dem Justiz-Vorhaben „Kavala“. |
| 110 | Denkmalschutz und Restaurierung (Kultur) | Menge | 100 % des Ausgangs | Haushalt in Mio. Lira oder restaurierte Stätten je Jahr | recherchieren | Plausibel. |
| 111 | Kunst- und Kulturförderung (Kultur) | Menge | 100 % des Ausgangs | Haushalt in Mio. Lira | recherchieren | Plausibel. |
| 112 | Ausgrabungen und Museen (Kultur) | Menge | 100 % des Ausgangs | Grabungsgenehmigungen je Jahr (oder Haushalt) | recherchieren | Nur Gewinner. |
| 113 | Rechte religiöser und sprachlicher Minderheiten (Kultur) | Zustände | Wie heute | Zustände passen | benannter Zustand passt | Gut mit Verlierern. |
| 114 | Wehrdienst (Streitkräfte) | Zustände | Wie heute: 6 Monate mit Freikauf | Zustände passen (Monate genannt) | 6 Monate, Freikauf möglich (Gesetz Nr. 7179, prüfen) | Gut; TR-Fassung „Bedelsiz 12 ay“ falsch (B-39). |
| 115 | Ausbildung und Übungen (Streitkräfte) | Menge | 100 % des Ausgangs | Flugstunden je Pilot und Jahr / Seetage | recherchieren | Nur Gewinner. |
| 116 | Beförderung im Obersten Militärrat (Streitkräfte) | Zustände | Wie heute | Zustände passen | benannter Zustand passt | Nur Gewinner: Wer nach Leistung befördert, verliert nichts (B-14). |
| 117 | Instandhaltung der Infrastruktur (Infrastruktur) | Menge | 100 % des Ausgangs | Ausgaben in % des Anlagewerts oder Mrd. Lira | recherchieren | Plausibel. |

---

## 6. Nicht geprüft

- **Abstimmungskarte im Halbrund** (`ui/parlament/AbstimmungsKarte.tsx`): Im kopflosen Lauf erschien sie nicht. Die Zeit sprang mit dem schnellsten Tempo bis Dezember 2030, ohne dass ich die Karte fassen konnte. Nur der Code wurde gelesen.
- **Erlass bis zum Spruch des Verfassungsgerichts** (120 Tage) und **Volksabstimmung der Verfassung**: nicht durchgespielt, nur der Code (`sim/gesetzgebung.ts:369–388`, `sim/verfassung.ts`).
- **NetNavigator und NetGraph im freien Wirkungsnetz** mit Suche und Filtern: nur im Bild 005 gesehen, nicht geklickt.
- **Die Synergieregel „gegen“** (`uni_lehrer`: wirkt sie auch, wenn die Universitäten sinken und die Gehälter steigen?): nicht nachgewiesen, deshalb kein Befund.
- **Kostenangaben in Abschnitt B-11:** Größenordnungen sind meine Schätzung, nicht nachgerechnet.
- **Startgrößen 2026:** Primärquellen (Amtsblatt, TÜİK, mevzuat.gov.tr) waren nicht abrufbar. Wo „prüfen“ steht, beruht die Angabe auf meinem Wissen bis Mitte 2026 oder auf den Projektdateien.
- **Englisch und Türkisch:** nur stichprobenweise (alle Schlüssel des Bereichs vorhanden, rund 40 Texte gelesen).
- **Bilder 003 bis 011:** nur die erste Bildschirmhöhe liegt vor. Längere Seiten habe ich selbst abgefahren; Rest geschätzt.
