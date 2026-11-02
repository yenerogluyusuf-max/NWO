# NWO — Referenzmethode und Recht: Beobachten statt Dekompilieren

Stand: 18. Oktober 2026. Antwort auf die Frage, ob Hearts of Iron IV, Democracy 4 und Civilization VI für NWO/Staatsräson reverse-engineered werden sollen. Ergänzung zur [Referenzanalyse](REFERENZANALYSE.md). **Keine Rechtsberatung** — die rechtliche Freigabe vor einer Veröffentlichung bleibt einem Anwalt vorbehalten.

## 1. Kurzfassung

**Empfehlung: Ja zur Referenzanalyse, nein zum Reverse Engineering der drei Titel.**

- NWO und Staatsräson sind dasselbe Projekt: NWO ist das Kürzel, Staatsräson der Name ([Arbeitsprompt](ARBEITSPROMPT.md)).
- Der Kauf gibt eine Nutzungslizenz, nicht das Eigentum am Code. „Ich habe das Spiel gekauft" ist keine Erlaubnis, die Binary zu zerlegen, Assets zu extrahieren oder Daten zu übernehmen.
- Der Wert der drei Spiele für NWO liegt in Designideen und Spielerfahrungen, nicht in ihrem Code. Der Code ist proprietär, eng an das jeweilige Spiel gebunden und für eine türkische Gegenwartssimulation kaum übertragbar.
- Die saubere Methode ist die **Black-Box-Referenzanalyse**: spielen, beobachten, öffentliche Dokumentation lesen, eigenes Modell schreiben. Genau das macht [REFERENZANALYSE.md](REFERENZANALYSE.md) bereits.

## 2. Vier Handlungen, die oft verwechselt werden

| Handlung | Rechtlicher Rahmen (DE/EU) | Für NWO |
|---|---|---|
| Spielen und Verhalten beobachten | § 69d Abs. 3 UrhG erlaubt das Beobachten, Untersuchen oder Testen des Programms, um die zugrunde liegenden Ideen und Grundsätze zu ermitteln; entgegenstehende Vertragsklauseln sind nach § 69g Abs. 2 nichtig | **Ja** — Grundlage jeder Referenzanalyse |
| Offizielle Modding-Schnittstellen nutzen | Im Rahmen der jeweiligen Modding-Bedingungen; bei Paradox, Positech und Firaxis ausdrücklich vorgesehen, meist nur nicht-kommerziell | **Ja, als Sandbox** — privat, nicht als Produkt |
| Dekompilieren oder disassemblieren | Nur für Interoperabilität nach § 69e UrhG; die gewonnenen Informationen dürfen nicht für ein Programm mit im Wesentlichen ähnlicher Ausdrucksform verwendet werden | **Nein** — NWO ist kein Interoperabilitätsprojekt |
| Code, Assets, CSV-/XML-Daten übernehmen | Urheberrecht an Code, Texten, Grafik, Karten und ggf. Datenbankrecht; keine freie Lizenz | **Nein** |

### 2.1 Was § 69d Abs. 3 erlaubt — und was nicht

§ 69d Abs. 3 UrhG ist die gesetzliche Grundlage dafür, ein Spiel zu spielen und aus seinem Verhalten zu lernen. Er erlaubt das Beobachten, Untersuchen und Testen, **nicht** das Lesen des Quellcodes. Wer ein Spiel startet, mechanische Zusammenhänge misst und Beschreibungen anfertigt, bewegt sich in diesem Rahmen. Wer die Binary dekompiliert, verlässt ihn.

### 2.2 Warum § 69e nicht hilft

§ 69e UrhG erlaubt Dekompilierung nur, wenn sie **unerlässlich** ist, um die Interoperabilität eines unabhängig geschaffenen Programms mit anderen Programmen herzustellen. NWO soll nicht mit HOI4, Democracy 4 oder Civilization VI zusammenarbeiten. Selbst wenn eine Dekompilierung ausnahmsweise zulässig wäre, dürften die Informationen nach § 69e Abs. 2 Nr. 3 nicht für die Entwicklung eines Programms mit im Wesentlichen ähnlicher Ausdrucksform genutzt werden. Genau das wäre ein NWO, das HOI4-Mechaniken nachbaut.

### 2.3 Mechaniken sind nicht automatisch frei

Das Landgericht Köln hat 2024 entschieden, dass das bloße Spielkonzept urheberrechtlich nicht geschützt ist, sondern nur die konkrete Ausgestaltung ([LG Köln, 11.01.2024, 14 O 441/23](https://nrwe.justiz.nrw.de/lgs/koeln/lg_koeln/j2024/14_O_441_23_Urteil_20240111.html)). Daraus folgt **nicht**, dass jede Mechanik frei ist. Geschützt bleiben Code, Texte, Grafik, Musik, Karten, UI und gegebenenfalls Datenbanken. Die Grenze zwischen Idee und Ausdruck ist fließend; auffällige, eigentümliche Regelkombinationen können im Einzelfall Schutz genießen. Wer ein kommerzielles Spiel baut, sollte nicht auf die Faustregel „Mechaniken sind frei" setzen.

### 2.4 Verträge und Kauf

Die Steam-Subscriber-Agreement-Klausel 2.G verbietet unter anderem Reverse Engineering, Dekompilieren und das Ableiten von Quellcode, „except as otherwise permitted … under applicable law" ([Steam Subscriber Agreement](https://store.steampowered.com/subscriber_agreement/)). § 69g Abs. 2 UrhG erklärt Klauseln nichtig, die § 69d Abs. 3 oder § 69e widersprechen. Daraus folgt nur die enge gesetzliche Beobachtungs- und Interoperabilitätsfreiheit — keine allgemeine Erlaubnis, ein Spiel zu zerlegen und nachzubauen. Ein Vertragsverstoß kann zur Kontosperre und zu Schadensersatz führen, auch wenn er nicht automatisch eine Urheberrechtsverletzung ist.

## 3. Was die drei Titel wirklich bieten

| Titel | Technisch zugänglich | Was für NWO wertvoll ist | Was nicht | Urteil |
|---|---|---|---|---|
| **Hearts of Iron IV** | Clausewitz-Engine; Inhalte in Klartext-Skripten, Kartenpipeline dokumentiert; Simulationskern nicht als offener Quellcode | Strategische Karte, Provinzlogik, Auftrags- und Versorgungsdenken, Fokus-/Ereignisstruktur, Friedenskonferenz als Negativbeispiel | Kriegswirtschaft, Divisions- und Industriemodell, konkrete Balancing-Werte, Code | Als Karten- und UX-Referenz ja; als Simulationscode nein |
| **Democracy 4** | Eigenbau-C++-Engine, CSV-Simulationsdaten, offizielle Modding-Dokumentation ([Positech](https://www.positech.co.uk/democracy4/modding.html)) | Politiknetz, Wählergruppen, Latenzen, Umsetzungskompetenz, sichtbare Wechselwirkungen | UK-zentrierte Abstraktion, verborgene Gewichte, fehlende Regionen und Haushaltsbilanz, konkrete CSV-Werte | Als Denkmodell ja; als Datenquelle oder Code nein |
| **Civilization VI** | SQLite-/XML-/Lua-Daten, Entwicklerwerkzeuge, Handbuch und Civilopedia | Bezirke und Standortlogik, lange Investitionszyklen, Weltkongress, Diplomatie als Menü | Hex-Yields, Epochen, 4X-Abstraktion, Assets | Als Ideengeber ja; als Staatsmodell nein |

Die drei Spiele sind **keine Bausteine** für NWO. Sie sind fertige Interpretationen von Politik, Krieg und Geschichte — jeweils für ihre eigenen Zwecke optimiert. NWO braucht etwas anderes: echte Türkei-Daten, 81 Provinzen, Institutionen, Haushalts- und Geldpolitik, regionale Ungleichheit und eine freie Spracheingabe, die in geprüfte Aktionen übersetzt wird.

## 4. Warum der Code der falsche Hebel ist

### 4.1 Die Architektur passt nicht

NWO ist nach [WELTMODELL.md](WELTMODELL.md) gebaut als Dreisatz: alle Faktoren sind modelliert, die KI übersetzt Absichten in strukturierte Operationen, die Simulation rechnet die Folgen. Keines der drei Spiele hat diese Architektur:

- **HOI4** ist eine Kriegssimulation. Die Wirtschaft dient der Rüstung; Haushalt, Zentralbank, Rechtsstaat und Wählergruppen sind nicht das Kernmodell.
- **Democracy 4** ist ein abstraktes Politiknetz mit verborgenen Gewichten. Es erklärt Zusammenhänge, bilanziert aber keine echte Volkswirtschaft und kennt keine 81 Provinzen.
- **Civilization VI** ist ein 4X-Spiel mit Erträgen, Epochen und Hexfeldern. Seine Begriffe sehen wie Politik aus, seine Logik ist Spielökonomie.

Wer diese Modelle übernimmt, importiert ihre Annahmen. Aus NWO würde ein HOI4-Mod mit türkischer Karte, ein Democracy-4-Aufguss oder ein Civ-Klon — genau die Kombination, die der Markt schon hat und die NWO nicht sein will.

### 4.2 Der technische Aufwand steht in keinem Verhältnis

Proprietäre Engines sind groß, optimiert und ohne Dokumentation der Interna. Selbst wer eine Binary lesbar macht, gewinnt daraus keine saubere Architektur: Die Simulation ist mit Rendering, UI, Speicherverwaltung und Spielinhalten verwoben. Für NWO müsste alles neu geschrieben werden — dann kann man es auch gleich sauber entwerfen. Die Zeit ist in Daten, Modell und Prototyp besser investiert.

### 4.3 Referenzkontamination

Wer einmal dekompiliert hat, kann später nur schwer glaubhaft machen, dass Code und Struktur unabhängig entstanden sind. Für ein kommerzielles Projekt ist das ein vermeidbares Risiko. Die Regel lautet: **keine fremden Dateien im Repository, keine kopierten Namen, IDs, Texte, Werte oder UI-Layouts.** Beobachtungen werden in eigenen Worten notiert, nicht als Dateikopie.

## 5. Die saubere Methode: Black-Box-Referenzanalyse

1. **Nicht dekompilieren, nicht disassemblieren, keine Assets extrahieren.** Auch keine „nur mal kurz" genommene Datenbank.
2. **Öffentliche Quellen nutzen:** Handbuch, Civilopedia, Wiki, Entwicklertagebücher, Patch Notes, offizielle Modding-Dokumentation. Quelle und Datum notieren.
3. **Beobachtung und Designentscheidung trennen.** Erst beschreiben, was das Spiel tut; dann entscheiden, was NWO übernimmt — und was ausdrücklich nicht.
4. **Keine Zahlen, Texte, Namen, IDs oder UI-Layouts übernehmen.** Eigene Gleichungen, eigene Begriffe, eigene Oberfläche.
5. **Modding nur über offizielle Schnittstellen, privat und nicht-kommerziell.** Ein HOI4-Mod, eine Democracy-4-Konfiguration oder eine Civ-6-Mod können als Sandbox dienen; sie sind nicht das Produkt.
6. **Clean-Room-Protokoll führen:** Datum, Quelle, Beobachtung, NWO-Entscheidung, bewusst nicht übernommen. Vor einer Veröffentlichung prüft ein Anwalt dieses Protokoll und die konkreten Inhalte.
7. **Bei auffälligen Mechaniken vorsichtig sein.** Je eigentümlicher die Regelkombination, desto eher ist sie als Ausdruck geschützt. Im Zweifel: eigene Mechanik entwerfen.

### Beobachtungsbogen (Vorlage)

| Feld | Inhalt |
|---|---|
| Spiel, Patch, Datum | exakte Version und Sitzung |
| Szene | Spielstand, Ziel, Ausgangslage |
| Beobachtete Mechanik | was das Spiel tut, nicht was es „bedeutet" |
| Auslöser und Entscheidung | welche Handlung löst was aus |
| Rückmeldung | was der Spieler sieht, hört, lernt |
| Zeitverzug | sofort, Tage, Monate, Jahre |
| Kosten und Verlierer | wer zahlt, wer profitiert, was scheitert |
| NWO-Transfer | welche abstrakte Idee übernehmbar ist |
| Bewusst nicht | was nicht übernommen wird und warum |
| Quelle | Handbuch, Wiki, Dev Diary, eigene Beobachtung |

Der Bogen ist bewusst nüchtern. Er verhindert, dass aus „das Spiel macht Spaß" ein „das müssen wir kopieren" wird.

## 6. Zum REA-Prompt im Screenshot

Der abgebildete REA-Prompt ist ein generisches Werkzeug zum Zerlegen fremder Programme. Für diese drei Titel würde ich ihn nicht auf die Binaries ansetzen: Er optimiert auf Trace, Report und Build, nicht auf Rechtsabgrenzung. Sein Schritt 1 („ASK") ist genau der richtige Ort für die Frage „Darf ich das?" — und die Antwort lautet bei kommerziellen Spielen für eine eigene kommerzielle Neuentwicklung in der Regel nein.

Wenn du REA ausprobieren willst, nutze es an einem **eigenen Prototyp** oder an einem **Open-Source-Spiel**, dessen Lizenz das Lernen aus dem Code erlaubt (etwa Freeciv, OpenTTD oder Unciv; Lizenz im Einzelfall prüfen). Ein `npx -y`-Paket aus einem Screenshot gehört außerdem vorher geprüft, bevor es auf einem Rechner mit Spielen, Keys und Projektdateien läuft.

## 7. Konkreter Plan statt Reverse Engineering

1. **Je 2 Stunden gezielte Beobachtung** pro Titel, mit dem Bogen oben. Keine Dateien auslesen. Das ist Forschung, kein Freizeitspielen.
2. **Je eine Seite Transfer-Memorandum:** fünf Mechaniken, zwei behalten, drei ausdrücklich verwerfen, jeweils mit Quelle und Begründung.
3. **Drei kleine NWO-Prototypen** statt drei Engine-Analysen: (a) Politiknetz mit zwölf Feldern und sieben Wählergruppen, (b) Karte mit 81 Provinzen und Hover/Zoom, (c) 90-Tage-Lauf für Haushalt, Zinsen und Inflation. Alle mit eigenen Daten und eigenen Gleichungen.
4. **Optional ein Wochenende private Mod** in einem der drei Spiele, um eine Mechanik zu testen. Danach zurück zu NWO; nicht zum Produkt machen.
5. **Erst vor einer Veröffentlichung** Anwalt und Clean-Room-Protokoll prüfen lassen. Bis dahin gilt: keine fremden Dateien im Projekt.

## 8. Empfehlung

**Als Vorbilder nutzen, nicht als Codequelle.** Die drei Spiele sind gekaufte Lehrbücher, keine Open-Source-Baukästen. NWO gewinnt nicht dadurch, dass es ihren Code liest, sondern dadurch, dass es ihre Designideen versteht und mit echten Daten, eigener Simulation und eigener Spracheingabe etwas Neues baut.

Die bestehende [Referenzanalyse](REFERENZANALYSE.md) macht das bereits richtig: Beobachtung, Quelle, NWO-Entscheidung, Grenze der Übertragung. Sie sollte um die hier beschriebene Methode ergänzt, aber nicht durch Dekompilierung ersetzt werden.

## 9. Quellen

- § 69d UrhG — Ausnahmen von den zustimmungsbedürftigen Handlungen: [gesetze-im-internet.de](https://www.gesetze-im-internet.de/urhg/__69d.html)
- § 69e UrhG — Dekompilierung: [gesetze-im-internet.de](https://www.gesetze-im-internet.de/urhg/__69e.html)
- § 69g UrhG — Vertragsrecht: [gesetze-im-internet.de](https://www.gesetze-im-internet.de/urhg/__69g.html)
- Steam Subscriber Agreement, Ziffer 2.G: [store.steampowered.com](https://store.steampowered.com/subscriber_agreement/)
- LG Köln, Urteil vom 11.01.2024, 14 O 441/23: [nrwe.justiz.nrw.de](https://nrwe.justiz.nrw.de/lgs/koeln/lg_koeln/j2024/14_O_441_23_Urteil_20240111.html)
- Paradox Interactive User Agreement: [legal.paradoxplaza.com](https://legal.paradoxplaza.com/eula)
- Positech: Democracy 4 — Modding: [positech.co.uk](https://www.positech.co.uk/democracy4/modding.html) und [Simulation Values](https://www.positech.co.uk/democracy4/mod_simulation.html)
- Hearts of Iron IV Wiki — Modding: [hoi4.paradoxwikis.com](https://hoi4.paradoxwikis.com/Modding)
- Civilization VI — Offizielles Handbuch: [2K](https://downloads.2kgames.com/civilization/vi/manuals/eu/CIV_VI_25TH_ONLINE_MANUAL_ENG.pdf)
