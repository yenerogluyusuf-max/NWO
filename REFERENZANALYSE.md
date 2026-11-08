# NWO — Referenzanalyse und Designentscheidungen

Stand: 28. September 2026. Ergänzung zum [Projektplan](PROJEKTPLAN.md).

## Zweck und Quellenstand

Diese Analyse nutzt veröffentlichte Beschreibungen, Handbücher und Entwicklerbeiträge. Sie ist kein eigener Spieltest und kein Vergleich aller aktuellen Patchstände. Erweiterungen werden ausdrücklich genannt. Vor allem bei Civilization VII beschreiben einige Quellen die ursprüngliche Designkonzeption; daraus wird keine Aussage über jede spätere Änderung abgeleitet.

Die Abschnitte „Beobachtung“ beschreiben belegte Referenzmechaniken. Die Abschnitte „NWO-Entscheidung“ sind eigenständige Entwurfsvorschläge. Namen, Texte, Figuren, Grafiken und konkrete Inhalte der Vorbilder werden nicht übernommen.

## 1. Civilization VI: Ein Land soll auf der Karte entstehen

**Beobachtung:** Das offizielle Handbuch beschreibt Bezirke als räumlich außerhalb des Stadtzentrums angeordnete Einrichtungen. Ihre Platzierung macht die Geografie für die Entwicklung einer Stadt relevant. [Offizielles Civilization-VI-Handbuch, Abschnitt „Districts and Buildings“](https://downloads.2kgames.com/civilization/vi/manuals/eu/CIV_VI_25TH_ONLINE_MANUAL_ENG.pdf).

**NWO-Entscheidung:** Politische Vorhaben erhalten einen Ort. Ein Bildungsprogramm, ein Verkehrsprojekt oder ein Industriepark verändert konkrete Regionen. Der Spieler untersucht Standortbedingungen, betroffene Menschen und Kapazitätsengpässe. Vorteile ergeben sich aus tatsächlich modellierten Beziehungen, etwa Erreichbarkeit, Arbeitskräften und Energieversorgung.

Die reale Karte verwendet Verwaltungsgebiete und Infrastrukturverbindungen. Ein sichtbares Sechseckraster würde die gewünschten Stadtbezirke nicht angemessen abbilden. Die Regierung baut außerdem nicht jedes private Gebäude selbst: Sie beeinflusst Voraussetzungen, während andere Akteure investieren oder Vorhaben ablehnen.

**Konkretes Erlebnis:** Der Spieler öffnet Ankara, vergleicht Bezirke und erkennt, in welchem Gebiet ein Verkehrsprojekt besonders vielen Pendlern helfen würde. Die Akte zeigt Zuständigkeit, Finanzierung, Alternativen und die Herkunft der zugrunde liegenden Daten. Fehlende kleinräumige Daten bleiben sichtbar.

**Nachweis im Prototyp:** Zwei Standorte für dasselbe Infrastrukturvorhaben unterscheiden sich nachvollziehbar in Kosten, Erreichbarkeit und regionaler Wirkung.

### Gathering Storm: Umwelt wird Teil politischer Planung

**Beobachtung:** Die Erweiterung ergänzt Umweltwirkungen, technische Großprojekte, Energie, verbrauchbare Ressourcen sowie Weltkongress und diplomatischen Sieg. [2K: Gathering Storm](https://newsroom.2k.com/games/sid-meiers-civilization-vi-gathering-storm).

**NWO-Entscheidung:** Naturgefahren erhalten regionale Exposition, Vorsorge und Wiederaufbau. Energie verbindet Versorgungssicherheit, Infrastruktur, Preise und Außenpolitik. Internationale Beschlüsse folgen den jeweiligen institutionellen Regeln; es gibt keine universelle Weltregierung, die beliebige Regeln beschließt.

**Nachweis:** Eine Störung verursacht je nach vorheriger Vorsorge andere Ausfälle. Wiederaufbau bindet dieselben knappen Kapazitäten wie reguläre Projekte.

## 2. Civilization VII: Komplexität durch Zuständigkeit beherrschbar machen

### Städte, kleinere Siedlungen und Spezialisierung

**Beobachtung:** Der Entwicklerbeitrag zur Reichsverwaltung unterscheidet Städte von kleineren Siedlungen und erläutert Spezialisierung sowie geringeren Verwaltungsaufwand für diese unterstützenden Orte. [Firaxis: Managing Your Empire, offizielle spanische Fassung](https://civilization.2k.com/civ-vii/es-ES/game-guide/dev-diary/managing-your-empire/).

**NWO-Entscheidung:** Der Spieler kann tief hineinzoomen, ohne überall Entscheidungen treffen zu müssen. Kommunen verwalten ihren Alltag eigenständig. Nationale Politik setzt Förderbedingungen, Mindeststandards und große Investitionsprioritäten; Eingriffe brauchen eine Zuständigkeit.

Der Detaillierungsgrad der Darstellung ist vom Zustand der Simulation getrennt: Auch eine gerade nicht geöffnete Region entwickelt sich weiter. Beim Hineinzoomen darf die KI keine zusätzliche wirtschaftliche Aktivität erfinden.

**Nachweis:** Ein delegiertes Projekt und ein manuell beobachtetes Projekt unterliegen denselben Regeln. Beide bleiben nach einem Wechsel der Ansicht konsistent.

### Zeitalter und langfristiger Rhythmus

**Beobachtung:** Der veröffentlichte Zeitalterentwurf gliedert eine Kampagne in Antiquity, Exploration und Modern und beschreibt fortbestehende Elemente zwischen diesen Phasen. [Firaxis: Dev Diary #1 — Ages](https://civilization.2k.com/it-IT/civ-vii/game-guide/gameplay/ages-explanation/).

**NWO-Entscheidung:** Wahlperioden und politische Karrieren bilden verständliche Abschnitte einer langen Kampagne. Haushaltsbeschlüsse, Wahlen, internationale Gipfel und Krisen schaffen Zwischenziele. Es gibt keine erzwungenen weltweiten Epochenwechsel: Schulden, Verträge, Infrastruktur und institutionelle Veränderungen bestehen fort.

**Nachweis:** Nach einer Wahl werden neue Befugnisse und Amtsinhaber verarbeitet, laufende Kredite, Projekte und internationale Verpflichtungen bleiben bestehen.

### Diplomatie und Einfluss

**Beobachtung:** Die offizielle Übersicht beschreibt Einfluss als diplomatische Ressource sowie Kriegsunterstützung und Kriegsmüdigkeit. [Firaxis: Sieben Dinge über Civilization VII, offizielle französische Fassung](https://civilization.2k.com/fr-FR/civ-vii/news/7-things-to-know-about-civilization-vii/).

**NWO-Entscheidung:** Diplomatischer Handlungsspielraum wird verständlich angezeigt, aber durch konkrete Beziehungen erklärt: verfügbare Verhandlungsteams, Glaubwürdigkeit, Abhängigkeiten und Unterstützung anderer Staaten. Diese Faktoren sind nicht frei gegeneinander austauschbar. Eine gute Handelsbeziehung kauft keine automatische Zustimmung zu einem Militäreinsatz.

**Nachweis:** Derselbe Vertragsentwurf führt bei Partnern mit unterschiedlichen Interessen zu unterschiedlichen Gegenangeboten.

## 3. Hearts of Iron IV: Macht benötigt materielle Voraussetzungen

**Beobachtung:** Die offizielle Spielbeschreibung verbindet militärische Planung mit Industrie, Produktion, Ausrüstung und politischen Zielen. [Paradox: Hearts of Iron IV](https://www.paradoxinteractive.com/games/hearts-of-iron-iv/about).

**NWO-Entscheidung:** Sicherheitspolitische Absichten werden durch Fähigkeiten begrenzt. Beschaffung, Training, Wartung und Transport müssen zusammenpassen. Die politische Führung priorisiert Ziele und Ressourcen; militärische Fachleute entwickeln umsetzbare Vorschläge.

Ein wirtschaftlich erfolgreiches, friedliches Land muss ein vollständiges Spielerlebnis bieten. Militär ist ein bedeutender Teil der Simulation und keine zwingende Hauptaktivität jeder Kampagne.

### No Step Back: Versorgung und Führung

**Beobachtung:** Die Erweiterungsbeschreibung nennt einen aus Offizieren aufgebauten Generalstab und Erweiterungen des Versorgungssystems. [Paradox: No Step Back](https://www.paradoxinteractive.com/games/hearts-of-iron-iv/add-ons/hearts-of-iron-iv-no-step-back).

**NWO-Entscheidung:** Einsatzfähigkeit entsteht durch verfügbare Versorgung, einsatzfähiges Material, ausgebildetes Personal und Führungskapazität. Berichte zeigen den begrenzenden Faktor. Ein Wechsel des militärischen Führungspersonals kann Vorbereitung und Informationsqualität beeinflussen.

**Nachweis:** Zusätzlich gekaufte Ausrüstung hebt eine fehlende Ausbildungs- oder Wartungskapazität nicht automatisch auf.

### Arms Against Tyranny: Der Waffenhandel als politische Wirtschaft

**Beobachtung:** Die Erweiterung beschreibt spezialisierbare Rüstungsunternehmen und einen internationalen Waffenmarkt; die dort beschriebene Gegenleistung erfolgt über zivile Fabrikleistung. [Paradox: Arms Against Tyranny](https://www.paradoxinteractive.com/games/hearts-of-iron-iv/add-ons/hearts-of-iron-iv-arms-against-tyranny).

**NWO-Entscheidung:** Das Vorbild liefert die Verbindung von Industrie und Diplomatie. NWO verwendet stattdessen Geld, Finanzierung, Produktionsverträge und Lieferverpflichtungen. Angebote enthalten Lebenszykluskosten, Terminrisiken, politische Bedingungen und mögliche Abhängigkeiten.

**Nachweis:** Ein abgeschlossener Rüstungsvertrag erzeugt Zahlungs- und Lieferpläne; er erzeugt noch keine einsatzbereite Einheit.

## 4. Suzerain: Entscheidungen werden durch Personen erlebt

**Beobachtung:** Die offizielle Darstellung verbindet die Führung Sordlands mit Kabinettsmitgliedern eigener Überzeugungen und Interessen, wirtschaftlichen Problemen, außenpolitischen Konflikten und persönlichen Beziehungen. Die Entscheidungen prägen das Ende der Amtszeit. [Torpor Games: Suzerain](https://www.suzeraingame.com/).

**NWO-Entscheidung:** Suzerain ist zusammen mit der dänischen Politserie Borgen das Vorbild für den Ton: ernst mit trockenem Humor. Wie in Suzerain hat die eigene Figur ein Privatleben mit Auswirkungen. Große Konflikte bekommen Gesichter und Gesprächssituationen. Ein Minister erklärt, weshalb er eine Reform ablehnt; ein Bürgermeister beschreibt ihre Umsetzung vor Ort. Geschriebene Szenenvorlagen sichern Ton, Aufbau und Relevanz. Die konkreten Teilnehmer, Anliegen und Konsequenzen stammen aus dem Spielzustand.

Der Spieler kann selbst Themen ansprechen und Gespräche einberufen. Figuren sollen sich an Zusagen und Erfahrungen erinnern. Persönliche Szenen müssen eine Beziehung vertiefen oder einen politischen Konflikt verständlicher machen; belanglose Pflichtdialoge werden vermieden.

**Nachweis:** Ein Berater verweist in einer späteren Sitzung korrekt auf ein früheres Versprechen und reagiert entsprechend seiner bisherigen Erfahrungen. Eine nicht geführte Unterhaltung erzeugt keine fiktive Zusage.

## 5. Democracy 4: Politische Zusammenhänge sichtbar machen

**Beobachtung:** Die offizielle Spielseite beschreibt Wähler, politische Maßnahmen, Koalitionen, Medienrückmeldungen sowie Forderungen von Ministern und Unterstützern. [Positech: Democracy 4](https://www.positech.co.uk/democracy4/).

**NWO-Entscheidung:** Der Projektinhaber hat entschieden, die Eingabe wie bei Democracy 4 zu gestalten, also als sichtbares Netz aus Maßnahmen, Gesetzen, Problemen und Folgen mit mehr als 150 Knoten, ergänzt um die Schreibfläche. Anders als im Vorbild ist das Netz regional: Jeder Knoten hat eine Ausprägung je Provinz, und viele Probleme lassen sich nur durch Bauprojekte vor Ort lösen ([Spieldesign](SPIELDESIGN.md), Abschnitt 5). Jeder Politikbereich erhält eine untersuchbare Wirkungsansicht. Eine Reform zeigt finanzielle Folgen, betroffene Gruppen, Umsetzungsdauer und relevante Unsicherheiten. Nationale Durchschnittswerte werden mit regionalen und sozialen Unterschieden verbunden.

### Datengetriebene Wirkungen

**Beobachtung:** Die offizielle Modding-Dokumentation beschreibt über Effekte verbundene Objekte sowie zeitliche Trägheit. Umsetzungsstand und Ministerkompetenz können die Wirkung einer Maßnahme beeinflussen. [Positech: Modding-Grundlagen](https://www.positech.co.uk/democracy4/modding.html).

**NWO-Entscheidung:** Das Wirkungsmodell wird unabhängig von Dialogen versioniert. Jede Beziehung erhält Voraussetzungen, Einheit, Zeitverzug und Begründung. Wirtschaftliche Bestände und Zahlungsströme werden zusätzlich bilanziert; ein bloßes Netz beliebiger Prozentwerte wäre dafür nicht ausreichend.

**Nachweis:** Eine Maßnahme zeigt vorab erwartete Bandbreiten. Ihr späteres Ergebnis lässt sich mit Umsetzung und veränderten Rahmenbedingungen erklären. Das System darf Korrelationen nicht als sicher nachgewiesene reale Kausalität darstellen.

### Länderprofile

**Beobachtung:** Die Dokumentation erläutert landesspezifische Ausgangswerte, politische Einstellungen und überschreibbare Wirkungsbeziehungen. [Positech: Modding Countries](https://www.positech.co.uk/democracy4/mod_countries.html).

**NWO-Entscheidung:** Ein Länderpaket benötigt zusätzlich eigenständige institutionelle Verfahren, geografische Daten und Zuständigkeiten. Unterschiedliche Länder dürfen sich nicht allein durch Startwerte und Flaggen unterscheiden.

## 6. Gemeinsame Designentscheidung

| Quelle der Inspiration | Übertragung auf NWO | Grenze der Übertragung |
|---|---|---|
| Civilization VI | Räumliche Entwicklung und langfristige Investitionen | Reale Verwaltungsgeografie und mehrere Entscheidungsträger |
| Civilization VII | Delegation, Spezialisierung und verständliche Kampagnenabschnitte | Kontinuierliche Gegenwartsgeschichte ohne künstlichen Neustart |
| Hearts of Iron IV | Versorgung, Beschaffung und industrielle Voraussetzungen | Gesamtstaatliche Simulation mit vollwertigem Friedensspiel |
| Suzerain | Personen, Gespräche und politische Verantwortung | Offener Verlauf auf Basis eines persistenten Weltzustands |
| Democracy 4 | Unterscheidbare Bevölkerungsinteressen und sichtbare Wechselwirkungen | Regionale Tiefe, institutionelle Verfahren und unsichere Prognosen |

NWO wird deshalb als pausierbare strategische Simulation mit einer frei bedienbaren Gesprächsebene geplant. Karte, Akte und Gespräch zeigen verschiedene Ansichten desselben Zustands. Ein Vorhaben wird nur einmal berechnet, auch wenn es in allen drei Ansichten erscheint.

## 7. Verbleibende Recherche vor der Umsetzung

- Gezielte eigene Spieltests der Referenzen: Gesprächslänge, Warnmeldungen, Kartenwechsel, Delegation und die Belastung in langen Kampagnen untersuchen.
- Vor Versionsvergleichen den konkreten Patch- und Erweiterungsstand protokollieren.
- Für das erste NWO-Land echte Institutionen, Datenlizenzen, administrative Ebenen und Datenlücken separat prüfen.
- Die hier vorgeschlagenen NWO-Regeln durch Prototypen testen; die Existenz einer Mechanik in einem Vorbild belegt noch nicht ihre Eignung für dieses Spiel.
- **Neu in Version 0.3: Referenzen für Spielspaß.** Die bisherigen Vorbilder wurden vor allem auf Mechaniken untersucht. Ergänzend sollen Spiele mit belegten Quellen analysiert werden, die für Spannung, Figurenbindung und erzählbare Geschichten bekannt sind, etwa Crusader Kings III (Figuren und entstehende Geschichten, verschachtelte Erklärungen), Frostpunk (Druck und moralischer Preis), Papers, Please (kleine Entscheidungen mit persönlicher Tragweite) und Football Manager (Posteingang als Heimat, langfristige Bindung). Leitfrage: Wie erzeugen sie den Wunsch, weiterzuspielen? Die Ergebnisse werden wie oben mit Quellen und als „Beobachtung“ und „NWO-Entscheidung“ getrennt festgehalten.
