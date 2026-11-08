# Staatsräson als zusammenhängende spielbare Welt

Recherche vom 29. Oktober 2026. Gegenstand ist der vorhandene W4-Code und ein ausdrücklich vorgeschlagener Ausbau. Die Civilization-Fakten recherchieren die beiden anderen Teilberichte frisch; dieser Bericht behauptet keine neuen Civ-Regeln. Lokale Primärquelle: `/Users/yusufyeneroglu/Desktop/Staatsraeson`, Stand `09a14ffdb767b856cfae2a900fc1d3a54bebd58b`. Der in dieser Recherche gelesene Code unter `/private/tmp/nwo-projektkontext-20261029` ist laut vorherigem Tree-Abgleich in `game/` und `app/` identisch. Links führen zum dauerhaft vorhandenen Originalcheckout. Kein Spielcode wurde geändert, keine Partie wurde für diese Recherche im Browser gespielt.

## Was ist bereits vorhanden und was verhindert den gewünschten Zusammenhang?

### Takeaway

Staatsräson hat bereits viele nötige Bausteine. Der entscheidende fehlende Schritt ist eine überprüfbare Kette von tatsächlichen Beständen, Lieferungen, Kapazitäten, Ausgaben und Folgen, die Karte, Verwaltung, Wirtschaft und Krieg gemeinsam benutzen. Ein weiteres unabhängiges Krisensystem würde vorhandene Widersprüche vergrößern.

### Cited Findings

| Bereich | Tatsächlich vorhandener Stand | Grenze für das gewünschte Spiel |
|---|---|---|
| Zeit und Wirtschaft | Tägliche Märkte; Makroökonomie am Monatsersten; verzögert veröffentlichte Statistik; gespeicherter Zufallszustand. | Monatsmodelle werden nacheinander ausgeführt; nicht jede Anzeige verwendet denselben zeitlichen Stand. [Tagesschritt](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/world.ts:105>) |
| Monatswelt | Diplomatie, Krieg, Bau, Wissen, Infrastruktur, Katastrophen und Güter werden in einer festen Monatskette fortgeschrieben. | Die Existenz dieser Aufrufe beweist keine lückenlose finanzielle und physische Verknüpfung. [Spielmonat](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/spiel.ts:324>) |
| Güter | Produktion, Verbrauch, Importe, Ausfuhr, Lager, Lieferstörungen und Engpasswirkungen sind vorhanden. | Fehlende Importe leeren Lager; bei Normalversorgung füllt sich ein Lager in Schritten von einem Sechstel der Soll-Lücke wieder. Dafür gibt es in dieser Funktion keine eigene Importrechnung oder Transportkapazitätsbuchung. [Gütermonat](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/gueter.ts:204>) |
| Außenwirtschaft | Leistungsbilanztreiber, Kapitalströme, Reserven und IWF sind vorhanden. | Die Leistungsbilanz ist eine aggregierte Treiberrechnung, keine Summe der tatsächlichen einzelnen Warenimporte. Dollar-BIP wird aus dem Szenariofeld `bipTryTn` und dem laufenden Wechselkurs abgeleitet. [BIP/Leistungsbilanz](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/devisen.ts:135>) |
| Militärproduktion | Einkauf, Eigenproduktion, Forschung, Modernisierung, Lieferstopps, Menge, technische Generation, Etatkapazität und Munition. | Beschaffung speichert `bipMonat`, aber der monatliche Beschaffungsschritt bucht diesen Betrag nicht. Der Kommentar erklärt den Etat als Träger; die konkrete Deckung bleibt deshalb unklar. Eine Reparatur muss Etatmittel zuordnen, bevor sie zusätzliche Kosten erhebt. [Beginn](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/streitkraefte.ts:336>), [Monatsschritt](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/streitkraefte.ts:403>) |
| Krieg | Eskalation, politische Beschlüsse, wöchentliche Front, Einsatzarten, Verluste, Munition, Waffenruhe, Frieden, Besatzung. | Kontrollierte Regionen werden im Kern aus dem globalen Frontwert und der Reichweite abgeleitet. Dies ist noch kein räumliches System eigenständiger Formationen mit Lieferwegen. [Regionenkontrolle](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/kriegsschauplatz.ts:356>) |
| Kriegsfolgen | Gefallene, Kriegsmüdigkeit, Zustimmung, Tourismusrückgang, Kapitalabzug, Risikoaufschläge sowie EU-/US-Sanktionen existieren. | Die pauschale Aussage „Krieg hat keine wirtschaftlichen oder diplomatischen Folgen“ wäre falsch. Ausbau heißt diese Folgen stärker aus tatsächlichen Operationen, Schäden und Lieferausfällen herzuleiten. [Kriegspreis](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/kriegspreis.ts:95>) |
| Eskalation und Waffenruhe | Gegnerischer Angriff folgt einer Eskalationsschwelle. | Im Tageszweig wird davor keine Kräfte-/Zielabwägung durchgeführt; Waffenruhe besitzt dort keinen eigenen regelmäßigen Verhandlungsschritt. Das ist ein konkreter Ansatzpunkt für glaubwürdigeres Verhalten und belastbare Auswege. [Kriegszustände](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/krieg.ts:1073>) |
| Gesetze | Neuer Weg mit Fassungen und zusätzlichen Folgen. | Der neue Folgehaken erfordert `g.vorhaben`; ältere Wege können diesen Kontext umgehen. Einheitliche Spielerbefehle müssen dieselbe institutionelle Prüfung benutzen. [Gesetzgebungsweg](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/gesetzgebung.ts:331>), [Folgehaken](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/gesetzgebung.ts:417>) |
| Katastrophen | Unsichere Schadensmeldungen, Soforthilfe, Übergangsversorgung, Wiederaufbau über Reichprojekte, Versprechensfolgen. | Sehr brauchbare Grundlage; räumliche Schäden und Lieferzugang sollten dauerhaft mit Infrastruktur und Wirtschaft verbunden werden. [Katastrophenmodell](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/katastrophe.ts:36>) |
| Infrastruktur | Nachfrage, Kapazität, Überlast, Zustand, Ausbauten und Unterhalt. | Diese Kapazitäten müssen konkrete Liefer- und Versorgungswege begrenzen, statt nur zusätzliche Indexeffekte zu erzeugen. [Infrastrukturmonat](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/infrastruktur.ts:341>) |
| Sichtbarer Fortschritt | Baustellenlinien reagieren auf Baufortschritt. | Die Linienfunktion verarbeitet nur laufende Projekte; fertige Strecken fallen aus dieser Darstellung. Außerdem zeichnet ein anderer Pfad statische Megaprojektgeometrien ohne Prüfung des Spielbestands. [Baulinien](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/ui/atlas/neubau.ts:25>), [Megaprojekte](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/ui/atlas/vector.ts:1062>) |
| Politische Laufbahn | Amtszeiten, neue Zielwahl, Kabinettsumbildung, Nachfolge und unterschiedliche Enden. | Gute Grundlage für Kampagnenfortschritt; dieselbe Welt muss über diese Übergänge fortbestehen. [Amtszeitbeginn](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/amtszeit.ts:169>), [Enden](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/enden.ts:454>) |

Zusätzlicher verifizierter Aktionsfehler: Drei Kriegskarten deklarieren Kapitalpreise und rufen anschließend die nochmals preisprüfende Fachhandlung auf. Ereignis und Fachfunktion benötigen eine gemeinsame Transaktion, nicht zwei Kostenbesitzer. [Ereignisoptionen](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/ereignisse-krieg.ts:52>), [Fachhandlung](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/krieg.ts:503>).

### Inferences

- Der gesuchte „Realismus“ lässt sich zuerst als **Konsistenz der Folgen** umsetzen: ein gebautes Werk existiert, ein ausgegebener Betrag fehlt anderswo, ein blockierter Transport kommt nicht an, ein verletztes Abkommen verändert die Handlungsbereitschaft des Partners.
- Dazu ist keine vollständige Weltwirtschaftssimulation und kein individuelles Fahrzeugmodell nötig. Eine begrenzte Zahl nachvollziehbarer Engpässe kann mehr spielerische Tiefe schaffen als Hunderte schwach verbundene Werte.
- Vorhandene Systeme sollten Eigentümer ihrer Zustände bleiben. Ein gemeinsamer Buchungs- und Befehlsweg verbindet sie; keine zusätzliche zweite Wirtschaft, kein zweiter Kriegszustand und kein weiterer freier Baupfad neben Reich.

### Gaps

- Die bislang überprüfte Codekohärenz ersetzt weder Balance noch einen Spieltest des gesamten ersten Amtsjahrs. Aussagen wie „macht Spaß“, „fair“ oder „in zehn Stunden durchspielbar“ sind hier keine gemessenen Ergebnisse.
- Der vorhandene Datenstand enthält sowohl Modellparameter als auch historische Werte. Vorgeschlagene Mengen, Zeiten und Preise müssen als Spielparameter gekennzeichnet und anschließend kalibriert werden.

## Wie wird aus den Systemen ein klarer Spielablauf?

### Takeaway

Der Spieler soll eine Absicht formulieren, einen begrenzten Plan finanzieren und durchsetzen, seine Umsetzung verfolgen und auf sichtbare Folgen reagieren. Die wichtigste Übertragung aus dem Aufbaugedanken ist dauerhafte Veränderung: Entscheidungen erzeugen Fähigkeiten und Abhängigkeiten, die spätere Entscheidungen verändern.

### Cited Findings

- Der aktuelle Kern besitzt bereits Tagesfortschritt und Monatsauswertung; eine Neuentwicklung als reines Rundenspiel ist dafür nicht erforderlich. [Zeitkern](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/world.ts:105>)
- Ausbauten und Wissensvorhaben benutzen vorhandene Reichprojekte; Forschung kann Werke, Güterproduktion und militärische Fähigkeiten verbinden. [Reich](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/reich.ts>), [Wissensbaum](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/wissensbaum.ts>)
- Amtszeitziele und Kabinettsübergänge sind bereits echte Zustände. [Zielwahl](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/amtszeit.ts:210>)

### Inferences

**Vorgeschlagene Spielschleife:**

1. **Lage verstehen:** Was läuft schlechter, wo, seit wann und weshalb? Die Übersicht zeigt drei dringliche Entwicklungen, verfügbare Mittel und laufende Verpflichtungen.
2. **Ziel setzen:** Zum Beispiel Importabhängigkeit senken, Inflation stabilisieren, eine bedrohte Region halten oder den Wiederaufbau vor dem Winter sichern. Ziele besitzen eine überprüfbare Messgröße und einen Zeithorizont.
3. **Plan zusammenstellen:** Mehrere Maßnahmen als Paket mit Alternativen: Mittel, erforderliche Mehrheit, Personal, Transport, Lizenz, Baustelle und Verwaltungsleistung. Der Spieler sieht, welche bereits laufende Aufgabe verdrängt wird.
4. **Beschließen und beauftragen:** Parlament, Kabinett, Zentralbank oder Außenpartner handeln entsprechend ihren Zuständigkeiten. Ein Klick ist ein Auftrag; politische Zustimmung, Umsetzung und Wirkung bleiben getrennte Zustände.
5. **Zeit laufen lassen:** Tage für Warnungen und unmittelbare Markt-/Versorgungsfolgen, Wochen für operationelle Aufträge und Engpässe, Monate für Konten und sektorale Anpassung. Termine und echte Planabweichungen unterbrechen; Routine wird delegierbar.
6. **Ergebnis prüfen:** „Was hat sich seit dem Beschluss geändert?“ Soll/Ist, Ursachen, Verlierer, Restkosten und neue Möglichkeiten. Der nächste Plan baut darauf auf.

**Die ersten zehn Minuten als vorgeschlagenes Erlebnis:** Spieler übernimmt ein Land mit zwei verständlichen Engpässen, inspiziert einen Ort und eine reale Lieferabhängigkeit, beschließt eine finanzierbare Sofortmaßnahme und beginnt ein längerfristiges Vorhaben. Die Sofortmaßnahme verändert innerhalb der ersten simulierten Tage einen sichtbaren Zustand; die dauerhafte Investition bleibt sichtbar in Planung/Bau. Eine mehrjährige Bahnstrecke ist nicht plötzlich fertig, nur damit das Tutorial belohnt.

**So könnte eine 45-Minuten-Sitzung aussehen:** Die folgenden Minuten sind ein zu prüfendes UX-Ziel für die Energiekrise aus Fall B, keine gemessene Spielzeit. Pausieren und zügiger Zeitvorlauf bleiben jederzeit möglich.

| Echte Sitzungszeit als Ziel | Sichtbare Situation | Was der Spieler tatsächlich tut | Simulierter Verlauf |
|---|---|---|---|
| 0–5 Minuten | Lagehinweis: Ein Lieferant fällt aus, der Reservepuffer beträgt unter den aktuellen Annahmen zwei Monate. Die Karte markiert Einfuhrroute und abhängige Industrieorte. | Warnung öffnen, Route anklicken, Herkunft der Fehlmenge und betroffene Gruppen lesen. | Partie pausiert; vorhandene Ware und bestätigte Lieferungen sind getrennt. |
| 5–12 Minuten | Drei Maßnahmenpakete mit Kosten, Entlastung und Vorlauf. | Krankenhäuser und kritische Infrastruktur priorisieren; Reservefreigabe und gezielten Ausgleich vergleichen; Paket finanzieren. | Sofortiger Beschluss, erste organisatorische Wirkung nach Tagen. Keine neue Ware durch bloße Subvention. |
| 12–20 Minuten | Zwei alternative Lieferanten, unterschiedliche Bedingungen und verfügbare Transportkapazität. | Partnerdossier öffnen, Angebot verhandeln, Ankunft und laufende Kosten prüfen, Vertrag abschließen oder ablehnen. | Bestellung läuft; ein beispielhafter Liefertermin liegt erst in drei Wochen. Diese Dauer ist ein Testparameter. |
| 20–27 Minuten | Beim Zeitvorlauf stoppt das Spiel an einer echten Abweichung: Ersatzroute hat weniger freie Kapazität als benötigt. | Engpass auf der Karte ansehen; zivile Fracht verdrängen, eine kleinere Lieferung wählen oder zusätzliche Route sichern. | Sieben bis vierzehn simulierte Tage vergehen. Die Vorratsprognose aktualisiert sich nach der Entscheidung. |
| 27–35 Minuten | Erste Ladung angekommen; Versorgung entspannt sich, Importrechnung und Haushaltsbelastung steigen. | Eingang mit dem Vertrag vergleichen; unnötig harte Rationierung reduzieren oder zur Reservebildung beibehalten; Betroffene politisch einbinden. | Nach etwa einem simulierten Monat ist die kurzfristige Wirkung überprüfbar. |
| 35–45 Minuten | Monatsabschluss zeigt stabilere Versorgung, aber Restlücke und höhere Devisenkosten. | Plan bewerten; langfristiges Effizienz- oder Erzeugungsvorhaben mit einem anderen Investitionswunsch vergleichen und beginnen; Routineüberwachung delegieren. | Einige weitere Wochen können beschleunigt vergehen. Ein langfristiges Werk bleibt eine Baustelle. |

Die Sitzung endet mit einem verständlichen Zwischenergebnis: Die unmittelbare Versorgung ist stabilisiert, eine finanzielle Belastung bleibt, und eine dauerhafte Lösung wurde begonnen. Der Spieler hat eine Krise beeinflusst und die Welt verändert; er hat weder nur Nachrichten weggeklickt noch durch einen einzigen Knopf alle Nebenfolgen beseitigt. Bei anderer Ausgangslage kann die Sitzung mit einem teuren Teilerfolg oder dem Wechsel zu einem schlechteren, aber tragfähigen Plan enden.

**Konkrete Fortschrittskette:** Heute Reserve und alternative Lieferung sichern → in Monaten ein Effizienzprogramm und einen Netzengpass bearbeiten → nach längerer Ausbildung, Bau und Lizenzierung zusätzliche heimische Produktion betreiben → in der nächsten Krise weniger importabhängig sein. Die neue Produktion benötigt Strom, Wasser, Fachkräfte und Wartung; bei größerer Kapazität verschiebt sich die Aufgabe von Notversorgung zu Auslastung, Exportverträgen und regionaler Verteilung. Ein freigeschaltetes Forschungsprojekt ist deshalb erst dann Fortschritt, wenn Umsetzung und Versorgung die neue Fähigkeit tatsächlich nutzbar machen. Vier Horizonte bleiben gleichzeitig sichtbar: heutiger Auftrag, nächster Liefer-/Fertigstellungstermin, neue Fähigkeit und langfristiges politisches Ziel.

**Fortschritt innerhalb einer Amtszeit:**

| Abschnitt | Spielerische Aufgabe | Dauerhaftes Ergebnis |
|---|---|---|
| Amtsantritt und erstes Quartal | Erbe verstehen, tragfähige Mehrheit und erste Prioritäten finden | Arbeitsfähiges Kabinett, erste Vereinbarungen, gewählte Strategie |
| Erstes und zweites Jahr | Engpässe überbrücken, Kapazitäten aufbauen, Reformen umsetzen | Baustellen, qualifiziertes Personal, neue Lieferanten, institutionelle Änderungen |
| Mittlere Amtszeit | Eigene Strategie bewährt sich oder erzeugt neue Abhängigkeiten | Tatsächliche Werke, andere Branchenstruktur, belastbare oder belastete Bündnisse |
| Letztes Amtsjahr | Krisenfolgen, Versprechen, Wahl und Vermächtnis zusammenbringen | Öffentliche Bilanz, neue Machtkonstellation, weiterlaufende Verpflichtungen |
| Weitere Amtszeit/Nachfolge | Größere Möglichkeiten bei geerbten Folgekosten | Bestehende Welt bleibt bestehen; keine kostenlose Rücksetzung der Probleme |

Dies sind dramaturgische Schwerpunkte, keine erzwungene Ereignisreihenfolge. Eine Partei muss nicht jeden Krieg erleben. Friedliche Modernisierung, regionale Diplomatie oder ein innenpolitischer Schwerpunkt müssen jeweils vollständige Partien tragen.

**Spielzeit:** Erst messen, dann festlegen. Für einen Prototyp kann man beispielsweise 60 Monatskontrollen × durchschnittlich vier Minuten = vier Stunden Grundverwaltung kalkulieren; zusätzliche Krisen- und Wahlphasen verlängern dies. Vier Minuten sind hier ein Testbudget, keine gemessene Spielerzeit und kein Ziel, jeden Monat künstlich zu füllen. Ein sinnvoller Playtest erhebt aktive Entscheidungszeit, Wartezeit, Anzahl bedeutsamer Entscheidungen und Abbruchstellen. Beschleunigung und Delegation machen ruhige Monate kurz; Krieg darf nicht durch unpausierbaren Zeitdruck künstlich anspruchsvoll werden.

**Die Karte ist Gedächtnis und Arbeitsfläche:** Gleiche Karte, wechselnde Aufgabenebenen für Versorgung, Wirtschaft, Politik und Operationen. Staatliche Großprojekte haben Zustände: geplant, finanziert, im Bau, betriebsbereit, beschädigt, im Wiederaufbau, stillgelegt. Provinzen und Länder sind keine gleich tief simulierten Einheiten: Für die Türkei kann die vorhandene Provinzebene detailliert bleiben; Außenstaaten brauchen vor allem relevante Fähigkeiten, Interessen, Handelswege und kriegsrelevante Regionen.

### Gaps

- Die optimale Länge einer Amtszeit in echter Spielzeit kann aus dem Code nicht abgeleitet werden. Schwierigkeit, Lesegeschwindigkeit, Delegation und Zahl paralleler Krisen ändern sie stark.
- Eine Fortsetzung nach Amtsverlust/Nachfolge wäre eine zusätzliche Produktentscheidung; das gegenwärtige Karriereende sollte nicht stillschweigend umdefiniert werden.

## Wie sollten Wirtschaft, Krieg und Diplomatie dieselbe Welt benutzen?

### Takeaway

Die Wirtschaft muss beantworten können, was tatsächlich verfügbar ist, wie es wohin gelangt, wer es bezahlt und wer darauf verzichten muss. Krieg wird dann zu einer besonderen Beanspruchung derselben Wirtschaft und Gesellschaft, mit eigenen räumlichen Entscheidungen und einem politischen Ziel.

### Cited Findings

- Güterbestand, militärische Bestände und Infrastrukturkapazitäten sind derzeit in unterschiedlichen Modulen repräsentiert. [Güter](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/gueter.ts:27>), [Streitkräfte](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/streitkraefte.ts:125>), [Infrastruktur](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/infrastruktur.ts:173>)
- Krieg verursacht bereits Heimatfront- und Außenfolgen; der Entwurf erweitert deren Ursachenbasis. [Kriegspreis](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/kriegspreis.ts:95>)
- Katastrophenwiederaufbau kann schon mit normalen Bauprojekten um Kapazität konkurrieren. [Katastrophen/Reich-Anbindung](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/katastrophe.ts:29>)

### Inferences

**Vorgeschlagene Mindestwirtschaft:**

| Schicht | Was gespeichert wird | Was der Spieler steuert | Was daraus folgt |
|---|---|---|---|
| Physische Güter | Vorrat, Produktion, Lieferungen, ziviler/militärischer Bedarf, Verluste | Reserve, Beschaffung, Rationierung, Exportpolitik | Reichweite, Fehlmengen, tatsächlich erfüllter Verbrauch |
| Kapazitäten | Werke, Personal, Wartung, Bau- und Verwaltungsleistung | Ausbau, Priorisierung, Ausbildung, Instandhaltung | Obergrenze für Produktion und Umsetzung |
| Transport | Korridore, Kapazität, Transitrecht, Zeit, Störung | Umleitung, Reparatur, Schutz, Abkommen | Ankunftsmenge und Ankunftszeit statt abstraktem Handelsbonus |
| Energie | Brennstoffvorrat, Erzeugung, Netzleistung, Spitzenbedarf | Bezugsquellen, Reserve, Lastpriorität, Ausbau | Tatsächliche Strom-/Wärmeversorgung von Haushalt und Betrieb |
| Unternehmen/Arbeit | Wenige Branchen, Auslastung, Beschäftigung, Investitionsbereitschaft | Rahmenbedingungen und Aufträge, keine Kontrolle jedes Betriebs | Produktion, Lohn-/Preisdruck, Steuern, Strukturwandel |
| Staatskasse | Einnahmen, bewilligte Mittel, Zahlungen, Zinsen, Schulden | Haushalt und Finanzierung | Bezahlbarkeit, Zinslast, verdrängte Aufgaben |
| Außenfinanzierung | Import-/Exportwerte, Finanzierung, Währungsbedarf, Reserven | Handel, Finanzierung, Intervention im jeweiligen institutionellen Rahmen | Abhängigkeit von Devisen und Vertrauen |
| Gesellschaft | Einkommen/Versorgung nach Gruppen und Orten, Erwartungen, Belastung | Ausgleich, Verhandlung, Investition, politische Kommunikation | Unterstützung, Streiks, Protest, Wahlverhalten |

Elektrizität darf nicht wie ein beliebig lagerbarer Brennstoff behandelt werden: Brennstoffinventar, Erzeugungsleistung, Netzengpass und gegebenenfalls expliziter Speicher sind unterschiedliche Dinge. Ebenso sind politisches Kapital, Lira, Devisen, Baukapazität und militärische Einsatzbereitschaft nicht austauschbare Punkte.

**Drei verbindliche Rechenregeln:**

- Bestand am Ende = Anfangsbestand + tatsächlich eingetroffene Produktion/Importe − tatsächlich gelieferter Verbrauch/Exporte − Verluste. Bestellungen sind noch kein Bestand. Ungedeckter Bedarf bleibt als Fehlmenge sichtbar; das System erzeugt keine Ware durch einen Indexbonus.
- Eine Beschaffung reserviert Etatmittel und verbraucht sie bei definierten Zahlungen. Was durch den normalen Verteidigungsetat gedeckt ist, wird nicht ein zweites Mal als Zusatzschuld gebucht. Überplanmäßige Mittel brauchen einen sichtbaren Nachtrag oder verdrängen andere Verpflichtungen.
- Die Außenbilanz wird aus abgewickelten Werten und ausdrücklich gekennzeichneten übrigen Strömen abgeleitet. Ein Importdefizit ist nicht automatisch exakt die Veränderung der Zentralbankreserve: Finanzierung und private Kapitalströme müssen als separate vereinfachte Brücke sichtbar bleiben.

Jeder Monat erhält eine konsistente Reihenfolge: Anfangsbestände sichern → Aufträge und Kapazitäten verteilen → produzieren/transportieren/verbrauchen → Geld- und Außenkonten abrechnen → Preise, Beschäftigung und politische Reaktionen ableiten → denselben Abschluss an alle Ansichten veröffentlichen. Tagesereignisse können Bestände und Aufträge verändern; Monatsberichte dürfen ihre Wirkungen nicht doppelt abrechnen.

**Einfacher Marktmechanismus statt allwissender Wirtschaftsplanung:** Einige Branchen und kritische Vorprodukte genügen für den ersten Ausbau. Fehlmengen, Importkosten und Auslastung beeinflussen Preise und Produktion über begrenzte, erklärte Reaktionen. Firmen können investieren oder Aufträge ablehnen, wenn Personal, Finanzierung oder Vorprodukte fehlen. Der Präsident setzt Rahmen, beschafft öffentlich und priorisiert knappe Staatsmittel. Automatische Privatproduktion bleibt ein Akteur, kein weiteres Ministerium unter vollständiger Direktkontrolle.

**Spielbarer Krieg als vorgeschlagene Schleife:**

1. **Politisches Ziel:** Gebiet verteidigen, Rückzug erreichen, Seezugang sichern oder eine begrenzte Verpflichtung erfüllen. Ziel, Erfolgskriterium und Ausstieg werden vor dem Einsatz sichtbar.
2. **Bereitschaft:** Verfügbare Formationen, ausgebildetes Personal, Gerät, Wartung, Munition, Treibstoff, Transport, Reserven und politische Ermächtigung. Mobilisierung steigert Kräfte und bindet zugleich Arbeitskräfte/Finanzen.
3. **Räumliche Aufträge:** Einige nachvollziehbare Regionen und verbindende Wege; Formationen verteidigen, verlegen, sichern oder greifen an. Reisezeit und Nachschub begrenzen Reichweite. Mehr Personal allein ersetzt keine Transportleistung.
4. **Luft und See:** Aufträge verändern Aufklärung, Schutz, Verkehrsrisiko und gegnerische Handlungsfreiheit. Das erste Ziel ist eine verständliche operative Ebene; nicht die Steuerung jedes Flugzeugs und keine bloße dekorative Frontlinie.
5. **Gegnerreaktion:** Gegner besitzen Ziele, Reserven, Bündnisse, Informationsstand und eine Einschätzung von Kosten/Risiko. Eine hohe Spannung kann Abschreckung, Drohung, begrenzte Aktion oder Krieg auslösen; sie ist keine automatische identische Angriffsuhr für jeden Staat.
6. **Wöchentliche Auswertung:** Tatsächlich erreichte Ziele, verlorenes Material, Verbrauch, Verletzte/Gefallene, Schäden, Versorgung und Ausfall ziviler Tätigkeit. Unsicherheit betrifft unbekannte Gegnerdaten; eigene Kosten bleiben nachvollziehbar.
7. **Außen- und Heimatfront:** Vertragsverletzungen, Angriffs-/Verteidigungslage, Sanktionen, Flüchtlinge, Handelsausfälle, Preise, Budget und gesellschaftliche Belastung reagieren auf diese Welt. Partner können Gegenleistungen fordern, Neutralität wählen oder glaubwürdige Verpflichtungen erfüllen.
8. **Kriegsende:** Verhandelbare Ziele, Rückzug, Garantien, Überwachung, Reparations- und Sicherheitsfragen. Militärischer Fortschritt schafft Verhandlungsspielraum, aber nicht automatisch Zustimmung zu beliebigen Forderungen.
9. **Frieden:** Demobilisierung, Veteranenversorgung, Reparaturen, Wiederaufnahme von Handel und überprüfbare Aufhebung von Sanktionen. Besatzung bindet dauerhaft Mittel; Frieden setzt die Ökonomie nicht auf den Vorkriegsstand zurück.

**Wichtige Konsequenz:** „Krise lösbar“ bedeutet handlungsfähig bleiben, Ursachen verändern, Schaden begrenzen oder einen tragfähigen Ausstieg erreichen. Es bedeutet nicht, dass jede Fehlentscheidung folgenlos reparierbar ist oder jeder Krieg gewinnbar sein muss. Ein teurer Kompromiss kann eine erfolgreiche Krisenbewältigung sein. Das Spiel muss Verluste erklären und sinnvolle Fortsetzung ermöglichen, soweit die Karriere nicht tatsächlich endet.

### Gaps

- Konkrete Preise, Produktionselastizitäten, Reichweiten und Bereitschaftswerte sind nicht durch diese Designanalyse validiert. Sie brauchen Parameterstudien und Spieltests.
- Eine vollständige taktische Kriegssimulation wäre ein eigener großer Ausbau. Für den ersten spielbaren Zusammenhang reichen begrenzte regionale Operationen mit echten Ressourcen- und Lieferfolgen; Formationsdetails können danach wachsen.

## Wie sehen drei tatsächlich spielbare Krisen aus?

### Takeaway

Jede Krise braucht beobachtbare Vorzeichen, wirksame Hebel, konkurrierende Kosten, einen messbaren Verlauf und einen Zustand nach der Krise. Die folgenden Fälle sind erfundene Testszenarien für Staatsräson, keine Prognosen realer Konflikte und keine Behauptung bereits vorhandener Mechaniken.

### Cited Findings

- Die Ausgangsbausteine Krieg, Güter, Sanktionen und Wiederaufbau sind im Projekt bereits vorhanden, wie oben belegt. Insbesondere setzt ein Lieferstopp Beschaffungsfertigstellung zurück, und Katastrophen arbeiten mit verzögert geklärten Schäden. [Lieferstopps](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/streitkraefte.ts:403>), [Schadensunsicherheit](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/katastrophe.ts:84>)

### Inferences

**Fall A: Begrenzter Grenzkrieg trifft einen Handels- und Nachschubkorridor.**

| Phase | Wahrnehmbare Lage und echte Entscheidung |
|---|---|
| Warnung | Truppenverlegung, Kündigung eines Transitabkommens, steigende Frachtkosten; Geheimdienst nennt Bandbreiten. Reserven zeigen verbleibende Tage unter geplantem Operationstempo. |
| Vorbereitung | Vermitteln und Garantie anbieten; alternativ Verteidigung vorbereiten und einen Ersatzkorridor sichern; aggressive Mobilisierung verkürzt Bereitschaft, erhöht aber Kosten/Eskalationsrisiko. |
| Ausbruch | Ein Korridor verliert Kapazität. Zivile Güter und Frontnachschub konkurrieren um die verbleibende Route. Der Spieler sieht, welche Region und welcher Produktionszweig betroffen sind. |
| Plan 1 | Front halten, Munition sparen, kritische Transporte priorisieren und Vermittlung suchen. Risiko: begrenzte Gebietsverluste oder innenpolitischer Vorwurf mangelnder Härte. |
| Plan 2 | Begrenzte Operation zur Wiederöffnung des Korridors; vorher Transport und Reserve sichern. Risiko: mehr Verluste, Sanktionen, zusätzlicher Importbedarf und Verzögerung ziviler Projekte. |
| Plan 3 | Rückzug auf haltbare Linie mit kontrollierter Evakuierung; Handelsumleitung und belastbare Waffenruhe verhandeln. Preis: Zugeständnisse, Vertrauensverlust bei Teilen des eigenen Lagers. |
| Erfolg | Gewähltes begrenztes Ziel erreicht oder tragfähiger Ausstieg; Nachschub deckt geplantes Tempo, zivile Mindestversorgung ist gesichert, Kämpfe enden unter überprüfbaren Bedingungen. |
| Scheitern/Erholung | Ungedeckter Nachschub schwächt Formationen; Schulden und gesellschaftliche Belastung bleiben. Der Spieler kann Operationen reduzieren, Ziele ändern, verhandeln und anschließend reparieren. Keine endlose Waffenruhe ohne nächste Schritte. |

Hier muss eine militärisch gute Entscheidung wirtschaftlich teuer sein können und eine wirtschaftlich günstige Entscheidung militärisch riskant. Unterschiedliche funktionierende Strategien müssen denselben Startzustand auf unterschiedliche Weise bewältigen können.

**Fall B: Energieimport- und Devisenkrise.**

Reines Rechenbeispiel in ausdrücklich fiktiven Modelleinhheiten: Monatsbedarf 100, heimisches Angebot 40, reguläre Einfuhr 60. Ein Lieferausfall nimmt 30 Einheiten Einfuhr; der Vorrat enthält 60. Ohne Anpassung werden monatlich 30 Einheiten entnommen: zwei Monate Puffer. Eine alternative vertraglich gesicherte Lieferung von 15 und eine vertretbare Bedarfsreduktion von 10 lassen nur noch fünf Einheiten Monatslücke. Der Vorrat reicht dann zwölf Monate, sofern Nachfrage, Lieferungen und Lagerverluste sonst unverändert bleiben. Jede dieser Annahmen gehört in die Vorschau; zwölf Monate sind keine garantierte Zukunft.

| Entscheidung | Entlastung | Preis oder Grenze |
|---|---|---|
| Reserve freigeben | Unmittelbar weniger Ausfälle | Endlicher Puffer, späterer Wiederaufbau muss bezahlt werden |
| Alternative Lieferung | Senkt strukturell die Lücke nach Ankunft | Höherer Devisenbedarf, Vertragsdauer, Hafen-/Pipelinekapazität |
| Last priorisieren | Kliniken/Haushalte oder kritische Produktion stabilisieren | Andere Verbraucher tragen Abschaltungen und Einkommensverluste |
| Einkommen gezielt stützen | Belastung gefährdeter Gruppen sinkt | Fiskalkosten; keine zusätzliche Energie entsteht dadurch |
| Allgemein Preise deckeln | Sichtbarer Preis kann kurzfristig sinken | Finanzierung oder Versorgungsfehlmenge bleibt; falsche Entlastungsanzeige vermeiden |
| Effizienz/Erzeugung ausbauen | Langfristig weniger Abhängigkeit | Vorlauf, Baukapazität, Komponenten und Wartung |
| Finanzierung sichern | Überbrückt Devisenbedarf | Konditionen, Schulden und politische Bindungen |

Auflösungskriterium als Spielvorschlag: essenzielle Nachfrage über mehrere Abrechnungsperioden gedeckt, Restlücke ohne schrumpfenden Notvorrat finanzierbar, Anschlussplan für Reserveaufbau vorhanden. Eine rein kosmetisch gesunkene Inflationszahl schließt die Krise nicht. Wer Versorgung nur durch massive Schulden hält, hat die Versorgungskrise stabilisiert, aber eine Finanzierungsfrage hinterlassen.

**Fall C: Erdbeben mit Wiederaufbau-, Verteilungs- und Vertrauenskrise.**

Ein Erdbeben erhält kein unrealistisches exaktes Vorhersagefenster. Vorher erkennbar sind Risikogebiete, verletzliche Bauten und Bereitschaft. Nach dem Ereignis entsteht ein unsicheres Lagebild, das Aufklärung und Hilfszugang verbessern.

| Horizont | Konkrete Handlung | Konkurrenz und sichtbare Folge |
|---|---|---|
| Erste Tage | Rettungs- und Krankenhauskapazität, Zufahrten, Notunterkünfte und externe Hilfe priorisieren | Transport und Personal reichen nicht gleichzeitig überall; offene Lücken bleiben auf der Karte sichtbar |
| Erste Wochen | Unterbringung und Grundversorgung sichern, sichere Gebäude prüfen, belastbare Zusagen machen | Ehrliche Zeitplanung kann unpopulär sein; Überversprechen erzeugt später messbare Schuld |
| Monate | Wiederaufbau priorisieren, Aufträge vergeben, andere Projekte verschieben, Kommunen und Eigentümer einbinden | Baukapazität und Materialien sind begrenzt; schneller Wiederaufbau kann anderswo Investitionen verdrängen |
| Jahre | Dauerhafte Wohnungen, Schulen, Leitungen und Erwerbsmöglichkeiten fertigstellen | Bewohner kehren nach tatsächlicher Nutzbarkeit zurück; die Karte behält Schäden und Fortschritt bis dahin |
| Innenpolitik | Regionen und Gruppen müssen Verteilung verstehen; Kontrolle und Beschwerdewege betreiben | Korruption oder ungleiche Vergabe kann den technischen Baufortschritt politisch entwerten |

Mehrere Pfade können tragen: starke staatliche Koordination, koordinierte private/kommunale Beiträge oder internationale Hilfe mit Bedingungen. Erfolg heißt zuerst Leben und Mindestversorgung sichern, anschließend Obdachlosigkeit und dauerhafte Kapazitätsverluste abbauen. Das ursprüngliche Unglück wird nicht durch einen positiven Zufriedenheitswert ungeschehen. Ein ruhigerer Nachrichtenfeed beweist keine abgeschlossene Wiederherstellung.

**Gemeinsame Fairnessregeln:** Frühwarnung wo sachlich sinnvoll; bekannte Risiken auch bei überraschenden Ereignissen; klare Fristen; vermeidbare Folgeschäden von unvermeidbarem Erstschaden unterscheiden; wenigstens zwei verständliche Reaktionspfade in normalen Testlagen; keine heimliche Kostenverdopplung; Rückschläge ohne sofortige unaufhaltbare Todesspirale; höhere Schwierigkeit durch engere Ressourcen und bessere Gegner, nicht durch falsche Anzeigen.

### Gaps

- Diese Szenarien sind Abnahmeentwürfe und müssen ausführbar werden. Es wurden keine Resultate einer implementierten neuen Krisensimulation gemessen.
- „Mindestens zwei Pfade“ ist eine Anforderung an ausgewählte Standardtestfälle. Extrem schlechte vorherige Entscheidungen dürfen den verfügbaren Handlungsspielraum real einschränken.

## Welche Oberfläche und welcher Bauplan machen diese Richtung überprüfbar?

### Takeaway

Eine gute Oberfläche ordnet die Welt um Fragen und Aufträge des Spielers. Der erste Ausbau sollte eine kleine, aber vollständige Kette vom Lieferausfall über Entscheidungen bis zur Erholung spielbar machen; danach wird dieselbe Architektur auf mehr Güter, Regionen und Konflikte ausgeweitet.

### Cited Findings

- Baulinien und Megaprojektgeometrien zeigen heute konkrete Abweichungen zwischen Darstellung und Spielbestand. [Baulinien](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/ui/atlas/neubau.ts:25>), [Megaprojekte](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/ui/atlas/vector.ts:1062>)
- Der neue Gesetzgebungsweg und alte Aktionszugänge besitzen unterschiedliche Kontextanforderungen; sichtbare Zusammenführung allein reicht deshalb nicht. [Gesetzgebung](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/gesetzgebung.ts:417>)
- JSON-Zustand und gespeicherter Zufallszustand sind bereits Grundlage; derselbe Spielzustand kann für Vorschau und Reproduzierbarkeit genutzt werden. [Speichern/Laden](</Users/yusufyeneroglu/Desktop/Staatsraeson/game/src/sim/world.ts:214>)

### Inferences

**Vorgeschlagene Oberfläche:**

- **Lage:** Die wichtigsten Abweichungen seit der letzten Kontrolle, ihr Ort, ihre Ursache und ihre nächste Frist. Kennzahlen immer mit Trend, Bezug und Veröffentlichungsdatum.
- **Karte:** Ort auswählen → dortiges Problem, Lieferverbindung, Kapazität, Bevölkerung und laufende Aufträge sehen. Ausgewählter Auftrag hebt relevante Wege und Konkurrenten hervor. Nur vorhandener Bestand wird als fertig gezeichnet.
- **Pläne:** Ein gemeinsamer Eingang für Gesetze, Bau, Beschaffung und diplomatische Pakete; die jeweilige Zuständigkeit bleibt sichtbar. Vor Beschluss: sofortige/laufende Kosten, verdrängte Aufgabe, Voraussetzungen, erste Wirkung, Hauptunsicherheit und Ausstiegskosten.
- **Akteure:** Minister, Parlament, Kommune und Außenpartner nennen ihre Interessen und Bedingungen; ein Konflikt ist nicht bloß ein roter Beziehungsbalken.
- **Verlauf:** „Warum ist das passiert?“ führt von einer Kennzahl zu den wichtigsten Buchungen, Lieferausfällen, politischen Beschlüssen und Verzögerungen. Folgen werden mit der vorherigen Vorschau verglichen.

Ein ausgeklapptes Detail darf komplex sein. Die Startfläche muss aber auch bei vielen existierenden Systemen in kurzer Zeit beantworten: Was braucht mich jetzt? Was kann ich tun? Was kostet es? Wann weiß ich, ob es wirkt?

**Technische Leitplanken als Designvorschlag:** Ein geprüfter Befehl reserviert/verbraucht Kosten genau einmal und erzeugt ein Ergebnis mit Kennung; UI, Ereignis, Minister und Texteingabe nutzen denselben Weg. Fachmodule behalten ihre Verantwortung. Ein schlankes Journal enthält Geld-, Mengen- und Kapazitätsbuchungen sowie ihre Ursachen; vollständiges Event-Sourcing aller bisherigen Weltmutationen ist für den ersten Ausbau nicht Voraussetzung. Historische Anzeigen lesen ausdrücklich historische Daten, aktuelle Anzeigen denselben aktuellen Abschluss. Unbekannte Gegnerwerte bleiben Schätzungen; eigene Konten werden nicht künstlich verrauscht.

| Reihenfolge | Vollständiger Liefergegenstand | Abnahmekriterien |
|---|---|---|
| 1. Gemeinsame Wahrheit | Ein Aktionsweg, klare Kostenbesitzer, Budgetdeckung, Bestands-/Lieferbuchungen, zeitlich einheitliche Sichten | Gescheiterter Befehl verändert keine Kosten; erfolgreiche Handlung bucht genau einmal; Mengen gehen nicht unter null oder entstehen ohne Herkunft; Laden bewahrt Zustand |
| 2. Eine zivile Versorgungskrise | Ein kritischer Energieträger, mehrere Lieferquellen, Reserve, Transportgrenze, Finanzierung und drei wirksame Maßnahmen | Ausfall → Lagerabbau → tatsächliche Fehlmenge; Umleitung hilft erst bei Ankunft; Zahlungen und Devisenbedarf sichtbar; mindestens zwei tragfähige Teststrategien |
| 3. Ein begrenzter Krieg | Wenige Regionen/Formationen, Nachschub, begrenzte Ziele, Gegnerreaktion, Handelsfolgen und verhandelbares Ende | Ohne Versorgung sinkt Einsatzfähigkeit; zivile Folgen entsprechen realen Engpässen; kein automatischer Gewinn; Waffenruhe besitzt Fortschritt/Verstoß/Ausstieg; Nachkriegskosten bleiben |
| 4. Lesbare Hauptoberfläche | Karte, Lage, Auftrag, Vorschau und Verlauf für genau diese Kette | Spieler findet Ursache/Option/Kosten/Frist ohne Suchlauf durch viele Dossiers; fertiggestellte oder zerstörte Werke sehen entsprechend aus |
| 5. Mehrjährige Entwicklung | Investition, Wissen, Institutionen, Wahl und nächste Amtszeit tragen die Folgen weiter | Gute Vorsorge verbessert späteren Testfall; bloßes Nichtstun ist keine immer dominante Strategie; mehrere politische Wege sind spielbar |
| 6. Erweiterung und Balance | Weitere Güter, Regionen, Katastrophen, diplomatische und innenpolitische Konflikte | Neue Inhalte nutzen dieselben Konten, Befehle, Vorschauen und Abschlussregeln; keine erneuten parallelen Teilwelten |

Die Reihenfolge beschreibt Abhängigkeiten, keine rein lineare Trennung von Oberfläche und Hintergrund: Jede Stufe braucht sofort ihre benutzbare Anzeige und wird in der Partie geprüft. Die Endprüfung der ersten vollständigen Kette muss mit normalen Spieleraktionen laufen, nicht durch direkte Testmanipulation interner Werte.

**Sinnvolle Tests:** Bestandsidentitäten; Budgetdeckung; Idempotenz und Kostenatomarität; gespeicherter Zustand und Zufall; Zusammenhang gleicher Ursache in Karte/Dossier/Bericht; gegensätzliche Strategien am gleichen Ausgangszustand; Erholung nach Nachteil; mehrjährige Investitionsfolgen. Zusätzlich echte Spieltests mit Beobachtung der Entscheidungsfindung. Eine große Zahl bestandener Unit-Tests beweist allein weder Orientierung noch langfristige Spannung.

**Was nicht als erste Maßnahme hilft:** Mehr unverknüpfte Ereignisse, zusätzliche unabhängige Fortschrittsbäume, neue Reiter für alte Zustände oder große technische Totalneuschreibung ohne ausführbares Testszenario. Die vorhandene Substanz ist ausreichend, um zuerst einen ganzen Ablauf glaubwürdig zu machen.

### Gaps

- Keine Aufwandsschätzung in Tagen/Wochen: Anzahl betroffener Module ist sichtbar, Integrationsrisiko und erforderliche Balancearbeit sind noch nicht hinreichend erprobt.
- Der hier vorgeschlagene erste Ausbau ist eine Grundlage, nicht die vollständige Erfüllung des langfristigen Spielanspruchs. Die umfassende Verbesserung bleibt ein Produktentwicklungsprogramm mit überprüfbaren Zwischenständen.
