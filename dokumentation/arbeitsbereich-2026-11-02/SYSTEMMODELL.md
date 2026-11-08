# NWO — Systemmodell: Alles hängt mit allem zusammen

Stand: 20. Oktober 2026. Antwort auf die Anforderung: **Wirtschaft beeinflusst Zufriedenheit, Beziehungen beeinflussen Verträge, jede Aktion erzeugt eine Reaktion.** Dieses Dokument ist kein weiteres Weltmodell, sondern die **Verkabelung** der bestehenden Systeme. Es legt fest, welche Größen es gibt, wie sie aufeinander wirken, wo Verzögerungen sitzen und wie das Spiel beweist, dass keine Insellösung entsteht.

**Grundsatz:** Alles ist verbunden, aber nicht alles ist gleichzeitig sichtbar. Der Spieler sieht 5–7 Primärkennzahlen; der Rest liegt einen Klick tiefer. Die Simulation rechnet das ganze Netz, die Oberfläche zeigt nur die relevante Kette.

## 1. Die acht Domänen

| Domäne | Kernvariablen | Was der Spieler davon sieht |
|---|---|---|
| **Wirtschaft** | Wachstum, Inflation, Arbeitslosigkeit, Haushalt, Schulden, Zins, Wechselkurs, Risikoaufschlag, Investitionen, Reallöhne, Energiepreise | Inflation, Arbeitslosigkeit, Haushalt, Wachstum; Rest per Drill-down |
| **Gesellschaft** | Zufriedenheit je Gruppe/Region, gefühlte Teuerung, Vertrauen, Protest, Migration, Gesundheit/Bildung | Zustimmung, Protest, Vertrauen, Gruppen |
| **Politik** | Präsidentenzustimmung, Koalitionsstabilität, Parteien, Mandate, politisches Kapital, Wahlbeteiligung | Zustimmung, Koalition, Wahl |
| **Institutionen** | Verwaltungskapazität, Justizunabhängigkeit, Korruption, Zentralbank-Glaubwürdigkeit, Sicherheitskapazität | Rechtsstaat, Korruption, Kapazität |
| **Diplomatie** | Beziehungen je Partner (Handel, Sicherheit, Vertrauen, Konflikt), Reputation, Bündnisse, Verhandlungshebel, Vertragsportfolio | Beziehungsmatrix, Verträge, Verhandlungen |
| **Sicherheit** | Bedrohung, Einsatzbereitschaft, Beschaffung, Ausbildung, Geheimdienstqualität | Sicherheitslage, Beschaffung |
| **Projekte/Umwelt** | Projektpipeline, Infrastruktur, Wohnungsangebot, Energie, Wasser, Katastrophenrisiko, Emissionen | Karte, Projekte, Umwelt |
| **Medien** | Medienfreiheit, regierungsnahe Reichweite, Skandalsalienz, Social-Media-Stimmung | Zeitung, Skandal, Stimmung |

## 2. Die Grundregel: Aktion → Reaktion

Jede Spieleraktion durchläuft dieselbe Kette:

```
Absicht
  → Prüfung (Befugnis, Recht, Geld, Kapazität)
  → Beschluss
  → Umsetzung (Ministerium, Verfahren, Widerstand)
  → Wirkung (sofort / Tage / Monate)
  → Reaktion (Wähler, Medien, Opposition, Partner, Märkte)
  → Rückkopplung (neue Entscheidung, neue Information)
```

**Keine Aktion ändert den Zustand direkt.** Jede Änderung ist ein Event mit Ursache, Quelle, Zeitpunkt und Verantwortlichem. Die UI kann jede Zahl auf diese Kette zurückführen.

## 3. Die Interaktionsmatrix (Auszug)

Die Matrix ist bewusst nicht vollständig; sie zeigt die **Pflichtkanten**, die im ersten Build funktionieren müssen. Jede Kante hat: Mechanismus, Verzögerung, sichtbare Reaktion.

| Von → Nach | Mechanismus | Verzögerung | Sichtbare Reaktion |
|---|---|---|---|
| Wirtschaft → Gesellschaft | Inflation/Reallöhne/Jobs verändern Gruppen-Zufriedenheit | Wochen–Monate | Umfragen, Proteste, Stammtisch |
| Wirtschaft → Politik | Arbeitslosigkeit/Preise beeinflussen Zustimmung und Wahl | Monate | Zustimmung, Parteien, Wahl |
| Wirtschaft → Institutionen | Haushalt bestimmt Kapazität; Krisen belasten Verwaltung | Monate | Wartezeiten, Ausfälle |
| Wirtschaft → Diplomatie | Handel/Energieabhängigkeit bestimmen Hebel | Wochen–Jahre | Verhandlungsmacht, Angebote |
| Gesellschaft → Politik | Zufriedenheit/Proteste beeinflussen Koalition und Wahl | Tage–Monate | Proteste, Koalitionskrise |
| Gesellschaft → Wirtschaft | Konsum, Arbeitsangebot, Brain Drain, Steuermoral | Monate–Jahre | Wachstum, Steuereinnahmen |
| Politik → Wirtschaft | Steuern, Ausgaben, Zins, Regulierung | Tage–Jahre | Budget, Nachfrage, Investitionen |
| Politik → Institutionen | Ernennungen, Reformen, Haushalt | Monate–Jahre | Kapazität, Unabhängigkeit, Korruption |
| Institutionen → Wirtschaft | Umsetzung, Rechtsstaat, Korruption | Wochen–Jahre | Investitionen, Wachstum, Inflation |
| Institutionen → Gesellschaft | Dienstleistungen, Justiz, Korruption | Monate–Jahre | Zufriedenheit, Vertrauen |
| Diplomatie → Wirtschaft | Handel, Energie, Kredite, Sanktionen | Tage–Jahre | Preise, Wachstum, Haushalt |
| Diplomatie → Sicherheit | Bündnisse, Waffen, Ausbildung, Geheimdienst | Monate–Jahre | Bedrohung, Einsatzbereitschaft |
| Sicherheit → Politik | Bedrohung/Erfolge beeinflussen Zustimmung | Tage–Monate | Rally, Opposition, Budget |
| Sicherheit → Diplomatie | Einsatzbereitschaft schafft Hebel | Wochen–Monate | Verhandlungsmacht, Abschreckung |
| Projekte → Wirtschaft | Bau, Jobs, Infrastruktur, Schulden | Monate–Jahre | Wachstum, Haushalt, Region |
| Projekte → Gesellschaft | Wohnen, Jobs, Verdrängung, Umwelt | Monate–Jahre | Zufriedenheit, Protest, Migration |
| Medien → Politik | Framing, Skandale, Agenda | Tage–Wochen | Zustimmung, Koalition, Wahl |
| Medien → Gesellschaft | Vertrauen, Angst, Empörung | Tage–Wochen | Zufriedenheit, Protest |
| Gesellschaft → Medien | Aufmerksamkeit, Viralität | Tage | Schlagzeilen, Skandale |
| Umwelt → Wirtschaft | Dürre, Energie, Katastrophe | Wochen–Jahre | Preise, Haushalt, Wachstum |
| Umwelt → Gesellschaft | Wasser, Luft, Wohnen, Gesundheit | Monate–Jahre | Zufriedenheit, Gesundheit |
| Wirtschaft → Umwelt | Investitionen, Energieverbrauch, Emissionen | Jahre | Luft, Wasser, Klima |

**Pflichtregel:** Jede Domäne muss mindestens eine eingehende und eine ausgehende Kante haben. Keine Inselsysteme. Ein automatischer Test prüft die Graph-Konnektivität.

## 4. Die wichtigsten Rückkopplungen

| Schleife | Verlauf | Risiko | Bremse |
|---|---|---|---|
| **Reformschleife** | Zufriedenheit ↑ → Zustimmung ↑ → Kapital ↑ → Reformen ↑ → Leistung ↑ → Zufriedenheit ↑ | Selbstverstärkung, zu einfach | Ressourcen, Widerstand, Zeit |
| **Inflationsschleife** | Inflation ↑ → Zufriedenheit ↓ → Druck auf Zentralbank → Zins ↓ → Wechselkurs ↓ → Inflation ↑ | Runaway | Glaubwürdigkeit, Importe, Erwartungen |
| **Austeritätsschleife** | Defizit ↓ → Ausgaben ↓ → Zufriedenheit ↓ → Protest ↑ → Investitionen ↓ → Wachstum ↓ → Defizit ↑ | Backfire | Timing, Kommunikation, Schutzausgaben |
| **Vertragsschleife** | Beziehung ↑ → Verträge ↑ → Handel/Energie ↑ → Wachstum ↑ → Stabilität ↑ → Beziehung ↑ | Abhängigkeit, Lock-in | Partnerinteressen, Diversifikation |
| **Korruptionsfalle** | Korruption ↑ → Vertrauen ↓ → Investitionen ↓ → Wachstum ↓ → Budget ↓ → Korruption ↑ | Trap | Transparenz, Justiz, externe Kontrolle |
| **Repressionsschleife** | Protest ↑ → Repression ↑ → kurzfristig Ruhe, langfristig Vertrauen ↓ → Beziehungen ↓ → Verträge ↓ → Wirtschaft ↓ → Protest ↑ | Delayed blowback | Medien, Gerichte, internationale Reaktion |
| **Sicherheitsschleife** | Bedrohung ↑ → Rüstung ↑ → Budget ↓ → Zufriedenheit ↓; oder Bündnis ↑ → Sicherheit ↑ → Bedrohung ↓ | Budget vs. Schutz | Diplomatie, Lastenteilung |
| **Projektschleife** | Projekt → Jobs/Wachstum → Zufriedenheit ↑; Schulden/Korruption/Umwelt → Zufriedenheit ↓ | Delayed backlash | Planung, Transparenz, Ausgleich |
| **Bildungsschleife** | Bildung/Gesundheit → Produktivität ↑ → Wachstum ↑ → Budget ↑ → Bildung/Gesundheit ↑ | Sehr langsam | Generationen, Brain Drain |

**Regel gegen Runaway:** Jede positive Schleife braucht eine Bremse (Ressource, Zeit, Opposition, Markt, Wahl). Jede negative Schleife braucht eine Erholung (Vertrauen, Reform, externe Hilfe). Kein Wert darf unendlich wachsen oder dauerhaft auf Null fallen.

## 5. Beziehungen und Verträge

### 5.1 Beziehungsvektor

Jeder Partner hat vier Dimensionen (0–100):

- **Handel:** Verflechtung, Exporte/Importe, Investitionen.
- **Sicherheit:** Bündnis, Bedrohungswahrnehmung, Kooperation.
- **Vertrauen:** Zuverlässigkeit, historische Belastung, Vertragstreue.
- **Konflikt:** offene Streitpunkte, Vetos, Sanktionen.

Dazu **Interessenausrichtung** (0–100), **innenpolitische Vetospieler** und **Verhandlungshebel**. Der effektive Beziehungswert ist kein einzelner Skalar, sondern ein Vektor; die UI zeigt ihn als Radar/Profil.

### 5.2 Vertragsstufen

| Stufe | Beispiele | Mindestbeziehung | Was sie bringt |
|---|---|---|---|
| 0 | Kultur, humanitäre Hilfe, Visa-Erleichterung | niedrig | Reputation, Soft Power, wenig Kosten |
| 1 | Handelsabkommen, Zoll, Landwirtschaft | mittel | Exporte, Preise, Wachstum |
| 2 | Energie, Infrastruktur, Investitionen, Kredite | mittel–hoch | Energie, Kapital, Haushalt, Abhängigkeit |
| 3 | Rüstung, Ausbildung, Geheimdienst | hoch | Sicherheit, Readiness, Abschreckung |
| 4 | Bündnis, Garantie, Zollunion, Union | sehr hoch | strategische Bindung, Schutz, Marktzugang |

**Bessere Beziehungen bedeuten nicht automatisch einen Vertrag.** Sie erhöhen:

- die **Anzahl** verfügbarer Vertragstypen,
- die **Qualität** der Bedingungen (Preis, Laufzeit, Konditionen),
- die **Ratifikationswahrscheinlichkeit**,
- die **Flexibilität** des Partners bei Klauseln,
- die **Bereitschaft** zu Garantien und Mediation.

Aber es bleiben: Partnerinteressen, rote Linien, Parlament, öffentliche Meinung, Dritte (NATO, EU, USA, Russland), Recht und Budget.

### 5.3 Vertragslebenszyklus

```
Angebot → Verhandlung → Unterschrift → Ratifikation
→ Umsetzung → Einhaltung/Bruch → Nachverhandlung/Kündigung
```

Jede Phase hat Events und Reaktionen:

- **Angebot:** Partner prüft Interesse, Beziehung, innenpolitische Kosten.
- **Verhandlung:** Klauseln, Pakete, Side-Payments, Druck, Spoiler.
- **Unterschrift:** rechtlich bindend, aber noch nicht umgesetzt.
- **Ratifikation:** Parlament, Gerichte, Koalition, öffentliche Meinung.
- **Umsetzung:** Lieferungen, Zahlungen, Ausbildung, Monitoring.
- **Bruch:** Vertrauen ↓, Reputation ↓, Vertragsstrafen, Gegenmaßnahmen.
- **Nachverhandlung:** neue Beziehung, neue Bedingungen.

**Vertragswirkung:** Jeder Vertrag verändert mindestens zwei Domänen. Beispiel EU-Zollunion: Handel ↑, Wachstum ↑, Preise ↓, aber Anpassungskosten, Verlierer in Sektoren, Ratifikationsrisiko. Beispiel Rüstungsdeal: Readiness ↑, Budget ↓, Abhängigkeit ↑, Drittlandbeziehung ↓.

### 5.4 Vertragsqualität sichtbar machen

Jede Vertragskarte zeigt:

- Stufe und Voraussetzungen („Vertrauen 62/60", „Parlament skeptisch", „Partner will X").
- Was der Partner will, was er gibt, was er nicht gibt.
- Gewinner/Verlierer in Wirtschaft, Gesellschaft, Sicherheit.
- Ratifikationsrisiko und Umsetzungsdauer.
- Was passiert, wenn der Vertrag bricht.

## 6. Zufriedenheit als Scharnier

Zufriedenheit ist die Brücke zwischen Wirtschaft, Politik und Gesellschaft. Sie ist **gruppen- und regionsspezifisch**, nicht ein nationaler Skalar.

```
Zufriedenheit(Gruppe, Region) =
  Basis
  + Gewicht_Realeinkommen × Realeinkommen
  + Gewicht_Dienste × Dienstleistungen
  + Gewicht_Sicherheit × Sicherheit
  + Gewicht_Identität × Identität/Werte
  + Gewicht_Fairness × wahrgenommene Fairness
  + Gewicht_Medien × Medienframe
  − Gewicht_Inflation × gefühlte Teuerung
  − Gewicht_Korruption × wahrgenommene Korruption
  − Gewicht_Protest × Protestdruck
```

Die Gewichte sind gruppenspezifisch: Rentner reagieren stärker auf Inflation, junge Menschen auf Jobs/Wohnen, Konservative auf Identität/Sicherheit, Exportarbeiter auf Wechselkurs/Jobs.

**Zufriedenheit wirkt auf:**

- Zustimmung und Wahl,
- Protest- und Streikneigung,
- Kooperationsbereitschaft bei Reformen,
- Steuermoral und Informalität,
- Brain Drain und Migration,
- Investitionsklima,
- Beziehungen (innenpolitische Ratifikation, Glaubwürdigkeit).

**Wichtig:** Zufriedenheit ist nicht dasselbe wie Zustimmung. Eine Gruppe kann mit der Wirtschaft unzufrieden sein und trotzdem die Regierung unterstützen, weil sie Angst vor der Alternative hat. Das Modell trennt **Zufriedenheit**, **Vertrauen** und **Wahlabsicht**.

## 7. Akteursreaktionen

Jede Aktion erzeugt Reaktionen von:

- **Wählern/Gruppen:** Zufriedenheit, Protest, Wahl.
- **Medien:** Framing, Skandal, Agenda.
- **Opposition:** Angriff, Alternative, Kooperation.
- **Koalition:** Loyalität, Forderung, Bruch.
- **Ministerium/Verwaltung:** Umsetzung, Widerstand, Verzögerung.
- **Gerichte:** Prüfung, Blockade, Legitimation.
- **Ausländische Partner:** Angebot, Druck, Rückzug, Gegenangebot.
- **Märkte:** Zins, Wechselkurs, Risikoaufschlag.

Die Reaktion folgt **Interessen + Informationen + Beziehung + Macht**. Nicht jede Gruppe reagiert gleich; die UI zeigt die wichtigsten zwei bis drei Reaktionen, der Rest steht in der Akte.

## 8. Integrationstests: Der Beweis, dass alles funktioniert

### 8.1 Graph-Test

- Jede Domäne hat mindestens eine eingehende und eine ausgehende Kante.
- Jede Aktion erzeugt mindestens ein Event und eine Reaktion innerhalb von 30 Tagen.
- Keine Aktion ändert eine Variable ohne Event.
- Jede angezeigte Zahl ist auf eine Kante, eine Quelle und einen Zeitpunkt zurückführbar.

### 8.2 Fünf Pflichtketten

1. **Mindestlohn:** Mindestlohn ↑ → Lohnkosten ↑ → Preise ↑ → gefühlte Teuerung ↑ → Zufriedenheit ↓ → Zustimmung ↓ → Koalitionsdruck ↑.
2. **EU-Beziehung:** Beziehung ↑ → Zollunion-Gespräch → Handel ↑ → Wachstum ↑ → Zufriedenheit ↑; wenn Parlament blockiert → Vertrauen ↓ → Beziehung ↓.
3. **Erdbeben:** Ereignis → Haushalt ↑ → Schulden ↑ → Risikoaufschlag ↑ → Lira ↓ → Inflation ↑ → Zufriedenheit ↓ → Protest ↑.
4. **Korruptionsskandal:** Skandal → Vertrauen ↓ → Medien ↑ → Zustimmung ↓ → Koalition ↓; Untersuchung → Trust langsam ↑, aber Konflikt in der eigenen Partei.
5. **Rüstungsdeal:** Beschaffung → Budget ↓ → Readiness ↑ → Bedrohung ↓ → Beziehung zu Ally ↑; Lieferverzug → Readiness ↓ → Bedrohung ↑ → Zustimmung ↓.

### 8.3 Langzeit- und Extremtest

- 20 Jahre Simulation ohne Crash, ohne unendliche Werte, ohne Null-Kollaps.
- Extremwerte (Inflation 200 %, Arbeitslosigkeit 50 %, Zustimmung 5 %) erzeugen plausible Ketten, keine Division durch Null.
- Keine dominante Strategie in 100 automatisierten Läufen.
- Jede Krise hat mindestens zwei Wege und zwei Verlierer.

### 8.4 Erklärungstest

- 80 % der Testpersonen können nach einer Krise die drei Haupttreiber benennen.
- Jede Wirkung zeigt maximal fünf Glieder; danach „Sonstige".
- Jede Zahl beantwortet: Woher? Wann? Wer zahlt? Wer profitiert?

## 9. Umsetzungsreihenfolge

1. **State-Schema** für alle acht Domänen (JSON/TypeScript-Typen).
2. **Graph-Datei** mit Knoten, Kanten, Delays, Quellen, Unsicherheit.
3. **Simulationskern** mit festem Tagestick und Event-Log.
4. **Aktions-Pipeline** (Absicht → Prüfung → Umsetzung → Wirkung → Reaktion).
5. **Beziehungs- und Vertragsmodell** (4 Dimensionen, 5 Stufen, Lebenszyklus).
6. **Zufriedenheitsmodell** (7 Gruppen, Regionen, Salienzen).
7. **UI-Inspector** für Ketten und „Warum?".
8. **Graph-Tests** und fünf Pflichtketten.
9. **Dann** Content, Krisen, Figuren, Projekte.

**Nicht zuerst:** Content-Menge, Art, 19 Szenarien, volle Weltpolitik. Zuerst muss das Netz tragen.

## 10. Was nicht passieren darf

- **Spaghetti-UI:** Der Spieler sieht nicht alle Kanten gleichzeitig; nur die relevante Kette.
- **Isolierte Systeme:** Kein System ohne Ein- und Ausgang.
- **Zahlen ohne Kante:** Keine Zahl, die nicht aus dem Graphen kommt.
- **Aktion ohne Reaktion:** Keine Entscheidung, die nur den Zustand ändert und niemanden interessiert.
- **Reaktion ohne Grund:** Keine KI-Reaktion, die nicht aus Interesse, Information, Beziehung oder Macht folgt.
- **Runaway:** Keine Schleife ohne Bremse.
- **Blackbox:** Keine Wirkung, die nicht in fünf Gliedern erklärbar ist.

**Kurz:** NWO ist kein Stapel von Systemen, sondern ein Netz. Der erste Build muss beweisen, dass eine Entscheidung durch Wirtschaft, Gesellschaft, Politik, Institutionen, Medien und Diplomatie läuft — und dass der Spieler diese Kette versteht.
