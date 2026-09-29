# NWO — Das Weltmodell: alle Faktoren, sofortige Folgenrechnung

Stand: 29. September 2026. Das Fundament unter allen anderen Dokumenten. Ergänzung zu [Projektplan](PROJEKTPLAN.md) (Abschnitt 17: Technisches Grundmodell), [AGENDA.md](AGENDA.md), [GROSSPROJEKTE.md](GROSSPROJEKTE.md) und [Entscheidungen](ENTSCHEIDUNGEN.md).

## 1. Warum KI im Spiel ist

Man kann sich nicht auf jedes Szenario vorbereiten. Man kann aber **alle Faktoren** erfassen. Genau deshalb ist KI eingebaut — nicht, um die Welt zu simulieren, sondern um **jede** Absicht des Spielers auf ein vollständiges Faktorenmodell abzubilden:

- Der Spieler führt Projekte aus: „Bau eines Riesenprojekts", „Wiederaufbau des Rechtsstaates", was auch immer.
- Die KI versteht die Absicht und übersetzt sie in Modelloperationen.
- Die Simulation rechnet die Folgen **sofort** durch — Richtung, Bandbreite, Gewinner, Verlierer.

Die KI erfindet nichts ([Leitprinzip 13](PROJEKTPLAN.md#2-leitprinzipien)). Die Faktoren sind recherchiert und belegt. Die Rechnung ist die Simulation.

## 2. Der Dreisatz der Architektur

| Pfeiler | Was er leistet | Wo er definiert ist |
|---|---|---|
| **1. Alle Faktoren** | Die Welt ist vollständig modelliert — Wirtschaft, Politik, Gesellschaft, Recht, Sicherheit, Ressourcen, Außenpolitik, Regionen, Zeit | Abschnitt 3 dieses Dokuments; die Rechercheberichte |
| **2. KI übersetzt** | Jede Eingabe — Agenda, Anweisung, Projekt, Frage — wird in strukturierte Modelloperationen übersetzt oder ehrlich als unmöglich erklärt | [SPIELDESIGN §6](SPIELDESIGN.md#6-vom-satz-zum-staatsvorgang), [AGENDA §3](AGENDA.md#3-das-universum-der-eingaben-jede-eingabe-ist-gültig) |
| **3. Simulation rechnet** | Sofortige Folgen-Vorschau mit Bandbreiten; der tatsächliche Verlauf entsteht aus Regeln, Akteuren und Zufall | Abschnitt 4 dieses Dokuments |

**Der Spieler muss nicht wissen, welche Szenarien kommen.** Er muss nur wissen, was er will. Die Faktoren sind alle da — Szenarien entstehen aus ihnen ([SZENARIEN.md](SZENARIEN.md) sind Vorlagen, kein Drehbuch).

## 3. Der Faktorenkatalog (Vollständigkeitsprinzip)

**Regel: Ein Faktor, der in der Realität zählt, zählt im Modell.** Fehlende Daten werden als Lücke markiert, nicht ignoriert. Die Recherche hat die Faktoren belegt (Stand 2025/26, Quellen in den Berichten):

| Faktordomain | Enthält | Definiert in |
|---|---|---|
| **Wirtschaft** | Z1–Z11 (Zins, Inflation, Erwartungen, Währung, Wachstum, Arbeitslosigkeit, Haushalt, Schulden, Risikoaufschlag, Verteilung, gefühlte Lage), Rohstoffpreise, Energie, Handel | [WIRTSCHAFTSMODELL.md](WIRTSCHAFTSMODELL.md), [RECHERCHE_WELTDATEN.md](RECHERCHE_WELTDATEN.md) |
| **Staat und Haushalt** | Steuern, Ausgaben, Defizit, Zinslast, Investitionen, Verwaltungskapazität | [WIRTSCHAFTSMODELL.md](WIRTSCHAFTSMODELL.md), [INNENPOLITIK.md](INNENPOLITIK.md) |
| **Innenpolitik** | Zwölf Felder: Arbeit, Steuern, Bildung, Gesundheit, Sicherheit/Justiz, Drogen, Wohnen, Umwelt/Energie, Landwirtschaft, Migration, Medien, Katastrophenschutz | [INNENPOLITIK.md](INNENPOLITIK.md) |
| **Gesellschaft** | Demografie (86,1 Mio., Fertilität 1,42), Migration (2,26 Mio.), Medien (RSF 163/180), sieben Wählergruppen, Vertrauen, Protest | [INNENPOLITIK.md](INNENPOLITIK.md), [RECHERCHE_INNENPOLITIK.md](RECHERCHE_INNENPOLITIK.md) |
| **Rechtsstaat** | Justiz-Unabhängigkeit, Verfahrensdauern, EGMR-Compliance, Korruption (CPI 31/100), Verfassungsgericht, HSK, Gefängnisse (434.681) | [RECHERCHE_WELTDATEN.md](RECHERCHE_WELTDATEN.md), [INNENPOLITIK.md](INNENPOLITIK.md) |
| **Sicherheit** | Kriminalität, Drogen (311.793 Ereignisse), Terrorismus (GTI 36), Polizei, Grenzen | [INNENPOLITIK.md](INNENPOLITIK.md) |
| **Ressourcen** | Rohstoffe (Bor, Chrom, Gold, Kohle), Wasser (1.300–1.500 m³/Kopf), Energie (93 % Öl-Import), Land, Nahrung | [RECHERCHE_WELTDATEN.md](RECHERCHE_WELTDATEN.md) |
| **Außenpolitik** | Beziehungs-Matrix (10 Partner × 4 Dimensionen), Verträge, Bündnisse (NATO), Militär (481k), Rüstung, Mediation, Diaspora | [AUSSENPOLITIK.md](AUSSENPOLITIK.md) |
| **Institutionen** | Befugnisse (Präsidialsystem), Verfahren, Mehrheiten, regionale Ebenen (81 Provinzen), MB-Unabhängigkeit | [LAENDERPAKET_TUERKEI.md](LAENDERPAKET_TUERKEI.md), [Projektplan §6](PROJEKTPLAN.md#6-institutionen-und-staatliche-umsetzung) |
| **Zeit und Erinnerung** | Ereignisse, Zusagen, Kränkungen, politische Vorgeschichte, Verlauf mit Verzögerungen | [SPIELDESIGN §0/3](SPIELDESIGN.md), [AGENDA.md](AGENDA.md) |

## 4. Die sofortige Folgenrechnung (Folgen-Vorschau)

Sobald der Spieler **zielgerichtet auf etwas hinarbeitet** — Agenda gesetzt, Projekt gestartet, Maßnahme eingeleitet —, zeigt das Spiel sofort eine **Folgen-Vorschau**:

- **Richtung und Bandbreite:** „Die Inflation sinkt geschätzt um 2–6 Punkte, Wirkung in 6–18 Monaten, Unsicherheit hoch." Keine Punktschätzung als Gewissheit — die Entscheidung „Folgen im Voraus: Richtung und Bandbreite mit Unsicherheit" ([ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md)) ist hier umgesetzt.
- **Gewinner und Verlierer:** welche Wählergruppen, Branchen, Regionen profitieren oder leiden.
- **Konflikte:** was mit anderen Agenden, dem Haushalt, Verträgen kollidiert.
- **Zeitprofile:** was sofort reagiert (Märkte, Erwartungen), was Monate dauert (Umsetzung), was Jahre braucht (Institutionen, Demografie).
- **Quellen:** jede Zahl ist anklickbar („Warum?") — Faktor, Parameter, Beleg.

**Drei Ehrlichkeitsregeln:**

1. **Vorschau ≠ Versprechen.** Der tatsächliche Verlauf entsteht aus der Simulation — Ereignisse, Akteure, Zufall können abweichen. Die Abweichung wird erklärt, nicht versteckt.
2. **Vorschau = dieselben Regeln.** Die Projektion rechnet mit denselben Parametern wie die laufende Simulation. Keine zweite Wahrheit.
3. **Vorschau aktualisiert sich.** Jede Entscheidung, jeder neue Faktorstand lässt die Vorschau neu rechnen.

## 5. Beispiel 1: „Wiederaufbau des Rechtsstaates"

Ein Ziel, das keinen Knopf hat — und genau deshalb die KI braucht. Der Spieler arbeitet zielgerichtet darauf hin; das Spiel rechnet sofort durch:

**Faktorziele** (aus dem Faktorenkatalog): Justiz-Unabhängigkeit ↑, Verfahrensdauern ↓, EGMR-Compliance ↑ (die Türkei stellt 34,5 % aller anhängigen EGMR-Verfahren), Korruption ↓ (CPI 31/100 → höher), WJP-Score ↑ (0,41 → höher).

**Sofortige Vorschau ab Tag 1:**

| Horizont | Was das Spiel prognostiziert (mit Bandbreite) |
|---|---|
| Sofort (Tage) | Vorsichtiger positiver Vertrauensschub (Märkte, ausländische Presse); Widerstand in der eigenen Machtbasis; Medienkampagne gegen „nachgebende Justiz" |
| Monate | Verfahrensdauern sinken erst mit Personal und Digitalisierung; EGMR-Verfahren nehmen langsam ab; Parlamentskonflikte um HSK-Reform und Richterernennungen |
| Jahre | WJP/CPI verbessern sich schrittweise; Investitionsklima und EU-Beziehungen reagieren; institutionelle Reformen überstehen den Amtsinhaber |

**Die Härte:** Dieses Ziel **kostet den Spieler Macht** — Justiz-Unabhängigkeit schränkt die eigene Handlungsfreiheit ein (Klasse C in [AGENDA §3](AGENDA.md#3-das-universum-der-eingaben-jede-eingabe-ist-gültig)). Das Spiel zeigt den Preis ehrlich: Wer den Rechtsstaat wiederaufbaut, baut sich selber Zäune. Genau das macht es zu einem echten Ziel.

## 6. Beispiel 2: „Bau eines Riesenprojekts"

Vollständig durchgerechnet in [GROSSPROJEKTE.md](GROSSPROJEKTE.md) — gleiche Logik: Sofort-Vorschau mit Zweitrundeneffekten (das Hafen-Beispiel: Nachbarstädte und -länder nehmen ab), dann der tatsächliche Verlauf mit Kostenüberschreitung und Verkehrsillusion. Grenzüberschreitende Projekte (Bagdadbahn-Fall) werden zur **Verhandlungsserie** mit jedem Land auf der Strecke — die Sofort-Rechnung zeigt, wer am Tisch sitzt, was jeder will, und was ein Nein kostet.

## 7. Was vorgegeben ist — und was beim Spielen entsteht

Die Grundsatzfrage: Wird jedes Szenario beim Spielen berechnet, oder ist alles vorgegeben? **Die Antwort des Designs: Die Faktoren sind vorgegeben, die Szenarien entstehen. Alles wird während des Spiels live berechnet.**

| Vorgegeben (gebaut, recherchiert, getestet) | Entsteht beim Spielen (berechnet, nicht geschrieben) |
|---|---|
| Faktoren und ihre Beziehungen (Z1–Z11, Politikfelder, Ressourcen, Beziehungen) | Jeder konkrete Verlauf jeder Partie |
| Akteure mit Eigenschaften (Sturheit, Ziele, Geheimnisse, Regime-Logik) | Wer wann worauf reagiert |
| Regeln und Verfahren (Institutionen, Verträge, Budgets) | Krisen, Affären, Regimewechsel, Wahlergebnisse |
| Ereignisvorlagen als Musterbibliothek (Qualitätsgerüst) | Welche Vorlage zuschlägt — oder keine |
| Parameter und Bandbreiten (Kalibrierung) | Die tatsächlichen Zahlen dieser Partie |

**Warum nicht alles vorgeben?** Weil vorgegebene Szenarien ein Buch mit Entscheidungen wären — und weil sich niemand auf jedes Szenario vorbereiten kann (Abschnitt 1). Die KI plus Faktorenvollständigkeit ist genau die Antwort: Jede Situation, auch die nie dagewesene — eine sture Regierung, ein Regimewechsel-Warten, Hilfe für Rebellen, ein Korridor über fünf Länder — wird **live aus denselben Faktoren gerechnet**. Jeder Tag läuft die Simulation neu, jede Entscheidung rechnet die Projektion neu.

**Was die Vorlagen sind:** Kein Drehbuch, sondern Werkzeug — bewährte Muster (Erdbeben, Währungskrise, Mediation, Bagdadbahn) mit geprüften Abläufen, damit Qualität und Tempo stimmen. Sie werden von Bedingungen ausgelöst, nie erzwungen, nie vollständig.

## 8. Warum das „sofort" fair ist

- **Keine KI-Zahlen.** Die Vorschau kommt aus dem Faktorenmodell, nicht aus dem Sprachmodell.
- **Keine falsche Präzision.** Bandbreiten, Unsicherheit, „weiß nicht" — die Mentorin sagt „Das steht nicht in den Akten" statt zu raten.
- **Kein zweites Spiel.** Projektion, Verlauf und Nachbesprechung nutzen dieselben Faktoren — jede Zahl beantwortet „Warum?" mit Faktor und Beleg.
- **Beliebigkeit ist die Stärke.** Weil alle Faktoren da sind, kann jeder beliebige Ziel-Vektor durchgerechnet werden — vom Riesenprojekt bis zum Rechtsstaat, von der WM 2034 bis zum Mars.

## 9. Prüfkriterien

- Für jedes Ziel aus den acht Antwortklassen ([AGENDA §3](AGENDA.md#3-das-universum-der-eingaben-jede-eingabe-ist-gültig)) erscheint sofort eine Vorschau oder eine ehrliche Unmöglichkeit.
- Keine Vorschau ohne Faktorbezug (jede Zahl ist anklickbar und zeigt Parameter + Quelle).
- Vorschau und tatsächlicher Verlauf dürfen abweichen — das Spiel zeigt beide und erklärt die Differenz.
- Der 50-Anweisungen-Testkatalog ([Entwicklungsplan](ENTWICKLUNGSPLAN.md#7-prüfplan)) erzeugt in 100 % der Fälle eine Vorschau, eine Rückfrage oder eine begründete Unmöglichkeit — niemals eine erfundene Zahl.
- Eine nie dagewesene Situation (sture Regierung, Warten auf Regimewechsel, Rebellenunterstützung, mehrstaatiger Korridor) wird live aus den Faktoren berechnet — nicht aus einem Drehbuch abgespielt.
