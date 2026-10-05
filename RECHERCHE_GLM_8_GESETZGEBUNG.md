# GLM-Recherche 8: Gesetzgebung als Konflikt (05.10.2026)

Auftrag: GLM_AUFTRAG_RECHERCHE.md, Thema 8. Besonderheit: Der Großteil dieses Themas existiert bereits als Arbeitsprodukt — die Verfahrensrecherche (`RECHERCHE_GESETZGEBUNG_TUERKEI_2026-10-05.md`: Art. 89 Rückgabe, Haushaltsfristen, KHK→Kararnamen, Kommissionen) und die **20 Gesetzesbausteine mit Klauseln und Konfliktlinien** (`game/src/data/gesetze/`: für jede Klausel-Stufe wer fordert, wer ablehnt, ein Satz Begründung). Diese Datei ordnet die Felder den TBMM-Verfahrenswegen zu und nennt die typischen Kompromisse. Primärquellen: TBMM/Verfassung (siehe Gesetzgebungsrecherche), mevzuat.gov.tr. Stand: 05.10.2026.

## 1. Kurzfassung

Der Weg eines Gesetzes ist im Projekt bereits als Konfliktkette gebaut: Referentenentwurf → Kabinett → Ausschuss (Änderungsanträge, Klauseltausch) → Plenum (namentliche Abstimmung, Abweichler) → Präsident (Unterschrift oder Rückgabe nach Art. 89 mit der Mitglieder-Mehrheit als Wiederannahmeschwelle) → Verfassungsgericht → Umsetzung je Provinz → Wirkungsbericht → Novelle. Die 20 wichtigsten Gesetzesfelder liegen als Bausteine vor; jedes trägt echte Konfliktlinien mit benannten Akteuren. Was diese Datei ergänzt: die Zuordnung zu den 24 ständigen Ausschüssen, die Erlasse-Route als zweiter Weg mit Grenzen, und die typischen Kompromissmuster der türkischen Praxis. Für das Spiel: Der Spieler erlebt die Gesetzgebung nicht als Formular, sondern als Serie von Tauchkonflikten mit Fristen (Haushalt im Oktober, Mindestlohn im Dezember) und einem Präsidenten-Veto mit echtem Preis.

## 2. Befund: Weg, Wege-Grenzen, Zuordnung

### 2.1 Der Weg (aus der belegten Verfahrensrecherche, kompakt)

| Stufe | Regel | Quelle |
|---|---|---|
| Vorlage | Ressort-Referentenentwurf → Kabinett → TBMM-Einbringung | Gesetzesrecherche Abschnitt 2 |
| Ausschuss | Zuständiger von **24 ständigen Ausschüssen** (Justiz, Verfassung, Planung und Haushalt, Auswärtige …); Änderungsanträge der Fraktionen nach Besetzungsstärke | TBMM-Geschäftsordnung (Liste zu prüfen) |
| Plenum | Namentliche Abstimmung; Abweichler sichtbar (Koppelt an Fraktionsdisziplin/Linienabstand — bereits im Spiel) | Gesetzesrecherche |
| Präsident | **15 Tage** Veröffentlichungsfrist; Rückgabe möglich; **Haushaltsgesetze ausgenommen**; Wiederannahme braucht **absolute Mehrheit der Gesamtmitgliederzahl** | Anayasa Art. 89 (belegt) |
| Gericht | AYM-Normenprüfung (Fristen: zu prüfen gegen Art. 150/151) | Gesetzesrecherche Abschnitt 6 |
| Erlass | Präsidentialerlasse (Art. 106) als zweiter Weg: schnell, angreifbar, keine Grundrechts- oder Strafmaterie | Art. 106 (Grenzen zu prüfen) |
| Notstand | Sonderbefugnisse mit Frist- und Katalogfrage (Gesetzesbaustein g_notstand) | Art. 119-Umfeld |

### 2.2 Die 20 Felder und ihre typischen Konfliktlinien (Bausteine in `game/src/data/gesetze/`)

| Baustein | Ausschuss (typisch) | Wer drückt auf | Wer blockiert | Üblicher Kompromiss in der Praxis |
|---|---|---|---|---|
| g_mindestlohn | Arbeit | Gewerkschaften, Beschäftigten-Milieus | Arbeitgeberverbände, Finanzministerium | Erhöhung über Inflation + Abgabenentlastung für Kleinbetriebe |
| g_einkommensteuer | Planung und Haushalt | Handelsverbände (senken), Opposition (progressiv) | Finanzministerium (jede Richtung) | Tarif halten, Freibeträge anheben, Fahndung digitalisieren |
| g_mwst | Planung und Haushalt | Verbraucherschutz, Handel | Finanzministerium | Ermäßigter Satz für Nahrung statt Nullsatz |
| g_koerperschaftsteuer | Planung und Haushalt | Industrieverbände | Oppositions-Milieus | Konzernaufschlag + Investitionsabzug für Förderregionen |
| g_renten | Arbeit, Haushalt | Rentnermilieus (immer) | Finanzministerium | Inflationserhöhung + Untergrenze für niedrige Renten |
| g_energiesubventionen | Energie, Haushalt | Beschäftigten-Milieus, Industrie | Finanzministerium | Deckel abbauen in Schritten + Sozialtarif für kleine Verbräuche |
| g_preiswahrheit | Energie | Energieversorger, EU-Kapitel | Beschäftigten-Milieus (kurz) | Deckel mit Auslaufklausel und öffentlichem Endpreis |
| g_mietdeckel | Öffentliche Arbeiten | Mietvereinigungen, Städte | Immobilienwirtschaft | Deckel auf Bestandsverträge, Neubau frei, befristet |
| g_sozialwohnungen | Öffentliche Arbeiten | Mietvereinigungen, Bebenregionen | Finanzministerium | Serie + Eigentumsmodell gemischt, Bebengeschädigte zuerst |
| g_bauamnestie | Öffentliche Arbeiten | Bauwirtschaft, Kleinbesitz | Erdbebeningenieure, Bauaufsicht | Registerfehler legalisieren, Statikprüfung als Bedingung |
| g_polizei | Innere Angelegenheiten | Sicherheitsverwaltung, nationalistische Fraktionen | Zivilgesellschaft, EU-Kapitel | Einstellungsserie + Deeskalationshandbuch als Paket |
| g_versammlungsfreiheit | Innere Angelegenheiten, Menschenrechte | Zivilgesellschaft, EU-Kapitel | Sicherheitsverwaltung | Anmeldung statt Genehmigung mit Behörden-Einwirkungsrechten |
| g_internetsperren | Digitale Angelegenheiten | Sicherheitsverwaltung, Medienaufsicht | Tech-Branchen, Anwaltsvereine | Gerichtspflicht im Frieden, Behörde im Krisenfall, VPN legal |
| g_medienaufsicht | Digitale/Innere | Journalisten-Organisationen vs. Medieneigentümer | jeweils anders | Abgestufte Sanktionsleiter + offene Werbeverteilung |
| g_notstand | Verfassung, Innere | Sicherheitsverwaltung, Zentralisten | Verfassungsrechtler | Kurze Fristen + geschlossener Katalog + AYM-Einzelprüfung |
| g_justizreform | Justiz | Richtervereinigungen, Opposition | Justizministerium | Gewichte mischen, Protokolle verspätet öffentlich |
| g_richterstellen | Justiz, Haushalt | Wirtschaftskammern (Backlog) | Finanzministerium | Gezielte Verstärkung der überlasteten Gerichte |
| g_friedensprozess | Innere, Verfassung | Friedens- und Regionalmilieus, EU | nationalistische Fraktionen, Opferverbände | Schrittweise ohne Papier + Sprachrechte als sichtbarer Schritt |
| g_rueckkehr | Auswärtige, Innere | migrationskritische Milieus | UN-Organisationen, Menschenrechte | Rückkehrpaket + Aufenthaltsfristen, Abschiebung nur bei Verstoß |
| g_kernkraft | Industrie/Energie, Haushalt | Energieministerium, Industrie | Finanzministerium, Küstenschutz | Akkuyu-Modell weiter, Aufsicht in eigene Behörde |

**Muster (aus den Bausteinen ablesbar):** (1) Fast jede Zeile endet in einem Paket aus zwei entgegengesetzten Klauseln — der Klauseltausch ist die türkische Kompromissform. (2) Der Finanzministerium blockiert fast alles und wird durch Zeit (Fristen) oder Erlass-Route umgangen — genau die Legitimitäts-Falle der Vision. (3) EU-Kapitel und Straße (Milieus) sind die beiden externen Blockhebel.

## 3. Zusammenhänge (Richtung, Verzug)

| Kante | Richtung | Verzug | Beleg |
|---|---|---|---|
| Rückgabe (Art. 89) → Verzug der Wirkung + Konflikt mit TBMM | − | 15 Tage + Neuberatung | Art. 89 (belegt) |
| Erlass-Route → Legitimität −, später AYM-Risiko | − | sofort / 6–24 Monate | Art. 106-Grenzen |
| Ausschussstärke → Änderungsantragserfolg | + | sofort | Besetzungsstärke (TBMM-Praxis) |
| Notstand → Erlasskatalog → Justizbacklog | − | 3–12 Monate | g_notstand-Klauseln; Justizzahlen (GLM_5) |
| Mindestlohn im Dezember → Tarifrunde im Frühjahr | + | 3–6 Monate | RECHERCHE_TARIFRUNDEN (Art. 39) |
| Haushaltsfristen (Oktober) → Etatpolitik aller Ressorts | + | sofort | Art. 161-Tripel (zu prüfen) |
| AYM-Anfechtung → Gesetzesause | − | 6–24 Monate | Art. 150/151 (zu prüfen) |

## 4. Anschluss im Code

- `game/src/data/gesetze/` (20 Bausteine, Stufe 2 Engine im Arbeitsstrang): Diese Datei ist die Verfahrensunterlage dazu.
- `RECHERCHE_GESETZGEBUNG_TUERKEI_2026-10-05.md` (Verfahrensrecherche mit Art.-89-Belegen) — das Verfahrenslexikon zu dieser Datei.
- `data/linien.ts` / `sim/linie.ts`: Abweichler und Fraktionsdisziplin hängen an den Achsen (gebaut).
- `sim/verfassung.ts` (301/360, AYM-Besetzung, Notstand): Die AYM- und Notstandsklauseln der Bausteine hängen hier.
- `ui/`: Gesetzeswerkstatt (Vision 0.1) liest die Bausteine; Plenum zeigt Abweichler als Gesichter (gebaut).

## 5. Integrationsvorschläge

### 5.1 Ausschussstufe als echter Konfliktort (statt Durchlauf)

- **Entscheidung:** Keine; der Ausschuss ist automatisch die erste Mehrheitsprobe: Fraktionen mit Sitzstärke im zuständigen Ausschuss können Klauseln austauschen (Stufe statt kompletter Ablehnung). Der Spieler kann vorab „Ausschusskompromiss" anbieten (Zeit gewinnen, Klausel opfern).
- **Folgen:** Gesetze kommen verändert ins Plenum — Pakete zerfallen oder wachsen; Oppositionsparteien haben einen echten Ort. Verlierer: Gesetzesfahrer ohne Mehrheit; Gewinner: Verhandler.
- **Gegenspieler:** Ausschussvorsitz (Agenda-Macht), Fraktionschefs, Lobby-Institutionen aus den Bausteinen (für/gegen-Listen).
- **Anzeige:** Gesetzeswerkstatt: Ausschussanzeige mit Sitzstärke und „veränderbare Klauseln"; Chronik: Klauseltausch als eigener Eintrag.
- **Daten:** Bausteine liefern für/gegen; Zuordnungstabelle 2.2 als Feld `ausschuss`.
- **Aufwand:** mittel.
- **Spieltest:** Spaß, wenn ein Gesetz im Ausschuss anders herauskommt als eingereicht und der Spieler das als Gewinn und nicht als Fehler liest.

### 5.2 Rückgabe-Kalkül (Art. 89 als Schachzug)

- **Entscheidung:** Der Präsident (Spieler) wählt bei jedem Gesetz: unterschreiben, zurückgeben (ganz/teilweise), mit Botschaft. Die TBMM antwortet nach den belegten Regeln; bei Wiederannahme mit Mitglieder-Mehrheit muss unterschrieben werden.
- **Folgen:** Rückgabe kostet Zeit und Beziehung zur TBMM, gewinnt Klimazeit (Wahlkampf); Haushalt ist ausgenommen (belegt). Verlierer: Ressortminister (Projekt steht).
- **Gegenspieler:** TBMM-Präsidium, Opposition (feiert Rückgabe als Veto-Skandal), Märkte (Verzug wirkt auf vertrauen_maerkte).
- **Anzeige:** Gesetzeswerkstatt-Karte mit drei Knöpfen und Mehrheitsrechnung der Wiederannahme.
- **Daten:** Felder in der Engine (Verfahrenszustand je Gesetz).
- **Aufwand:** klein (Regeln stehen belegt).
- **Spieltest:** Spaß, wenn die Rückgabe einmal ein Gesetz wirklich bessert (neue Mehrheit nach Kompromiss) statt nur zu verzögern.

### 5.3 Erlass-Route mit AYM-Schatten

- **Entscheidung:** Erlasse als schneller Weg mit sichtbarem Legitimitätspreis und AYM-Anfechtungswahrscheinlichkeit (Grenzen: Grundrechte/Strafe ausgeschlossen — belegt qualifiziert).
- **Folgen:** Kurz: Wirkung sofort; lang: Kassationsrisiko (Ereignis „Gericht kassiert Erlass") + Kontroll-Debatte. Verlierer: Rechtsstaat-Milieus.
- **Gegenspieler:** AYM, Anwaltsvereine, Opposition.
- **Anzeige:** Erlass-Karte mit Schattenleiste (Kassierisiko); Chronik-Eintrag.
- **Daten:** Engine-Feld.
- **Aufwand:** klein.
- **Spieltest:** Erfolgreich, wenn Spieler Erlasse als Werkzeug nutzen und den Preis fühlen, statt sie als Verbot zu sehen.

### 5.4 Gesetzeskalender mit echten Fristen

- **Entscheidung:** Der Spielkalender trägt die drei belegten Fristen (Haushalt Oktober, Mindestlohn Dezember, Tarifrunde Frühjahr) plus frei wählbare Gesetzesfenster; der Schreibtisch zeigt „dieses Gesetz muss bis …".
- **Folgen:** Agenda-Politik wird zeitgebunden; Vorwahlen (Wahlgeschenke) haben einen Kalenderort.
- **Gegenspieler:** Opposition (Fristverzug als Skandal), Presse.
- **Anzeige:** Schreibtisch-Termine (gebaut) + Gesetzskarte mit Fristenband.
- **Daten:** Engine-Feld `frist`.
- **Aufwand:** klein.
- **Spieltest:** Erfolgreich, wenn der Spieler im Oktober unter Zeitdruck einen Haushaltsschnitt trägt — Fristen statt Texte erzeugen den Druck.

## 6. Verworfen

- **Verfassungsänderungsmodul mit Artikel-Detailverhandlungen:** Die Verfassungspakete (301/360, AYM, Referendum) sind gebaut; eine Artikelschicht wäre Überfrachtung.
- **Einzelabgeordneten-Verwaltung (jeder Name hat Sitz-Meinung):** Fraktionsdisziplin + Linienabstand + Abweichler-Anzeige trägt die Realität ohne Personenkartei.
- **Lobby-Register als eigenes Fenster:** für/gegen-Listen der Bausteine sind die Lobby; ein Register wäre Verwaltung.
- **Geschäftsordnung-Simulation (Sitzungsblockade, Anträge):** Ein Blockade-Flag je Opposition genügt; Verfahrensdrama ohne Regeltiefe.

## 7. Vorbilder

- **Suzerain:** Gesetze als dramatische Szene mit Abstimmungsausgang — übernommen (Plenum mit Gesichtern, gebaut).
- **Democracy 4:** Gesetzesdurchführung als Slider — verworfen als Hauptweg (Vision 0.1 ersetzt ihn).
- **Victoria 3:** Gesetzgebung mit Interessengruppen-Pro/Kontra — genau die für/gegen-Struktur der Bausteine; übernommen.
- **Civ 6:** World Congress-Momente — die Fristen (Haushalt, Mindestlohn) sind unsere „Momente".

## 8. Unsicher oder unbelegt

1. Ausschussliste (24) mit exakten Zuständigkeiten: TBMM-Geschäftsordnung prüfen.
2. AYM-Anfechtungsfristen (Art. 150/151) und Erlass-Grenzen im Wortlaut: mevzuat.gov.tr.
3. Haushalts-Fristentripel (55/15/17.10.): gegen Art. 161-Text.
4. Notstands-Katalog: Ausgestaltung über g_notstand (Spielparameter), Verfassungswortlaut prüfen.
