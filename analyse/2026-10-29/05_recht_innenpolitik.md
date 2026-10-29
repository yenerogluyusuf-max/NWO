# 05 — Recht und Innenpolitik: Funktionstest und Spielbarkeit

Stand der Prüfung: 29.10.2026. **Geprüft wurde der Stand W4** (`/home/user/nwo-w4/game`, Commit `09a14ff`, dazu die Stufen 1–7). Der alte Stand (`/home/user/nwo-analyse/game`) diente nur zum Vergleich. Was nur dort galt, ist als **„in W4 behoben“** markiert.
Schwerpunkt nach der Kursänderung des Projektinhabers: Funktioniert der Weg über Gesetz, Erlass, Verfassung und Parlament sauber? Ist er spielbar, verständlich und folgenreich? Gibt es Fehler, tote Knöpfe, folgenlose oder unsinnige Entscheidungen und Widersprüche zwischen Anzeige und Simulation? Reale Rechtsregeln stammen nur aus den Projektdokumenten (`tuerkei/INSTITUTIONEN.md`, Kopf von `src/data/gesetzesvorhaben.ts`). Code und Dokumente wurden nicht verändert.

Dateiangaben ohne Pfadpräfix beziehen sich auf `/home/user/nwo-w4/game/`.

---

## 0. Ergebnis in fünf Sätzen

1. W4 hat den Gesetzesweg deutlich verbessert. Es gibt jetzt 26 Gesetzesvorhaben mit drei Fassungen, ein sichtbares Lager aus Befürwortern und Gegnern, Abweichler in den Partnerfraktionen, Folgen nach dem Beschluss und ein Verfassungsgericht, das Erlasse und grundrechtsnahe Gesetze tatsächlich aufhebt. Dazu kommen die Hürden 360/400, Parlamentswahlen mit neuer Sitzverteilung, eine handelnde Opposition, Rathäuser, Amtsenthebung und Sturz.
2. **Der größte Funktionsfehler:** Neben den neuen Vorhaben besteht der alte Weg über die Regler (Politik, Netz) unverändert weiter. Dort gibt es keine Normenkontrolle, keine Fassungsgrenze und keine Ruhezeit. Ein Erlass ist dort auch erlaubt, wo die Vorhaben-Karte ihn verbietet. Wer die Kontrollen umgehen will, nimmt einfach den Regler.
3. **Das größte Spielbarkeitsproblem:** Es gibt kaum parlamentarischen Widerstand. In fünf Starts sind 125 von 130 Vorhaben in der schärfsten Fassung „sicher“, und in sechs Läufen über rund 20 Spieljahre wurden alle 32 Abstimmungen angenommen. Die eigentliche Bremse ist Politisches Kapital, doch in zwei von drei W4-Läufen lag es nach anderthalb bis drei Jahren über 100.
4. **Die unsinnigste Regel:** Die Sperre „Justiz im Umbau“ legt während einer laufenden Justizreform den ganzen Rechtsbereich still, auch den Ausnahmezustand. Im Reformer-Lauf waren die Rechtsmaßnahmen dadurch dreieinhalb Jahre blockiert.
5. Die Verfassung ist zur Hälfte Kulisse. Amtszeit, Amtszeitlänge, Wahlhürde und Gerichtsbesetzung haben echte Mechanik. Die Artikel zu Notstand und Immunität sind nur einmalige Stöße ins Netz, die wieder abklingen. Das Verfassungsgericht prüft Pakete nach ihrem Inhalt, obwohl laut Projektdokument nur Formfehler zählen.

---

## 1. Vorgehen

| Schritt | Was | Ergebnis |
|---|---|---|
| Code-Lektüre | `sim/gesetzgebung.ts`, `handeln.ts`, `verfassung.ts`, `ereignisse-verfassung.ts`, `fraktionen.ts`, `linie.ts`, `opposition.ts`, `kommunen.ts`, `wahl.ts`, `enden.ts`, `krisen.ts`, `reich.ts`, `ereignisse-reich.ts`, `machtkreis.ts`, `medien.ts`, `data/gesetzesvorhaben.ts`, `data/politiknetz.ts`, UI `ui/gesetze/Gesetzesvorhaben.tsx`, `ui/Verfassung.tsx`, `ui/Beschlussbuch.tsx` | Abschnitte 2, 3 und 5 |
| Läufe, alter Stand | drei Läufe über 2 bis 4 Jahre (Reformer, Autoritär, Kanten), Rohdaten `analyse/recht/lauf1.txt` | Vergleich, Abschnitt 7 |
| Läufe, W4 | drei Läufe: A Reformer (5 Jahre und 40 Tage, mit Wahl), B Autoritär (bis zum Sturz nach 2 Jahren und 8 Monaten), C Kanten (2 Jahre); Rohdaten `analyse/recht/w4lauf.txt` | Abschnitt 4 |
| Gezielte Prüfungen, W4 | 5 Seeds: Mehrheiten aller 26 Vorhaben, Gerichtsfälle bis zum Urteil, Regler- gegen Vorhabenweg, Lagerdisziplin beim Verfassungspaket; `analyse/recht/w4gericht.txt` | Abschnitt 3 |
| Browser (W4, `localhost:5199/?schnellstart`, de-DE) | Akte „Parlament und Recht“: Lage, Instrumente, Gesetzesvorhaben, Verfassung; Bildschirmfotos unter `analyse/recht/shots_w4/` | Abschnitt 3.3 |

Ein Vorbehalt zu den Läufen: Der Prüf-Bot beantwortet Ereignisse nach einer festen Vorzugsliste und nimmt sonst die erste Option. Bei offenen Zusagen war das „Erfüllen“, und dieser Knopf bringt selbst ein Gesetz ein. Deshalb tauchen in den Läufen einzelne Gesetze auf, die nicht im Plan standen, etwa die zweite Justizreform in Lauf A.

---

## 2. Der Gesetzesweg im Spiel (W4): was modelliert ist

### 2.1 Ablauf eines Gesetzesvorhabens

| Schritt | Im Spiel | Beleg | Funktionstest |
|---|---|---|---|
| Vorhaben wählen | 26 Karten, sortiert nach Kalender, akuten Problemen, Parteilinie und Fokus; sechs liegen „auf dem Tisch“ | `sim/gesetzgebung.ts:225-280`, `data/gesetzesvorhaben.ts:84-114` | funktioniert; die Kacheln zeigen aber keinen Titel (3.3) |
| Fassung | scharf, Kompromiss oder verwässert (30/18/8 Stufen). Scharf verliert Partnerstimmen, der Kompromiss holt Oppositionsstimmen | `gesetzgebung.ts:207-223`, `PARTNER_ABSPRUNG` | wirkt: Lauf B, Medienaufsicht scharf mit Bonus −29 Stimmen |
| Lager | Parteien nach fünf Achsen, dazu Verbände und Gruppen aus den Daten | `gesetzgebung.ts:113-131` | sichtbar und plausibel |
| Einbringen | Kapital und Aufmerksamkeit, Abstimmung nach 21 Tagen | `handeln.ts:37-38`, `:495` | funktioniert |
| Ausschuss, Lesungen, Verkündung | **nicht modelliert** (bewusst: ENTSCHEIDUNGEN Block E „keine Verfahrensfeinheiten“) | — | — |
| Abstimmung | Lager mit Abweichlern nach Linie, Duldung, Sachstimmen, Übertritte, Fassungsbonus, Stimmenkauf, Rauschen ±6 | `handeln.ts:197-208`, `:638` | funktioniert, aber fast nie knapp (3.2, F2) |
| Veto des Präsidenten (Rückverweisung, AY 89) | nicht modelliert; bei einem Spieler-Präsidenten auch kaum nötig | INSTITUTIONEN.md §2 | — |
| Folgen | Verbände und Gruppen reagieren, Protestdruck in drei Städten, Rathäuser der Opposition bremsen | `gesetzgebung.ts:388-413` | Protokolleinträge erscheinen; die Wirkung ist klein |
| Normenkontrolle | nur bei `grundrechte`-Vorhaben und Erlassen; Kläger aus Art. 150, Urteil nach 120 Tagen; die Aufhebung setzt die Stufe zurück | `gesetzgebung.ts:183-205`, `:416-460` | **funktioniert** (Seed 11: zwei Aufhebungen, zwei Bestätigungen); Logikfehler siehe F4 |
| Ruhezeit | 365 Tage nach einer Annahme, 120 nach einer Niederlage | `gesetzgebung.ts:30-33` | funktioniert, gilt aber nur für Vorhaben |
| Umsetzung | Balken über die Monate des Knotens; die Kanten wirken anteilig | `sim/umsetzung.ts` | funktioniert; Tempo hängt nicht an Minister oder Verwaltung |
| Wirkungsbericht | nach 6, 12 und 24 Monaten | `sim/berichte.ts` | funktioniert, gute Rückmeldung |
| Aufhebung oder Rücknahme | über die Gegenrichtung des Reglers mit Exit-Preis 1,6×; bei Vorhaben nur in der festen Richtung | `handeln.ts` (Vier-Preise-Regel) | Vorhaben kennen keine Rücknahme (F1) |

### 2.2 Erlass

| Weg | Erlaubt bei | Gericht | Beleg |
|---|---|---|---|
| Vorhaben-Karte | nur `erlass: "anfechtbar"` und nicht bei Grundrechten (4 von 26: Energiepreisbremse, Preiswahrheit, Kernkraft, Wohnungsbau) | ja, wenn ein Kläger da ist | `gesetzgebung.ts:339-356` |
| Regler (Politik, Netz) | alle Maßnahmen der Themen Sicherheit, Außen und Militär sowie zwei Einzelmaßnahmen | **nie** | `handeln.ts:87-88`, `:508` |

### 2.3 Verfassung

| Schritt | Im Spiel (W4) | Beleg |
|---|---|---|
| Paket | sechs Artikel (neu: Amtszeitlänge 4/5/7 Jahre und „unbegrenzt“) | `verfassung.ts:120-330` |
| Hürden | **360 für das Referendum, 400 ohne Referendum (in W4 behoben, vorher 301/360)** | `verfassung.ts:45-51`; INSTITUTIONEN.md §3 |
| Lager | stimmt **geschlossen**, ohne Abweichler | `verfassung.ts:468`, `:482` |
| Anfechtung | Wahrscheinlichkeit aus Machtrichtung, Größe der Opposition und Polarisierung, **unabhängig davon, wer klagt** | `verfassung.ts:660` |
| Verfassungsgericht | kassiert nach Sitzen und Inhalt („autoritär“) | `verfassung.ts:708-715` |
| Referendum | Mini-Wahl mit Kampagnenimpulsen | funktioniert (Lauf A: 48,8 % Ja, abgelehnt) |
| Wirkung | Amtszeit, Amtszeitlänge und Wahlhürde werden gelesen (`amtszeit.ts:72`, `:84`; `wahl.ts:101`); der Justizartikel verschiebt die Gerichtssitze. **Notstand und Immunität** bleiben einmalige `wirke`-Stöße (`verfassung.ts:887`) | F7 |

---

## 3. Befunde aus dem Funktionstest

### 3.1 Fehler und Widersprüche (W4)

| Nr. | Befund | Nachweis | Folge im Spiel |
|---|---|---|---|
| **F1** | **Zwei parallele Gesetzeswege mit verschiedenen Regeln.** Die Vorhaben-Karten haben Fassung, Lager, Normenkontrolle, Ruhezeit und Folgen. Der Regler-Weg (`bringeEin` aus `ui/politik/Politik.tsx`, `ui/NetView.tsx`, `sim/befehle.ts`, `ministerfluss.ts`) hat davon nichts. | Prüfung Seed 11: Versammlungsfreiheit per Regler-Gesetz von 35 auf **0**, keine Klage. Polizei per **Regler-Erlass** von 60 auf 95, obwohl die Karte „Polizeigesetz“ meldet: „Das braucht ein Gesetz: Ein Erlass darf das nicht regeln.“ Danach 0 Prüfungen beim Gericht. | Die neue Gerichtskontrolle lässt sich trivial umgehen. Der Spieler sieht zwei Wahrheiten. |
| F1b | Die Übersicht „Im Parlament“ der Gesetzesvorhaben zählt nur Vorhaben (`gesetzgebung.ts:468`, Filter `g.vorhaben`). Per Regler eingebrachte Gesetze fehlen dort. | Code | Anzeige und Simulation weichen voneinander ab |
| **F2** | **Kaum Widerstand im Parlament.** | In 5 Seeds stehen 125 von 130 Vorhaben in scharfer Fassung auf „sicher“; nur Seed 21 hat 5 „knapp“, „verloren“ gibt es nie. In den Läufen wurden alt 18 von 18 und W4 14 von 14 Abstimmungen angenommen. Die Browser-Übersicht zeigt bei allen Karten „Mehrheit steht“ (386 bis 411 Ja). | Die Abstimmung ist eine Formalität. Fassung und Stimmenkauf verlieren ihren Sinn. |
| **F3** | **Die Sperre „Justiz im Umbau“** greift schon beim Einbringen der Justizreform und hält bis zum Ende ihrer 18-monatigen Umsetzung. Sie sperrt **jede** Maßnahme des Themas Recht, auch den Ausnahmezustand, die Urteilsumsetzung, den Richterrat und das Antikorruptionsgesetz. | `krisen.ts:197-205`. Lauf A (W4): blockiert von Juni 2028 bis Dezember 2031. Lauf C: Ausnahmezustand und Urteilsumsetzung gesperrt. | Wer die Justiz reformieren will, kann außer der Justizreform jahrelang nichts tun. Einen Notstand während einer Justizreform auszuschließen ergibt keinen Sinn. |
| **F4** | **Die Normenkontrolle ist richtungsblind und hängt am falschen Kläger.** (a) `grundrechte` ist eine Eigenschaft des Vorhabens, nicht der Richtung: Ein unabhängiges Gericht hebt die *Ausweitung* von Gewerkschaftsrechten mit derselben Chance auf wie eine Einschränkung. (b) Lagerpartner dürfen nie klagen (`klaeger`, `gesetzgebung.ts:183-196`), obwohl der Datenkopf ein Fünftel der Abgeordneten als klagebefugt nennt. (c) Die größte Oppositionsfraktion (in fast allen Starts die AKP) unterstützt die restriktiven Vorhaben. | Seed 11: das Gericht hebt das „Gewerkschafts- und Streikrecht“ auf und bestätigt „Minderheitenrechte“. In allen 5 Seeds haben nur Minderheiten- und Gewerkschaftsrecht ein Klagerisiko (28,6 %). Netzinhalte, Medienaufsicht, Polizei und Rückkehr: **0 %**. Lauf B: Lagerpartner YENİ und DEM mit 123 Sitzen sind dagegen und dürfen trotzdem nicht klagen. | Das Gericht bremst in der Praxis nur liberale Gesetze. Der autoritäre Weg bleibt gerichtsfrei, das Gegenteil der Absicht. |
| **F5** | **Das Verfassungsgericht kassiert Verfassungspakete nach ihrem Inhalt.** Laut `tuerkei/INSTITUTIONEN.md` §3 prüft es Änderungen „nur auf Formfehler“. Außerdem ficht „die Opposition“ auch an, wenn sie das Paket unterstützt. | `verfassung.ts:660`, `:708-715`. Lauf B: 467 zu 133, die einzige Oppositionsfraktion AKP ist laut Paketdaten mit +2 für „unbegrenzt“, und trotzdem heißt es „Die Opposition zieht vor das Verfassungsgericht“. | Widerspruch zum eigenen Recherchedokument; der Text ist im Einzelfall unsinnig |
| F6 | **Beim Verfassungspaket stimmt das Lager geschlossen**, bei normalen Gesetzen gibt es seit W4 Abweichler nach Linie. | Seed 3: die MHP (−2 bei Justiz, Notstand und Wahlhürde) stimmt mit allen 71 Sitzen für ein Demokratisierungspaket; erwartet werden 387 Ja | Ausgerechnet die heikelste Abstimmung ist die verlässlichste |
| **F7** | **Die Verfassungsartikel zu Notstand und Immunität haben keine Mechanik.** Ihre Effekte sind einmalige Netzstöße, die mit der Trägheit der Größe abklingen. `verfassungAktiv` wird nur für Amtszeit, Amtszeitlänge und Wahlhürde gelesen. Das Oppositionsinstrument „Immunität aufheben“ geht unabhängig vom Verfassungsartikel (`opposition.ts:288`). | Alter Lauf B: „Notstand weit“ in Kraft, `ausnahmerecht` 15,6 → 10,6 binnen zweieinhalb Jahren. In W4 ist der Code unverändert (`verfassung.ts:887`). | „Notstand weit gefasst“ ist eine folgenlose Wahl. Immunität gibt es doppelt und ohne Verbindung. |
| F8 | **Der Ausnahmezustand ist ein Regler-Gesetz** (Thema Recht, 21 Tage Abstimmung, kein Erlass, kein Ablauf, keine Dekrete). Laut INSTITUTIONEN.md §1 ruft der Präsident ihn aus, das Parlament muss am selben Tag zustimmen, er gilt höchstens 6 Monate, und Notstandsdekrete fallen nach 3 Monaten ohne Bestätigung weg. | `data/politiknetz.ts:1367`; Lauf B: „Ausnahmezustand“ nach 21 Tagen mit 357 Ja angenommen, danach unbefristet | Der stärkste Hebel des Präsidialsystems ist ein Regler ohne Dramaturgie |
| F9 | **Ein Parteiverbot hat keine Folgen für Sitze oder Organisation.** | Lauf B: „Die AKP ist verboten“ (1.7.2029). Am Ende hat die AKP weiter 267 Sitze, führt die Opposition an (Stärke 56 → 76) und ruft weiter zu Großdemonstrationen auf. `opposition.ts:163-180` ändert nur Stärke und Märtyrerwert. | Der härteste Eingriff ist halb Kulisse |
| F10 | **Ein Boykott ändert die Abstimmungsrechnung nicht**: Ja plus Nein ergibt immer 600, und die Hürde bleibt 301. Laut INSTITUTIONEN.md §2 entscheidet die Mehrheit der Anwesenden, mindestens 151. | `opposition.ts:126-131`; Lauf B: „Die AKP bleibt den Sitzungen fern“, danach eine Abstimmung 349 zu 251 | Die Anzeige widerspricht der Lage |
| F11 | Ein Erlass auf eine Maßnahme ist erlaubt, während zur selben Maßnahme ein Gesetz im Parlament liegt. Das Gesetz überschreibt den Erlass später, ohne Warnung. | Lauf C: Gesetz Polizei 80 eingebracht, am Folgetag Erlass Polizei 40 (28 Kapital); nach der Abstimmung gilt 80 | 28 Kapital ohne Wirkung |
| F12 | Die Sitze des Richter- und Staatsanwaltsrats (HSK) sind toter Zustand: Sie werden angelegt und angezeigt, aber nie verändert. Das Ereignis `besetze` kennt nur das Verfassungsgericht. | `reich.ts` `sitze.hsk`; `ereignisse-reich.ts:39`, nur Aufrufe mit `"aym"` | Kulisse in der Justiz-Ansicht |
| F13 | **Kommunalwahl als sichere Niederlage**: Ein Oppositionsrathaus fällt erst ab einem Ortswert über 56 (Schwelle 52 plus Amtsbonus 4, Rauschen ±6), das Vertrauen startet bei 45. | `kommunen.ts:23-31`, `:63-85`. Alle drei W4-Läufe: das Lager gewinnt **0** Rathäuser und verliert 3, 5 und 7 | Es gibt keinen Gestaltungsraum; die Wahl wird zur Strafe |
| F14 | Politisches Kapital ist am Anfang knapp und später im Überfluss: Am Ende stand es in Lauf A bei 117, in Lauf C bei 118 (Höchstwert 150). Im alten Stand erreichten beide Läufe die Grenze. | Läufe | Im späteren Spiel gibt es keine Knappheit; zusammen mit F2 fehlt jede Reibung |
| F15 | Die Prüfung der Gesetzesfolgen ist schwach. Die Folgen nach dem Beschluss sind kleine Stöße (Gruppen ±, Protestdruck in drei Städten). Bewegungen entstehen in den Läufen fast nur aus dem Oppositionsrhythmus (Großdemo alle drei Monate), kaum aus einem Gesetz. | `gesetzgebung.ts:388-413`; Läufe A und B | Ein scharfes Mediengesetz löst keinen eigenen Konflikt aus |

### 3.2 Was in W4 nachweislich funktioniert

- **Partner springen ab.** Scharfe Fassungen gegen die Linie eines Lagerpartners kosten sichtbar Stimmen (Lauf B: −29) und Loyalität (`linie.ts:127-160`).
- **Das Gericht hebt wirklich auf.** Seed 11: Erlass „Wohnungsbauoffensive“ aufgehoben, Stufe zurück, Vertrauen −1,5. „Gewerkschaftsrecht“ aufgehoben. Die Wahrscheinlichkeit steht vorher auf der Karte.
- **Parlamentswahl mit Folgen.** In Lauf A wählt das Land 2033 neu: AKP 233 → 268, eigene Partei 199 → 183. Die Wahlhürde aus der Verfassung wird gelesen (`wahl.ts:101`, `:331`). **In W4 behoben**: Vorher blieb das Parlament das ganze Spiel gleich.
- **Die Opposition handelt.** Großdemonstrationen, Boykott, Ausschussforderung und Anfragen. Ermittlung, Immunität und Verbot haben Märtyrereffekte (`opposition.ts`). **In W4 behoben**: Vorher war die Opposition eine Figur ohne Handlung.
- **Rathäuser mit Zustand und Zwangsverwalter** (`kommunen.ts`). **In W4 behoben**: Vorher war die Kommunalwahl nur ein Text.
- **Härte am Ende.** Lauf A verliert die Stichwahl mit 48,1 %, obwohl Rechtssicherheit und Legitimität bei 92 und 87 stehen. Lauf B endet nach autoritärem Kurs im Februar 2031 durch Massenproteste. Im alten Stand blieb der autoritäre Lauf ohne Sturz (Zustimmung 42 %, Pressefreiheit 0).
- **Referendum als echte Hürde.** Lauf A: Fünf Kampagnenimpulse heben die Prognose auf 50,4 %, das Ergebnis lautet 48,8 %, das Paket ist abgelehnt.

### 3.3 Oberfläche (Browser, W4)

Bildschirmfotos und Textauszüge liegen unter `/tmp/claude-0/-home-user-NWO/d4866be2-bd79-588d-ab46-992dad67ab93/scratchpad/analyse/recht/shots_w4/`.

| Befund | Nachweis |
|---|---|
| **Die Kacheln der Gesetzesvorhaben zeigen keinen Titel.** In jeder Kachel überlagern sich der Urteilsbalken „Mehrheit steht“ und „386 Ja-Stimmen erwartet, nötig 30…“; die Zahl wird abgeschnitten. Erkennbar ist nur der abgeschnittene erste Satz („Mehr als siebzehn Millionen …“). | `shots_w4/02_Instrumente_Was_Sie_tun_können.png`; Textauszug `text/02_…txt`, wo der Titel im DOM steht, aber nicht sichtbar ist |
| Alle Kacheln sind grün, „Mehrheit steht“. Die Karte bietet so keinen Grund zur Abwägung (siehe F2). | wie oben |
| Die Kopfzahlen „Mehrheit (mit Duldung) 373“, „Gesetze im Verfahren 0“ und „Unabhängige Justiz 32“ stimmen mit der Simulation überein (Lager 367 plus Duldung). | `text/01_…txt` |
| Unter Instrumente gibt es sechs Unterreiter: Gesetzesvorhaben, Fraktionen und Abstimmung, Umsetzung, Verfassung, Justiz, Behörden. Die Regler zu denselben Maßnahmen liegen zusätzlich in Politik › Bereiche (F1). | Bildschirmfoto |

| **Einbringen im Browser funktioniert.** Kachel „Versammlungsgesetz“ öffnen, „Scharf“ wählen, „Ins Parlament · 16“ klicken: Die Lagezeile zeigt „Versammlungsgesetz · Scharf: Abstimmung in 21 Tagen, 362 Ja-Stimmen erwartet“, der Zähler „Im Parlament“ springt auf 1, die Kachel trägt „Abstimmung in 21 T.“. Unter Fraktionen und Abstimmung erscheint das Gesetz mit Datum, erwarteter Zahl und „Im Halbrund zeigen“. Keine Konsolenfehler. | `text/11_nach_einbringen.txt`, `text/13_fraktionen.txt`, `text/fehler.json` (leer) |
| Die Kacheln rechnen mit der Kompromissfassung (380 Ja), die scharfe Fassung liegt nach dem Einbringen bei 362. Die Kachel nennt die Fassung nicht. | `text/10_…`, `text/11_…` |
| **Text der Verfassungs-Werkstatt veraltet**: „Schnüren Sie ein Paket aus bis zu fünf Artikeln“, es gibt aber sechs Artikel (neu: Länge der Amtszeit), und der Code begrenzt die Zahl nicht. | `text/12_verfassung.txt`; `src/i18n/katalog/de/ansichten.json:227` (`vf.werkstattText`) |
| Die Werkstatt zeigt je Variante die Lager (dafür, dagegen) und die erwartete Stimmenzahl (etwa „500 Ja-Stimmen (+85)“). Das ist gut verständlich. Dass Lagerpartner bei der Verfassung nie abweichen (F6), sieht man dort nicht. | `text/12_verfassung.txt` |
| Die Justiz-Ansicht zeigt den Richter- und Staatsanwaltsrat mit „7 loyal, 3 reformorientiert, 3 unabhängig“. Diese Zahl ändert sich im ganzen Spiel nie (F12): eine Anzeige ohne Mechanik. | `text/14_justiz.txt` |
| Unter Fraktionen steht „Gesetze brauchen 301 Stimmen, Verfassungsänderungen 360 mit Volksabstimmung oder 400 ohne“. Das stimmt mit dem Code überein. | `text/13_fraktionen.txt` |

---

## 4. Spielbarkeit: die Läufe im Einzelnen (W4)

| | A Reformer (Seed 3) | B Autoritär (Seed 5) | C Kanten (Seed 9) |
|---|---|---|---|
| Lager zu Beginn | 367 Sitze (eigene Partei, YENİ, MHP) | 333 (eigene Partei, YENİ, DEM) | 335 (eigene Partei, YENİ, DEM, MHP) |
| Eingebracht | Justizreform (Kompromiss), Versammlung (scharf), Medienaufsicht runter, Verfassungspaket demokratisch | Medienaufsicht scharf, Netzinhalte scharf, Ausnahmezustand, Ermittlung, Immunität, Parteiverbot, Verfassung „unbegrenzt“ | Erlass gegen laufendes Gesetz, Notstand während Justizreform, Vorhaben-Erlass bei Grundrechten |
| Abgelehnt im Parlament | 0 | 0 | 0 |
| Blockiert durch | „Justiz im Umbau“ (4×), Katastrophenlage (1×) | Kapital (3×), „Erlass darf das nicht regeln“ (1×) | „Justiz im Umbau“ (2×), Kapital (3×), Erlassverbot (1×) |
| Gericht | keine Prüfung (Minderheitenrecht blockiert) | Verfassungspaket zugelassen; Gesetze: niemand klagt | keine Prüfung |
| Verfassung | 375 Stimmen → Referendum mit 48,8 % → abgelehnt | 467 Stimmen → direkt (über 400), angefochten, zugelassen | – |
| Kommunalwahl 2029 | Lager 8 → 5 Rathäuser | 10 → 5 | 18 → 11 |
| Ende | Stichwahl 2033 verloren (48,1 %) | Sturz im Februar 2031 (Zustimmung 18 %) | Laufzeit beendet, Zustimmung 44 % |
| Justiz unabhängig / Pressefreiheit am Ende | 66 / 55 | 0 / 0 | 38 / 35 |
| Kapital am Ende | 117 | 63 | 118 |

**Spürbar.** Die Hürde des Referendums, die Gegenreaktion auf autoritäre Pakete (Märkte, Proteste, Straßburg), die Wirkungsberichte, der Sturz und der Wahlausgang.
**Nicht spürbar.** Die Abstimmung selbst (immer angenommen), der Widerstand der Gegner eines Gesetzes (kleine Stöße), das Gericht bei restriktiven Gesetzen (klagt nie), die Verwaltung (Tempo fest), die Justiz als Akteur (Staatsanwaltschaft und Richterrat ohne eigenes Handeln).
**Unsinnig.** Die Sperre durch die Justizreform, der Notstand als Regler mit 21 Tagen, eine verbotene Partei mit vollen Sitzen, der Boykott ohne Abwesenheit und eine „Opposition“, die ein Paket anficht, das sie unterstützt.

---

## 5. Innenpolitik: was wirkt und was Kulisse ist (W4)

| Akteur oder System | Wirkt | Kulisse oder Lücke | Beleg |
|---|---|---|---|
| Fraktionen und Disziplin | Abweichler nach Linie bei Gesetzen; Duldung, Bündnis, Abwerben (nur zum Spieler hin) | keine Abweichler beim Verfassungspaket; die Opposition wirbt nie ab | `linie.ts:127`, `verhandeln.ts:254-271` |
| Koalition | Partner gehen bei Loyalität unter 20 | Loyalität fällt in den Läufen nie so tief; kein Partner ist gegangen | `spiel.ts` `figurenPruefen` |
| Wählergruppen | 11 Gruppen, Ursachenketten, Wahl über Zustimmung | – | `waehler-detail.ts` |
| Opposition | Züge, Stärke, Märtyrer, Bündnisse, Wahlgegner | keine eigenen Gesetzentwürfe; Verbot ohne Sitzfolge (F9); Boykott ohne Wirkung auf Abstimmungen (F10) | `opposition.ts` |
| Straße und Bewegungen | entstehen aus Druck; Härte radikalisiert | Gesetze lösen selten eigene Bewegungen aus | `bewegungen.ts` |
| Kommunen | Rathäuser, Zwangsverwalter, Wahl alle 5 Jahre | Wahl strukturell nicht zu gewinnen (F13) | `kommunen.ts` |
| Kabinett | Ministerkapital, Sitzungen, Umbildung, Ressortbitten | Umsetzungstempo der Gesetze hängt nicht am Minister | `kabinett.ts`, `umsetzung.ts` |
| Machtkreis | Geheimnisse, Rivalitäten, Putschzirkel, Präsident des Verfassungsgerichts als Figur | – | `machtkreis.ts` |
| Justiz als Institution | Gerichtssitze → `justiz_unabhaengigkeit`; Ernennungsereignis; Ereignisse zu Straßburg, Kassationshof und Haft | HSK tot (F12); Staatsanwaltschaft nur im Text; Skandaluntersuchung unabhängig von der Justiz | `reich.ts`, `ereignisse-reich.ts`, `ereignisse-personen.ts` |
| Medien | sieben Cluster mit Zustand, Eingriffen, Lizenzen und lebendem Index (**in W4 behoben**, vorher nur Referenzwerte „keine Optionen“) | – | `medien.ts` |
| Militär | Putschrisiko mit Teilen, Warnstufen, Versuch | – | `enden.ts:158-206` |
| Amtsenthebung | 301/360/400 als Vorgang (**in W4 neu**) | in den Läufen nie ausgelöst | `enden.ts:45-47`, `:263-354` |
| Gewerkschaften und Religion | Verbände im Lager, Streikwelle, Religionsbehörde als Regler | keine eigene Handlung | `data/gesetzesvorhaben.ts`, `ereignisse.ts` |

---

## 6. Vergleich mit den Vorbildern (nur funktional)

| Muster | Vorbild | Staatsräson W4 | Lücke |
|---|---|---|---|
| Gesetz mit Zustimmung der Interessengruppen und Einführungsdauer, Fortschritt je nach Unterstützung | Victoria 3 | Fassungen und Lager sind da; die Abstimmung fällt nach 21 Tagen fest | Es fehlt ein „Ringen“: Bei knapper Lage sollte sich das Vorhaben verzögern, Gegenereignisse auslösen oder scheitern |
| Legitimität blockiert Gesetzgebung | Victoria 3 | Legitimität ±1 Kapital im Monat; Sturz über die Zustimmung | Niedrige Legitimität sollte Erlasse verteuern und Klagen wahrscheinlicher machen |
| Verfassung als Endgegner, Gericht als Gegenspieler, Notstand als Deal | Suzerain | Paket, Hürden, Gericht, Referendum vorhanden | Notstand ohne Vorgang; Gericht mit Inhaltsprüfung statt Formprüfung (F5) |
| Policy mit Einführung, Umsetzung, Gruppen-Groll und Attentatsrisiko | Democracy 4 | Netz, Umsetzung, Exit-Preis, Putschrisiko | Gruppen-Groll aus Gesetzen ist schwach (F15) |
| Haken und Gefallen | CK3 | Zusagen und Machtkreis-Hebel | Kein Haken gegen Abgeordnete als Weg statt Stimmenkauf |

---

## 7. Vergleich alter Stand und W4

| Thema | Alter Stand | W4 |
|---|---|---|
| Verfassungshürden | 301/360 (falsch gegenüber INSTITUTIONEN.md) | **360/400, in W4 behoben** |
| Parlamentswahl | keine; Sitze 5 Jahre fest, Wahlhürde ohne Wirkung | **in W4 behoben** |
| Opposition als Akteur | nein | **in W4 behoben** |
| Kommunen | ein Ereignis ohne Zustand | **in W4 behoben** (Kalibrierung F13) |
| Normenkontrolle | keine | **teilweise behoben**: nur für Vorhaben (F1, F4) |
| Abweichler im Lager | nein, Lager geschlossen | **bei Gesetzen behoben**, bei der Verfassung nicht (F6) |
| Medien | Referenzwerte ohne Knöpfe | **in W4 behoben** |
| Amtsenthebung, Putsch | Putsch nur im Krieg | **in W4 behoben** |
| Sturz bei autoritärem Kurs | blieb aus (Zustimmung 42 %) | tritt ein (Lauf B) |
| Justiz-Sperre, Notstand als Regler, HSK tot, Artikel Notstand und Immunität folgenlos, Erlass gegen laufendes Gesetz | vorhanden | **unverändert** |
| Werte laufen in die Sättigung | alt A: Unabhängigkeit, Rechtssicherheit und Legitimität bei 100; alt B: Pressefreiheit und Unabhängigkeit bei 0 | gedämpft: A 66 / 92 / 87; B fällt weiter auf 0 / 0 / 7 |

---

## 8. Katalog: was fehlt oder zu reparieren ist

Priorität: P0 sofort (Fehler oder Widerspruch, der das Spiel verfälscht), P1 nächste Welle, P2 später. Aufwand: S unter einem Tag, M einige Tage, L eine Woche und mehr.

| Nr. | Vorhaben | P | Aufwand | Begründung (Befund) |
|---|---|---|---|---|
| K1 | **Ein Gesetzesweg.** Regler-Gesetze und Regler-Erlasse über dieselben Prüfungen führen wie Vorhaben (Erlassverbot aus `GESETZESVORHABEN`, Normenkontrolle, Ruhezeit), oder die Regler bei Maßnahmen mit Vorhaben sperren und auf die Karte verweisen | P0 | M | F1, F1b |
| K2 | **Normenkontrolle nach Richtung**: Grundrechte *einschränkend* = Klagerisiko, *erweiternd* = keines. Klagebefugt sind auch Lagerpartner ab 120 Sitzen gemeinsam (wie im Datenkopf beschrieben). | P0 | S | F4 |
| K3 | **Sperre „Justiz im Umbau“ eingrenzen**: nur Gerichtsorganisation (Richterstellen, Richterrat), nicht Notstand, Urteilsumsetzung oder Antikorruption; sie beginnt erst mit der Annahme | P0 | S | F3 |
| K4 | **Kacheln der Gesetzesvorhaben reparieren**: Titel sichtbar, Stimmenzeile nicht überlagert, Fassung nennen; Werkstatt-Text „bis zu fünf Artikeln“ auf sechs berichtigen | P0 | S | 3.3 |
| K5 | **Mehr Gegenwind im Parlament**: Übertritte nach Inhalt statt pauschal, Abweichler auch in der eigenen Partei, Startmehrheit kleiner oder Partnerforderungen härter; Ziel: ein Teil der scharfen Fassungen „knapp“ oder „verloren“ | P0 | M | F2, F14 |
| K6 | **Ausnahmezustand als Vorgang**: Erklärung durch den Präsidenten, Zustimmung des Parlaments am selben Tag, 6 Monate mit Verlängerung, Notstandserlasse, die nach 3 Monaten ohne Bestätigung fallen (Regeln aus INSTITUTIONEN.md §1); Nutzen: Sperren aufgehoben, Erlasse billiger | P1 | M | F8 |
| K7 | **Prüfung von Verfassungspaketen auf Formfehler** (INSTITUTIONEN.md §3), etwa Eilverfahren oder knapp verfehlte Mehrheit; die Inhaltskontrolle entfällt. Die Anfechtung geht von einer Partei aus, die das Paket ablehnt. | P1 | S | F5 |
| K8 | **Abweichler beim Verfassungspaket** nach `jaAnteilLager` | P1 | S | F6 |
| K9 | **Verfassungsartikel mit Mechanik**: „Notstand eng oder weit“ steuert K6 (Dauer, Parlamentsbeteiligung); „Immunität aufgehoben“ ist Voraussetzung für das Oppositionsinstrument oder verbilligt es | P1 | M | F7 |
| K10 | **Parteiverbot mit Folge**: Sitze werden fraktionslos oder gehen an eine Nachfolgepartei; Wahlteilnahme erst nach Neugründung | P1 | M | F9 |
| K11 | **Boykott zählt**: Abwesende fallen aus Ja und Nein; die Hürde ist die Mehrheit der Anwesenden (mindestens 151, INSTITUTIONEN.md §2) | P1 | S | F10 |
| K12 | **Kommunalwahl kalibrieren**: Gewinn möglich, wenn das Vertrauen vor Ort um den Startwert liegt | P1 | S | F13 |
| K13 | **Gesetze mit Konflikt nach der Abstimmung**: Gegnerverbände starten bei scharfer Fassung eine Bewegung (`starteBewegung`) oder Klagen vor den Verwaltungsgerichten | P1 | M | F15 |
| K14 | Erlass sperren, solange zur selben Maßnahme ein Gesetz im Parlament liegt, oder davor warnen | P2 | S | F11 |
| K15 | HSK-Sitze mit Ereignis und Wirkung (Karrieren, Ermittlungen) oder aus der Anzeige nehmen | P2 | S | F12 |
| K16 | Umsetzungstempo abhängig von Fähigkeit und Loyalität des Ministers und von der Verwaltung | P2 | M | 5 |
| K17 | Gesetzesbestand: Liste der beschlossenen Vorhaben mit Datum, Fassung und Gerichtsstatus (der Zustand `beschlossen` existiert bereits, `gesetzgebung.ts:58-66`) und ein Weg zur Aufhebung eines Vorhabens | P2 | S | 2.1 |
| K18 | Opposition mit eigenen Gesetzentwürfen, die als Dilemma auf den Tisch kommen (populär, aber gegen die eigene Linie) | P2 | M | 5 |

---

## 9. Rohdaten und Skripte

Alle Dateien liegen in `/tmp/claude-0/-home-user-NWO/d4866be2-bd79-588d-ab46-992dad67ab93/scratchpad/analyse/recht/`. Die Skripte wurden zum Ausführen kurz in den jeweiligen game-Ordner kopiert und danach wieder gelöscht.

- `rechtslauf.test.ts` und `lauf1.txt`: alter Stand, Läufe A, B und C
- `w4lauf.test.ts` und `w4lauf.txt`: W4, Läufe A, B und C
- `w4gericht.test.ts` und `w4gericht.txt`: W4, Mehrheiten in 5 Seeds, Gerichtsfälle, Regler- gegen Vorhabenweg, Lagerdisziplin bei der Verfassung
- `ui3.mjs`, `ui4.mjs` und `shots_w4/`: Browserprüfung der Akte „Parlament und Recht“
