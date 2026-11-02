# Versorgung als Regierungsentscheidung

> Stand dieses Berichts: 29.10.2026. Die anschließende Verbindung mit Parlament, Koalition und Opposition ist in [VERSORGUNG_PARLAMENT_2026-10-30.md](VERSORGUNG_PARLAMENT_2026-10-30.md) beschrieben. Neue Programme benötigen jetzt ein Votum; bestehende Aufträge bleiben gültig.

## Spielbare Änderung

Die Wirtschaftsakte und das Kriegsdossier zeigen ein gemeinsames Kabinettsbriefing. Die Versorgungskarte führt unmittelbar dorthin und zu den betroffenen Ländern. Operative Reparaturen, Luftbrücken und Depotaufträge bleiben optional unter Details verfügbar; die bisher erteilten Aufträge bleiben erhalten.

### Regierungskurs

Anteilig, Bevölkerung zuerst oder Streitkräfte zuerst. Ein Wechsel kostet 3 politisches Kapital und bindet für 30 Tage. Die Auswahl verändert die tatsächliche regionale Warenverteilung. Bei militärischem Vorrang belasten tatsächliche zivile Ölengpässe zusätzlich das Regierungsvertrauen. Der Kurs allein schenkt keine Zustimmung und überwindet keine Streckensperre.

### Drei befristete Programme

- **Grundversorgung absichern:** 4 Kapital, einmalig 0,04 % BIP auf Schulden. 90 Tage lang −10 % ziviler Öl-/Gasbedarf, −5 % Produktion von Stahl, Elektronik und Dünger. Nahrungs-, Medikamenten- und Düngerexporte pausieren; die vorhandene Mengen- und Handelsbilanz erfasst Vorräte und entgangene Erlöse. Betroffene ausländische Kunden verlieren beim Beschluss je einen Punkt Vertrauen und Handelsbereitschaft (mit bestehenden Länderkopplungen). Monatlich kostet die Einschränkung 0,25 Regierungsvertrauen. Vorhandene individuelle Exportstopps überdauern das Paket; währenddessen sind widersprechende Einzelinstrumente gesperrt.
- **Energieabkommen:** 5 Kapital, einmalig 0,02 % BIP. Wahl zwischen Aserbaidschan (Ostpipeline/Erzurum) und USA (LNG/İzmir). Nach 30 Tagen für 180 Tage bis zu 20 % des normalen monatlichen Gasbedarfs zusätzlich, nur für eine verbleibende Beschaffungslücke. Tatsächliche Lieferungen kosten 20 % mehr als den Referenzpreis; diese Zahlung läuft einmal über die vorhandene Außenhandels-/Devisenrechnung. Krieg, eigene oder fremde Sanktionen, Handelsblockaden und Vertrauen unter 40 setzen Zusatzlieferungen aus. Physische Transportkapazitäten gelten weiterhin. Tatsächliche Lieferungen verbessern die Partnerbeziehung; die Lieferung bleibt von diesem Partner abhängig.
- **Wiederaufbau:** 6 Kapital, einmalig 0,08 % BIP auf Schulden. Nach 21 Tagen für 90 Tage repariert das Ministerium pro Monatsabschluss bis zu vier der am schwersten beschädigten sicheren Inlandskorridore, jeweils bis zu 35 Prozentpunkte Schaden. Keine manuelle Streckenwahl notwendig. Reparaturen bleiben erhalten; besetzte/umkämpfte Wege und Frontkorridore sind ausgenommen.

Alle Werte sind Spielparameter. Fristen bezeichnen früheste Einsatzbereitschaft; Waren, Reparaturen und politische Reaktionen werden monatlich abgerechnet. Die Programme enden automatisch und werden nicht automatisch kostenpflichtig verlängert.

## Rückmeldung und Grenzen

Das Briefing erklärt vor dem Beschluss Wirtschaft, Innen- und Außenpolitik, Kosten und Laufzeit. Die Monatsbilanz zeigt durchschnittliche zivile Bedarfsdeckung, tatsächliche zusätzliche Gasmengen und Preisaufschläge, Reparaturen und den Versorgungsbeitrag zum Regierungsvertrauen. Der Durchschnitt bezieht sich auf Warengruppen, nicht auf einen Bevölkerungsanteil.

Vertrauen reagiert zusätzlich auf tatsächliche Erholung oder Verschlechterung der Versorgung (höchstens ±0,8 Punkte je Monatsabschluss). Das ist kein kausaler Nachweis, dass allein der eigene Beschluss die Änderung ausgelöst hat; übrige Ereignisse und Regierungsmaßnahmen wirken weiter. Diese Änderung führt weder ein neues parlamentarisches Gesetzgebungsverfahren noch individuelle Koalitionsverhandlungen für die Programme ein. Sie nutzt bestehendes politisches Kapital, das Vertrauens-/Wählernetz, Staatsverschuldung und Auslandsbeziehungen.

Bei noch nicht abgerechneten Fronten wird kein fiktiver Deckungsgrad angezeigt. „Ohne Versorgung“ bezeichnet fehlende Lieferung; eine tatsächliche militärische Streckensperre wird gesondert erklärt. Der Versorgungsfaktor ist nicht die gesamte Kampfstärke.

## Prüfung

Gezielte Tests decken Mengen-/Depotbilanz, bezahlte und gebundene Kurse, Fristen/Ende/Doppelaufträge, Exportstopps, Gaspreis und Herkunft, isolierte Eintrittsknoten, Sanktionen/Krieg, automatische Reparaturen, besetzte Wege, Speichern/Laden und Deutsch/Englisch/Türkisch ab. Build und Browserprüfung erfolgen gegen die lokale Vorschau auf Port 5188. Keine Veröffentlichung oder Übertragung auf den anderen Projektzweig.

### Verifiziert am 29.10.2026

- Letzter gezielter Lauf: 71 bestanden, 0 Fehler, einschließlich 15 neuer Prüfungen zur Regierungspolitik; Protokoll `/private/tmp/nwo-politik-tests.json`.
- Gesamtlauf: 2.000 bestanden, 0 Fehler, 8 übersprungen (sieben Tests benötigen einen externen alten Spielstand; eine vorhandene Bot-Tabelle ist deaktiviert). `_extrakt.test.ts` wie beim vorherigen Lauf ausgeschlossen, da dessen externe Claude-Scratchpad-Datei nicht vorliegt. Protokoll `/private/tmp/nwo-politik-gesamt.json`. Die drei zuletzt ergänzten Regressionstests sind im gezielten Lauf enthalten.
- TypeScript und Produktionsbuild erfolgreich. Vorhandene Buildhinweise zu `infrastrukturEtat` und Paketgrößen bleiben bestehen.
- Browser: Karte führt direkt zur Versorgungsakte; Kurswechsel zieht 3 Kapital ab, sperrt erneuten Wechsel bis 5. Juli; Aserbaidschan-Vertrag zieht 5 Kapital ab, beginnt nach Vorbereitung frühestens 5. Juli und endet 1. Januar. Beide Beschlüsse und Kapitalstand 138 bleiben nach Neuladen erhalten. Prüfungen erfolgten im vorhandenen Testspielstand.
- Breites Fenster und 700 × 800 geprüft. Kein horizontaler Überlauf; im schmalen Fenster überdecken Hinweise/Seitenleiste die Versorgungsvorlage nicht mehr. Temporäre Größenänderung zurückgesetzt.
