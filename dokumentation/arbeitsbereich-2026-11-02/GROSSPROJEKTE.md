# NWO — Großprojekte und freie Vorhaben

Stand: 29. September 2026. Ergänzung zu [Projektplan](PROJEKTPLAN.md) (Abschnitt 5 „Freie Anweisungen"), [Spieldesign](SPIELDESIGN.md) (Abschnitt 6) und [Planerweiterung](PLANERWEITERUNG.md). Datenbasis: [RECHERCHE_INNENPOLITIK.md](RECHERCHE_INNENPOLITIK.md), Abschnitt „Großprojekte"; [RECHERCHE_WELTDATEN.md](RECHERCHE_WELTDATEN.md).

## 1. Das Prinzip: Was der Spieler will, kann er versuchen

Der Spieler darf **jedes** Vorhaben frei eingeben — keine Liste begrenzt ihn:

> „Baut den größten Hafen der Welt bei Mersin."
> „Legt eine Autobahn von Istanbul bis Shanghai an."
> „Bringt die Ukraine und Russland an einen Tisch."
> „Macht die Türkei unabhängig von Energieimporten."
> „Baut eine neue Hauptstadt in Zentralanatolien."

Das Spiel erfindet kein Ergebnis. Es **übersetzt** die Eingabe in ein strukturiertes Projekt, **prüft** sie gegen Regeln und Ressourcen und **berechnet** die Folgen mit dokumentierten Modellen — einschließlich der Verlierer. Vorgeschlagene Folgen tragen immer Unsicherheitsbandbreiten; die Simulation bestimmt, was tatsächlich eintritt.

Damit ist NWO offen wie ein Sandbox-Spiel, aber gerechnet wie eine Simulation: Der Unterschied zu „Alles geht" ist, dass alles einen Preis hat.

## 2. Vom Satz zum Vorhaben

Die Verarbeitungsfolge ist dieselbe wie bei [freien Anweisungen](SPIELDESIGN.md#6-vom-satz-zum-staatsvorgang), aber mit einer eigenen Projekt-Klasse:

1. **Erkennen:** Ist es ein Vorhaben (etwas Bauen/Verhandeln/Erschaffen) und welcher Typ? (Infrastruktur, Industrie, Institution, Diplomatie, Militär, Wissenschaft, Kultur, Natur)
2. **Dimensionieren:** Wo? Wie groß? Welche Funktion? Der Spieler muss die Skala nicht nennen — das Spiel fragt nach, wenn mehrdeutig („Größter Hafen der Welt: Wie viele Container? Oder meinst du das größte Passagierterminal?").
3. **Rahmen setzen:** Zuständigkeit (Ministerium, Behörde, PPP), Rechtsgrundlage (Dekret, Gesetz, Ausschreibung), Finanzierungsrahmen (Haushalt, Kredit, Ausland, PPP), Zeitrahmen (Planung, Bau, Betrieb).
4. **Prüfen:** Gibt es die Ressourcen? (Geld, Personal, Material, Land, politische Mehrheit, technologische Voraussetzung) — nicht als Verbot, sondern als **Wegliste mit Preisen** („Wege statt Verbote").
5. **Berechnen:** Wirkungsmodell (Abschnitt 4) erzeugt direkte, indirekte und politische Folgen mit Bandbreiten.
6. **Bestätigen:** Der Spieler sieht den Projektvorschlag als Karte: Ziel, Kosten, Dauer, Gewinner, Verlierer, Risiken — und entscheidet.

Das Sprachmodell schlägt nur Struktur vor; **jede Zahl kommt aus dem Simulationskern** ([Leitprinzip 13](PROJEKTPLAN.md#2-leitprinzipien)).

## 3. Projektzustände

**Idee → Vorstudie → Finanzierung → Beschluss → Bau → Betrieb → Wirkung.** Zusätzlich: verschoben, überteuert, gescheitert, aufgegeben, verstaatlicht, privatisiert. Jeder Zustandswechsel hat Gründe und Kosten; bereits ausgegebenes Geld verschwindet nicht ([Entwicklungsplan, Prüfplan](ENTWICKLUNGSPLAN.md#7-prüfplan)).

## 4. Das Wirkungsmodell: drei Ebenen der Folgen

### Ebene 1 — Direkte Effekte

Kosten (Bau + Betrieb), Beschäftigung (Bauzeit + dauerhaft), Kapazität (was das Projekt leistet), Ressourcenverbrauch (Material, Energie, Flächen). Diese Werte sind berechenbar und werden mit hoher Präzision angezeigt.

### Ebene 2 — Zweitrundeneffekte (das Herzstück)

Hier entsteht die Härte des echten Lebens. Jedes Großprojekt **verlagert** und **verteilt**:

| Mechanismus | Regel | Quelle der Parameter |
|---|---|---|
| **Handelsverlagerung** (Gravitationsmodell) | Neue Kapazität am Ort A zieht Verkehre von Ort B; die Elastizität der Nachbarhäfen/-städte gegenüber Entfernung und Kapazität liegt empirisch bei ≈ −0,8 bis −1,1 | Recherche [RECHERCHE_INNENPOLITIK.md](RECHERCHE_INNENPOLITIK.md), Abschnitt Großprojekte |
| **Agglomeration** | Verdopplung der effektiven Dichte erhöht Produktivität um ~3–8 %; umgekehrt: Schrumpfung einer Stadt kostet produktivität ebenso | Ebda. |
| **Crowd-out** | Öffentliche Großinvestition bindet Budget, Personal, Material — andere Projekte werden teurer oder verschieben sich | Flyvbjerg: Kostenüberschreitung Schiene ~45 %, Straße ~20 %; realistische Verkehrsprognosen bei Prestigeprojekten nur 25–60 % der Planung |
| **Regionale Gewinner/Verlierer** | Wachstumskorridore entstehen; abgehängte Regionen verlieren Bevölkerung (Binnenmigration), Steuerkraft, politische Stimme | Empirische Regionalstudien |
| **Internationale Strahlkraft** | Ein Riesenhafen verschiebt Verkehre auch im Ausland: Nachbarländer verlieren Transitgebühren, Hafenstädte wie Piräus, Thessaloniki, Batumi schrumpfen relativ | Hafenwettbewerbs-Studien |

**Durchgerechnetes Beispiel (das Vision-Beispiel des Projektinhabers):**
„Größter Hafen der Welt in der Türkei" → +X Mio. TEU Kapazität → im Gravitationsmodell verlagern sich ~Y % der Verkehre von den bisherigen Routen → Nachbarhäfen im Mittelmeer und am Schwarzen Meer verlieren geschätzt Z% Umschlag → die Hafenstädte verlieren Beschäftigung und Zolleinnahmen → deren Regionen wachsen langsamer oder schrumpfen → diplomatische Reibung mit betroffenen Ländern (Griechenland, Georgien, Ukraine, Ägypten) → umgekehrt: türkische Logistikstädte gewinnen, Zolleinnahmen steigen, Arbeitsplätze entstehen, Immobilienpreise steigen (Verdrängung der Anwohner). **Alles als Bandbreite, nichts als Gewissheit.**

### Ebene 3 — Politische und soziale Folgen

- **Gewinner und Verlierer haben Gesichter:** Bürgermeisterin der wachsenden Hafenstadt, Unternehmer der schrumpfenden Nachbarstadt, Fischerfamilie am Kanal, Bauarbeiter aus Anatolien.
- **Korruptionsrisiko:** Je größer das Projekt, desto größer die Vergabe-Oberfläche. Das Spiel modelliert Vergabeaffären als mögliche Ereignisvorlagen (nicht als Automatismus).
- **Schulden:** Auslandsfinanzierung (z. B. im Belt-and-Road-Muster) bindet politisch; der Hambantota-Fall ist der dokumentierte Warnstein: Wer nicht zahlen kann, verliert Souveränität.
- **Umwelt:** Flächenverbrauch, CO₂, Wasserverbrauch, Ökosysteme — jede Dimension mit Preis, nicht mit Verbot.

## 5. Die Härte des echten Lebens

Großprojekte scheitern real. Das Spiel ahmt die belegten Regelmäßigkeiten nach:

| Härte | Regel im Spiel |
|---|---|
| Kostenüberschreitung | Ausgangsprognose + Zuschlag nach Projekttyp (Schiene ~45 %, Straße ~20 %, Prestige-Sonderbauten bis ~70 %); die Überschreitung kommt in Tranchen und mit Politik |
| Zeit | Planung + Bau dauern Legislaturperioden; der Spieler wird mit dem fertigen Projekt kaum bei der nächsten Wahl glänzen |
| Verkehrsillusion | Prognosen werden optimistisch präsentiert (Berater!), die realen Verkehre liegen bei 25–60 % der Planung — die Mentorin zeigt später die Abweichung |
| Verdrängung | Wachsende Städte verteuern Wohnraum (siehe [Innenpolitik](INNENPOLITIK.md), Wohnen); die Verliererregionen verlieren Jugend |
| Geopolitik | Ein „größter Hafen" ist ein Signal an alle Nachbarn: Reaktionen kommen aus Ankara, Athen, Tiflis, Kiew, Kairo — als Diplomatie-Ereignisse |
| Technologie-Grenzen | Was physikalisch/technologisch nicht geht (z. B. „Autobahn über den Ararat in 6 Monaten"), wird nicht plausibel berechnet, sondern mit den echten Hindernissen beantwortet |

**Scheitern ist ein zulässiges Ergebnis.** Ein Projekt kann nach der Vorstudie versenkt werden — mit bereits ausgegebenen Planungskosten.

## 6. Grenzüberschreitende Projekte: Verhandeln über die Grenzen hinaus

Manche Vorhaben enden nicht an der eigenen Grenze — sie laufen **durch** andere Länder. Das Beispiel des Projektinhabers: **„Ich will die Bagdadbahn bauen und dann mit allen Ländern, die darin eingeschlossen sind, darüber verhandeln, weil es über meine Grenzen hinausgeht."** Das ist ein eigener Fall, weil der Spieler hier nicht nur baut, sondern **mit jedem Land auf der Strecke verhandeln** muss.

### 6.1 Die Verhandlungsserie

Jedes Land auf der Route wird eine **Verhandlungspartei** mit eigenen Interessen:

| Was das Land will | Was der Spieler bieten kann |
|---|---|
| Transitgebühren, Anteile an Einnahmen | Einkommensbeteiligung, feste Gebühren |
| Arbeitsplätze und Anschluss der eigenen Städte | Bauabschnitte, Anschlussstrecken |
| Sicherheit (Strecke durch unruhige Regionen) | Sicherheitsgarantien, gemeinsame Kontrolle |
| Souveränität (Landrechte, Zölle, Kontrollen) | Konzessionsmodelle (historisch: 99 Jahre), gemeinsame Betreibergesellschaft |
| Geopolitische Ausrichtung (mit wem ist man?) | Handelsabkommen, Energie, Visa, politische Nähe |
| Technik und Normen (Spurweite, Anschlüsse) | Standard-Wahl, Technologietransfer |

Die Verhandlungen sind **einzeln oder als Konferenz** möglich; die **Reihenfolge zählt** (starte mit dem willigsten Land — ein Erfolg macht die anderen nervös oder gierig). Paketgeschäfte („Energie und Visa gegen Durchfahrt") sind der Normalfall.

### 6.2 Dritte reagieren

Ein Korridor ist ein **Einflussprojekt** — alle Mächte in der Region schauen zu: Finanzierer (Deutschland, China), Nachbarn (Russland, Iran), Seemächte (USA, EU). Sie bieten Gegenangebote, üben Druck aus oder bieten ihre eigenen Korridore an. Das Spiel berechnet diese Reaktionen über die [Beziehungsmatrix](AUSSENPOLITIK.md#2-die-beziehungsmatrix-startwerte-202526).

### 6.3 Historische Verankerung: die Bagdadbahn

Die **Berlin-Baghdad-Bahn** (Konzession 1903) ist das Lehrbuchbeispiel: geplant von Istanbul über Anatolien und Mesopotamien nach Bagdad und Basra am Persischen Golf. Jeder Abschnitt brauchte Verhandlungen — mit dem Osmanischen Reich, mit lokalen Autoritäten, über Finanzierung (Deutsche Bank, spätere französische Beteiligung), über Sicherheit in unruhigen Regionen, über Spur und Anschlüsse. Die Strecke durch den Taurus dauerte Jahrzehnte; Bagdad wurde erst 1940 erreicht. Geopolitisch wurde der Korridor zum Reizthema der Großmächte — die Reaktionen der Briten, Russen und Franzosen sind im Spiel die berechneten Gegenbewegungen.

**Moderne Entsprechung als Kalibrierung:** die **Baku–Tiflis–Kars-Bahn** (eröffnet 2017) — ein realer Korridor, der drei Länder verbindet, über Jahre verhandelt wurde und heute den „Middle Corridor" nach Zentralasien stärkt; dazu TANAP/TAP als Rohstoff-Korridor. Diese Fälle geben die Parameter für Verhandlungsdauer, Kostenbeteiligung und Zweitrundeneffekte.

### 6.4 Die Härte

- **Ein Veto genügt.** Ein Land, das nicht mitmacht, zwingt zur Umleitung (teurer, langsamer) oder zum Druck (Sanktionen, Paketgeschäfte) — oder zum Scheitern.
- **Jahrzehnte, nicht Jahre.** Historisch dauerten solche Korridore eine Generation. Der Spieler erlebt die Verzögerungen, die Kostenüberschreitungen (siehe Abschnitt 5), die Regierungswechsel der Partner.
- **Sicherheit ist Bauzeit.** Strecken durch unruhige Regionen kosten Schutz, Personal, Versicherung — und Anschläge werden zu Ereignissen ([SZENARIEN.md](SZENARIEN.md), S7).
- **Zweitrundeneffekte wie immer:** Die Städte an der Strecke wachsen (Gaziantep, Diyarbakır, Bagdad), andere Routen und Häfen verlieren Verkehre (Gravitationsmodell, Abschnitt 4), Nachbarländer ohne Anschluss nehmen ab — und werden unzufrieden.
- **Finanzierung ist Politik:** Wer zahlt, bestimmt mit. Fremdfinanzierung (Belt-and-Road-Muster) bindet — der Hambantota-Fall (Abschnitt 4) ist die Warnung.

### 6.5 Die sofortige Folgenrechnung

Sobald der Spieler die Strecke skizziert, zeigt das Spiel die **Verhandlungslandkarte**: Wer sitzt am Tisch, was will jeder, was kostet ein Nein, was kostet ein Ja — und die Sofort-Projektion der Korridor-Wirkung (BIP-Effekte der Anrainer, Verlagerung von Verkehren, geopolitische Reaktionen) mit Bandbreiten ([WELTMODELL.md](WELTMODELL.md), Abschnitt 4).

## 7. Spezialfall: Diplomatische Großvorhaben

Manche Eingaben sind keine Bauwerke, sondern Verhandlungen („Bringt den Ukraine-Krieg zu Ende"). Sie laufen über das **Mediationsmodell** in [AUSSENPOLITIK.md](AUSSENPOLITIK.md), Abschnitt 6 — mit demselben Prinzip: Der Spieler formuliert die Absicht, die Simulation rechnet die Kräfte (Interessen, ZOPA, Spoiler, Garantien), und die Folgen treffen alle Beteiligten.

## 8. Prüfkriterien für Großprojekte

- Eine Testperson gibt ein nie dagewesenes Vorhaben ein und erhält nachvollziehbare Kosten, Dauer, Gewinner und Verlierer — mit Bandbreiten.
- Die Zweitrundeneffekte sind auf dem Bildschirm begründbar: „Warum verliert Thessaloniki?" → Klick → Gravitationsrechnung → Parameter und Quelle.
- Kein Projekt wird blockiert; jedes hat mindestens einen Weg, der mehr kostet oder länger dauert.
- Dasselbe Projekt erzeugt in zwei Partien unterschiedliche Verläufe (Zufall, politische Lage, Weltmarktpreise).
- Ein Testperson kann nach einer Partie erzählen, welches Projekt sie gewollt hat, woran es gescheitert ist (oder was es die Nachbarstädte gekostet hat) — und dass die Geschichte wahr wirkt.
- Ein grenzüberschreitendes Projekt erzeugt eine Verhandlungsserie: jede Partei auf der Strecke hat erkennbare Interessen, und ein einziges Nein verändert den Verlauf (Bagdadbahn-Test).
