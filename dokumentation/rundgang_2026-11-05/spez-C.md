# Spezifikation C: Land und Forschung & Ziele (5. November)

Grundlage: Kritik C (kritik-C.md), PLAN_OBERFLAECHE_2026-11-05.md (Abschnitte 2, 3, 5), Entscheidungen W (17 Ministerien; ein Weg zum Gesetz über die Maßnahme; Karte als Bühne für Land, Außen und Sicherheit). Alle Pfade relativ zu `/home/user/NWO/game/src`. Richtwert 1440×900. Alle Größen in px sind Gestaltungsvorgaben, keine Spielzahlen. Spielzahlen kommen nur aus den genannten Funktionen. Wo sie fehlen, steht eine Datenlücke.

**Bühne für Land (gilt für Karte, Bauleiste und Katastrophen):** Die Karte (`ui/atlas/AtlasMap.tsx`) bleibt bildschirmfüllend und wird nicht mehr `sparsam` gezeichnet (Stage.tsx:810 setzt heute `sparsam={!!dossier}`; für Land, Außen und Sicherheit entfällt das). Rechts liegt ein **Seitenfenster** von 480 px Breite, 56 px unter der Kopfleiste bis 16 px über dem unteren Rand, also etwa 828 px hoch. Die linke Leiste klappt beim Öffnen von Land auf ihre Ikonenbreite (56 px) zusammen. Freie Kartenfläche: etwa 1440 − 56 − 480 = 904 px breit. Die Kamera zentriert über den vorhandenen Prop `randRechts={480}` (AtlasMap.tsx, heute nur im Prolog genutzt). Kopf des Seitenfensters: Bereichsname, drei Ansichtsreiter **Karte · Bauleiste · Katastrophen**, Schließen. Der alte Aktenkopf mit drei Kennzahlkästen und zwei Reiterzeilen entfällt für Land.

---

## A. Entscheidungen mit Begründung

### A1. Wohin die Rüstungsprojekte gehören

**Befund im Code:**
- Rüstungsprojekte sind Vorhaben des Reiches mit `bereich: "militaer"` (`data/reich/militaer.ts`: `mil_drohnen`, `mil_anadolu`, `mil_s400`, `mil_f16`, `mil_stahlkuppel`, `mil_altay`, `mil_kaan`, `mil_kaan_motor`, `mil_eurofighter`, `mil_f35`, `mil_tf2000`, `mil_huerjet`, dazu Doktrinen).
- Es gibt genau **eine** Baureihenfolge für alle Bereiche: `reichZustand(w).laufend` (sim/reich.ts:60). Alle Vorhaben teilen dieselbe `bauKapazitaet(w)` (sim/reich.ts:186), verteilt in Reihenfolge durch `bauplan(w)` (sim/reich.ts:377).
- Der Wissensbaum ist **keine eigene Welt**: Seine Knoten *sind* diese Vorhaben (data/wissensbaum.ts, Kopfkommentar; Zweig `ruestung` mit `mil_drohnen`, `mil_huerjet`, `mil_altay`, `mil_kaan_motor`, `mil_stahlkuppel`, `ki_militaer`, `meer_uwdrohnen`, `mil_kaan`, `mil_tf2000`, `meer_uboote`). `forschungsTempo(w, id)` multipliziert die Baurate (sim/reich.ts:391). Beschaffungen (`mil_f16`, `mil_eurofighter`, `mil_f35`, `mil_s400`) stehen nicht im Baum.
- Deshalb erscheint Altay heute in Forschung und in jeder Reich-Akte: `Reich.tsx:553` rendert `<Baureihenfolge>` ungefiltert in Infrastruktur, Kultur, Recht, Haushalt und Militär.

**Entscheidung:**
1. **Eine Bauleiste für das ganze Land**, als Ansicht der Akte Land. Rüstung, Netze, Kultur, Justizbauten und Reformen erscheinen dort gemeinsam, weil sie wirklich um dieselbe Kapazität konkurrieren. Wer Rüstung herausfiltert, verschweigt, warum der Wiederaufbau langsamer geht. Jede Zeile trägt ihr **Ministerium** als Abzeichen (siehe A3), Rüstung zusätzlich ein Schild-Ikon.
2. **Beginnen** werden Rüstungsprojekte in **Sicherheit › Streitkräfte & Bau** (Katalog `vorhabenListe(w, "militaer")`). Dort steht dieselbe Bauleisten-Komponente im Modus `filter="ruestung"` (gleiche Daten, gleiche Reihenfolge, nur Ausschnitt), mit dem Satz „Rüstung belegt 63 von 133 Baupunkten“ (Summe `bauplan(w)` der `militaer`-Vorhaben gegen `bauKapazitaet(w)`; die Zahlen dienen nur als Beispiel des Formats).
3. **Im Technologiebaum** bleibt der Zweig `ruestung`, weil die Entscheidungen Lizenz, Werkstandort und Schwerpunkt dort leben (sim/wissensbaum.ts: `kaufeLizenz`, `standortSichten`, `setzeSchwerpunkt`). Ein laufender Rüstungsknoten zeigt **keine eigene Restzeit**. Er zeigt „Bauleiste Platz 3 · fertig in 31 Monaten“ aus `warteschlange(w)` (`position`, `fertigIn`) und einen Knopf „In der Bauleiste zeigen“. So gibt es eine Zahl an einem Ort.
4. **Kultur, Recht und Haushalt zeigen keine Baureihenfolge mehr.** `Reich.tsx:553` entfällt dort.

**Begründung:** Eine Ressource braucht eine Warteschlange, und eine Zahl gehört an einen Ort (Leitsatz 4). Die Trennung nach Ort des Beginnens (Sicherheit) gegen Ort des Wartens (Land) entspricht der Wirklichkeit: Beschafft wird über das Präsidium der Verteidigungsindustrie (SSB, seit 2018 beim Präsidenten angesiedelt, *Quelle zu prüfen*: Präsidialdekret Nr. 1, 10.7.2018), gebaut wird mit denselben Firmen und Fachkräften wie im Zivilbau.

### A2. Wie Programme und Fokusbaum zusammenhängen

**Befund im Code:**
- **Fokus** (sim/fokus.ts): genau **einer** läuft. Er kostet Kapital und Aufmerksamkeit, dauert Tage, braucht Vorgänger, schließt **Gegenwege** aus (`ausschluesse`) und verschiebt die Richtung (Achsen, Partner, Gruppen). Er öffnet Gesetze und Knoten (`OEFFNET`, data/fokusbaum.ts:153).
- **Programme** (sim/programme.ts): **höchstens 2 Schritte** gleichzeitig (`MAX_LAUFEND = 2`). Ketten mit Bedingungen *in der Wirklichkeit* (Maßnahme auf Stufe, Problem gelöst, Inflation unter X), ohne Gegenwege und ohne Richtung, mit dauerhafter Wirkung, Rabatt (`rabattFuer`) und Schutz (`schutzFuer`).
- **Große Ziele** (sim/grosseziele.ts): höchstens 3 verfolgt (`GROSSE_ZIELE.maxVerfolgt`), Stufen mit Schwelle und gewürfeltem Versuch (`versuche`), Wege (`gipfel`, `fonds`, `kampagne`).

**Entscheidung:** Programme **gehen nicht im Fokusbaum auf**. Sie werden mit den Großen Zielen zur Ansicht **Vermächtnis** zusammengelegt. Der Fokusbaum bleibt in **Bäume** neben dem Technologiebaum.

**Begründung:**
1. Ein Einbau würde Spielregeln stillschweigend ändern: Ein Fokus läuft allein, Programmschritte laufen zu zweit; Foki schließen einander aus, Programmschritte nicht. Beides gleichzumachen ist eine Balance-Entscheidung, keine Oberflächenfrage.
2. Die Fragen sind verschieden. Der Fokusbaum beantwortet „Wohin steuere ich das Land?“ (Richtung, Verzicht). Programme und Große Ziele beantworten „Was liefere ich und was hinterlasse ich?“ (Bedingungen erfüllen, Ergebnis).
3. In der Oberfläche werden die Verbindungen sichtbar statt verschmolzen. Ein Fokus zeigt, welche Technologien und Gesetzesfassungen er öffnet (`OEFFNET`). Ein Programm zeigt, welchem Großen Ziel es dient: neues **Datenfeld** `dient?: string[]` an `Programm`, rein darstellend, ohne Wirkung. Vorschlag zur Abnahme durch den Projektinhaber: „Wasser und Energie der Zukunft“ → Energieunabhängigkeit; „Rechtsstaat und Vertrauen“ → EU-Vollmitgliedschaft und Versöhnung im Innern; „Sicherheit und Frieden“ → Ordnung im Nahen Osten; „Die Türkei in der Welt“ → Die Welt ist größer als fünf; „Starke Regionen“ → Kornkammer des Nahen Ostens. Die übrigen ohne Zuordnung. Das ist eine inhaltliche Zuordnung, keine Zahl.
4. **Ziele der Amtszeit** (sim/ziele.ts, `zielStand`) sind ein drittes Ding. Sie wandern in den Schreibtisch (dort steht `zielStand` schon, ui/schreibtisch/Schreibtisch.tsx:89) und verschwinden aus Forschung (Kopfkennzahl „Ziele erreicht 1 / 3“, Bereiche.tsx:139–140).

### A3. Ministerien in Land und Forschung (Zuordnung zu den 17)

Neue reine Funktion `ressortVon(v: Vorhaben): MinisteriumId` in einer neuen Datei `sim/ressorts.ts`. Sie leitet aus `v.bereich`, `v.thema`, `v.klasse`, Netz (`AusbauEintrag.netz`) und Zweig (`ZWEIG_VON`) ab, ohne den Katalog zu ändern. Die Zuordnung nach der Ressortverteilung der Türkei ist überall *zu prüfen* an Präsidialdekret Nr. 1 (Ministerien) und Nr. 4 (zugeordnete Einrichtungen, Cumhurbaşkanlığı Kararnamesi No. 4):

| Gegenstand im Spiel | Ministerium | Einrichtung (real) |
|---|---|---|
| Netze `strasse`, `bahn`, `hafen`, `flughafen`, `internet`; Kanal Istanbul; Bahn Kars–Tiflis; Themen `verkehr` | Verkehr und Infrastruktur | Straßenbauamt KGM, TCDD, BTK |
| Netz `strom`; Ost-West-Stromachse; Akkuyu; Gas Sakarya; Thema `energie` | Energie und Rohstoffe | — |
| Netz `wohnen`; Wohnungsbau-Vorlagen; Gebäudeverstärkung; Bauaufsicht; Thema `stadt` | Umwelt, Städtebau und Klima | TOKİ (Zuordnung prüfen) |
| Netz `wasser`; Dämme; Bewässerung; Dürre | Landwirtschaft und Forst | DSİ |
| Netz `klinik` | Gesundheit | — |
| `bereich: "kultur"`; Restaurierungen; Stätten | Kultur und Tourismus | — |
| AFAD (Behörde und Maßnahme `m_afad_ausbau`) | Inneres | AFAD (data/behoerden.ts:117 sagt schon `ressort: "inneres"`) |
| `bereich: "militaer"`, Beschaffung | Verteidigung (Nutzer) / Präsidium (SSB) | SSB beim Präsidenten (prüfen) |
| Wissensbaum außer `ruestung`; Raumfahrt; Thema `technologie`, `ki` | Industrie und Technologie | TÜBİTAK, Raumfahrtagentur TUA |
| Hochschulen, Bildungsverwaltung | Bildung | YÖK ist eigenständig; Bildung als Näherung, sichtbar benannt |
| `bereich: "recht"` | Justiz | — |
| `bereich: "haushalt"` | Finanzen | — |

Die Personen (`Figur["amt"]`) für die 17 Ressorts gehören zur Spezifikation Kabinett. Bis sie da sind, zeigt das Abzeichen nur den Ressortnamen, kein Porträt. Die fest verdrahteten `BEREICH_AEMTER.land = ["inneres","wirtschaft"]` und `.wissen = ["stab","wirtschaft"]` (Bereiche.tsx:369–370) entfallen.

### A4. AFAD doppelt (Maßnahme und Behörde)

Zwei Hebel wirken heute auf denselben Netzknoten `katastrophenschutz`: die Maßnahme `m_afad_ausbau` (data/politiknetz.ts:779, 812) und die Behörde `afad` mit Personal, Technik und Reichweite (data/behoerden.ts:117–125). Daraus ergibt sich `bereitschaft(w)` (sim/katastrophe.ts:248). **Entscheidung für die Oberfläche:** eine Zeile „AFAD“ in Katastrophen › Vorsorge. Ihr Regler ist die Maßnahme (Weg Gesetz, Entscheidung W2). Darunter klappen die drei Behördenachsen mit „Ausbauen“ und „Kürzen“ auf (`BehoerdeDetail`, ui/behoerden/Behoerde.tsx). Ob beide Mechaniken zu einer verschmelzen, ist eine Regelfrage (offene Frage 2). Bis dahin bleiben beide, aber an einem Ort.

---

## B. Ansichten

#### Land › Karte

1. **Frage und Erfolg:** „Wo im Land muss ich bauen, pflegen oder helfen, und was kostet es?“ In 5 Sekunden muss sichtbar sein: die drei schlimmsten Orte (rot markiert auf der Karte und als drei Zeilen oben im Seitenfenster), alle laufenden Baustellen als Kräne mit Fortschrittsring und die möglichen Großprojekte als gestrichelte Umrisse.

2. **Aufbau (Zonen):**
   - **K0 Karte** (Bühne, etwa 904 × 844 px): eingefärbt nach der gewählten Ebene, Marken darüber.
   - **K1 Ebenenleiste** (auf der Karte unten links, 4 Ikonenknöpfe à 56 × 56 px, Abstand 8 px): **Bauen · Netze · Kulturerbe · Gefährdung**. Bei „Netze“ erscheint daneben eine Chipreihe der 9 Netze (je 28 px hoch).
   - **K2 Kapazitätsstreifen** (unten über der Kartenbreite, 904 × 48 px): Miniatur der Bauleiste (Balken der Baukapazität, farbig je Vorhaben). Klick führt in die Bauleiste.
   - **S1 Seitenfenster-Kopf** (480 × 64 px): Reiter Karte · Bauleiste · Katastrophen.
   - **S2 „Hier brennt es“** (480 × etwa 180 px): drei Zeilen à 56 px.
   - **S3 Legende der Ebene** (480 × etwa 72 px): Farbverlauf mit Endtexten und ein Satz.
   - **S4 Drill-down-Fläche** (Rest, etwa 500 px, scrollt allein): ohne Auswahl die Zeilen „Laufend an Orten“ (höchstens 6). Mit Auswahl die **Provinzkarte** oder die **Ortkarte** (siehe 3.).
   - In der ersten Bildschirmhöhe stehen K0, K1, K2, S1, S2 und S3 vollständig. S4 beginnt sichtbar.

3. **Inhalte je Zone:**
   - **K0, Färbung je Ebene:**
     - *Bauen*: Gelände ohne Einfärbung (`ebene="gelaende"`), damit die Marken lesbar sind.
     - *Netze*: vorhandene Linse `belastung` (ui/infrastruktur/linse.ts, `belastungFarben` aus `belastungJeProvinz(w)`: höchste Auslastung aller Netze je Provinz). Mit gewähltem Netz-Chip die neue Funktion `netzFarben(w, netz)` mit `auslastung(w, netz, plaka)` (sim/infrastruktur.ts:226) und derselben Farbskala `belastungsFarbe` (grün bis 60 %, gelb bis `SCHWELLE.voll` = 0,85, rot ab 1,1; data/infrastruktur-netze.ts:54).
     - *Kulturerbe*: Linse `erbe`.
     - *Gefährdung*: Linse `risiko` (Erdbebengefährdung je Provinz über `depremRisiko(plaka)`, sim/katastrophe.ts:129, dazu Flut und Brand).
   - **K0, Marken** über `reichMarken(w, ebene)` (ui/atlas/marken.ts) mit den Arten `bau` (Kran mit goldenem Ring = `fortschritt`), `wunder` (fertiges Stück, Zustand als Farbe nach `ZUSTAND_VERFALL` 60 und `ZUSTAND_GEFAHR` 40) und `erbe`. **Neu: Art `plan`** (gestrichelter Umriss, halbtransparent) für Vorhaben mit `v.ort`, Status `verfuegbar`, und Klasse `wunder`, `grossprojekt`, `serie` oder `ausbau`. **Neu: Art `gesperrt`** (grau mit Schloss) für Status `gesperrt`. Datenquelle: neue Funktion `planOrte(w)` neben `kartenOrte(w)` (sim/reich.ts:1352) über `vorhabenListe(w, b)` für alle fünf Bereiche. `kartenOrte` bleibt unverändert, damit Tests stabil bleiben. `plan` und `gesperrt` erscheinen nur in der Ebene „Bauen“, mit `dmax` 15 wie die Stätten.
   - **K0, Neubau-Linien** aus `ui/atlas/neubau.ts` (gestrichelte Trasse, vergoldet nach Fortschritt), für `plan` zusätzlich als graue gestrichelte Trasse, wenn `v.provinzen` eine Kette ergibt.
   - **K1:** Ikonen `kran`, `strasse`, `kuppel`, `beben` (aus `ui/icons.tsx`, schon für die Linsen vergeben: `belastung`, `infrastruktur`, `erbe`, `risiko`, ui/ebenen.ts:57–62). Die Tasten folgen der globalen Linsentabelle (`LINSEN_TASTEN`, ui/linsen/linsen.ts). Keine neuen Tasten, damit es keine Doppelbelegung gibt (Plan 6: Tasten 1–4).
   - **K2:** wie Bauleiste Zone B1 in Klein. Segmente = `bauplan(w)[id] / bauKapazitaet(w)`, Rest „frei“. Farbe je Ministerium aus A3. Höhe 20 px plus Zeile „99 von 133 Baupunkten verplant · Verwaltungskraft 99 (+2 im Monat)“ (`verwaltungBilanz(w).vorrat`, `.netto` auf ganze Zahlen gerundet).
   - **S2 „Hier brennt es“:** die drei dringendsten Orte, gemischt und nach Rang sortiert:
     1. laufende Katastrophenfälle (`katastrophenZustand(w).faelle` mit `!bewaeltigt`, sim/katastrophe.ts:164);
     2. Provinzen mit Überlast `auslastung ≥ SCHWELLE.ueberlast` aus `engpaesse(w, netz, 1)` je Netz (sim/infrastruktur.ts:444);
     3. Stücke oder Stätten mit Zustand unter `ZUSTAND_GEFAHR`.

     Zeile: Ikone, „İstanbul: Straßen 109 %“, rechts der Knopf „Zeigen“. Ohne Treffer steht dort *eine* Zeile „Kein Ort über der Schwelle“. Kein Urteil „Lage: ruhig“.
   - **S3:** `legende` aus `farbenFuerEbene` (ui/ebenen.ts) bzw. `belastungFarben(w).legende`.
   - **S4 Provinzkarte** (neue reine Funktion `provinzSicht(w, plaka)` in `sim/provinz.ts`, die vorhandene Quellen bündelt):
     - Kopf: Name, Region (`PROVINZEN[plaka-1]`, `REGION_DE`, sim/regional.ts), Einwohner (ganze Tausend).
     - **Netze dieser Provinz**: 9 Mini-Balken (je 20 px hoch) mit Marke bei 100 %, aus `auslastung(w, netz, plaka)`; null heißt „kein Netz dieser Art“ und wird ausgelassen.
     - **Gefährdung**: Erdbebenrisiko 1–5 als fünf Punkte (`depremRisiko(plaka)`), Erdbebenvorsorge der Provinz (Netzknoten `erdbebenvorsorge`, Wert der Provinz), Hinweis Flut/Brand/Dürre, wenn die Provinz in `FLUT_GEBIET`, `BRAND_GEBIET` oder `DUERRE_BECKEN` (sim/katastrophe.ts) liegt.
     - **Hier im Bau / fertig**: Vorhaben mit `v.ort.plaka === plaka` oder `v.provinzen` enthält `plaka`, mit Status aus `vorhabenSicht`.
     - **Kulturerbe hier**: `ERBE.filter(e => e.plaka === plaka)` mit Zustand `z.staetten[id].zustand`.
     - **Handlungen** (je Zeile Preis am Knopf):
       - „Netz ausbauen“ je überlastetem Netz über `ausbautenFuer(netz)` und `ausbauAngebot(w, id, plaka)` mit Vorher/Nachher-Auslastung (`vorher`, `nachher`), `pk`, `monate`, `schulden`;
       - „Programm hier anlegen“ (Wohnungsbau, Schulen, Wasser) über `regionalVorschau(w, vorlageId, [plaka])` und `beginneRegional` (sim/reich.ts:1293, 1324);
       - „Restaurieren“ je Stätte über `vorhabenSicht(w, "restaurierung_"+id)`.
     - Heute steckt ein Teil davon in `ui/ProvinceCard.tsx`. Die Provinzkarte ersetzt dort den Knopf „Bauen“ (`onBauen`, Zeile 178).
   - **S4 Ortkarte** (Klick auf eine Marke):
     - **Kopf** 480 × 160 px: Bild `WunderBild` (ui/reich/WunderBild.tsx, Zustand `entwurf`, `bau` oder `fertig`), Name, Klasse (`KLASSEN_NAMEN`), Ministerium.
     - **Preis-Zeile** mit **beschrifteten** Ikonen statt nackter Zahlen: „12 Kapital · 3.200 Baupunkte · 60 Monate · 3 Verwaltung je Monat · +0,9 Pp. Schuldenquote“ aus `v.kosten`. Die Schuldenquote behält eine Nachkommastelle, weil sie kein Index ist.
     - **Wirkung**: höchstens drei Zeilen aus `effektZeile(e, "sofort", w)` (sim/reich.ts:500). Länderkürzel werden über `akteurName` ausgeschrieben (heute „GEO“, „AZE“, „RUS“).
     - **Kehrseite**: ein Satz `v.kehrseite`; Verlierer aus `v.verlierer`.
     - **Vergabe**: drei Knöpfe nebeneinander aus `vergabeAngebot(v, vergabe)` (sim/reich.ts:126), je mit pk, Baupunkten, Monaten und Vorlauf. Beginnen mit `beginne(w, id, vergabe)`.
     - **Voraussetzungen**: Häkchenzeilen aus `pruefeVoraus`, jede mit Sprungziel.
     - **Im Bau**: „Bauleiste Platz 2 · 36 Baupunkte im Monat · fertig in 16 Monaten“ aus `warteschlange(w)`, dazu die Knöpfe „Pausieren“ (`pausiere`) und „In der Bauleiste zeigen“.
     - **Fertig**: `pflegeStand(w, id)` mit Zustand, „in fünf Jahren ohne Pflege: Zustand X, es fehlt …“ (`verfall`) und „Instandsetzen“ mit Preis (`pflege`).
     - **Stätte**: Zustand, Restaurieren mit `nach.zustand`.
   - **Datenlücken:** (a) Verlauf je Provinz für Netze und Infrastruktur ist nicht gespeichert (`NetzStand` hat nur Start und jetzt). Einen Zeitregler gibt es also nicht; er bleibt Lücke, möglich über einen Monatsring in `infrastrukturMonat`. (b) Geometrie der Verwerfungslinien fehlt; `ZONEN` sind Provinzlisten (sim/katastrophe.ts:136). Mögliche Quelle: MTA, Aktive Störungskarte der Türkei (Diri Fay Haritası), Lizenz prüfen. Bis dahin färbt „Gefährdung“ nur Provinzen.

4. **Zustände:**
   - *Kein Spielstand*: Karte ohne Marken, Seitenfenster „Erst ein Spiel beginnen“.
   - *Normal*: wie oben.
   - *Katastrophe läuft*: S2 zeigt den Fall zuerst (rot), die Karte springt einmal über `ereignis` (Art `beben`) zum Ort. Der Reiter „Katastrophen“ bekommt einen roten Punkt.
   - *Krieg*: Marken in Provinzen der Front (`krieg`-Prop, `kriegsKarte`) werden blass. Hinweis in der Ortkarte: „Im Kriegsgebiet: Bau ruht“, nur wenn das Modell das so führt. Heute ist im Reich-Code keine Kriegssperre zu sehen, also ohne Hinweis; das ist eine offene Frage für Sicherheit.
   - *0 Kapital*: Knöpfe mit pk > Vorrat sind gesperrt und zeigen „fehlen 4 Kapital“ (`kannZahlen`, sim/kapital.ts).
   - *Verwaltungskraft 0*: K2 zeigt „Bau halbiert: Verwaltungskraft erschöpft“ (`verzug = 0.5` in `bauplan`).

5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Provinz | Klick | Auswahl, Provinzkarte in S4, Provinz hervorgehoben (`selected`) | S4 Provinzkarte |
| Provinz | Hover | Zeiger mit Name und `belastungZeilen(w, plaka)` (`hoverZeilen`) | — |
| Marke Kran/Wunder/Plan/Stätte | Klick | Ortkarte in S4, Kamera fährt zur Marke | S4 Ortkarte |
| Marke | Hover | Tafel aus `marken.ts` (Name, Lage, Rest, nächste Entscheidung) | — |
| Ebenenknopf (4) | Klick/Taste | wechselt die Färbung, S3 neu | K0 |
| Netz-Chip (9) | Klick | Färbung nur dieses Netzes (`netzFarben`) | K0 |
| Zeile in S2 | Klick „Zeigen“ | Kamera zur Provinz, Provinzkarte öffnet | S4 |
| K2 Streifen / Segment | Klick | wechselt zur Bauleiste, Zeile des Segments markiert | Bauleiste |
| „Bauen: Ausschreibung / Stammfirma / Sparvergabe“ | Klick | `beginne`; Marke wird Kran; Meldung mit Preis | bleibt; K2 wächst |
| „Netz ausbauen“ | Klick | `investiere(w, id, plaka, vergabe)` | bleibt |
| „Programm hier anlegen“ | Klick | `beginneRegional(w, vorlage, [plaka])` | bleibt |
| „Restaurieren“ / „Instandsetzen“ | Klick | `beginne(w, pflegeId)` | bleibt |
| „Pausieren“ | Klick | `pausiere(w, id, true)` | bleibt |
| Voraussetzung (rot) | Klick | Sprung zur Maßnahme (Politik), zum Knoten (Bäume) oder zur Behörde | Zielansicht; „Zurück“ oben links bringt hierher |
| Ministeriumsabzeichen | Klick | Ministerakte (Kabinett, Ressortrad) | Kabinett |
| × in S4 | Klick/Esc | Auswahl aufheben | S4 Grundzustand |
| Schließen Seitenfenster | Klick/Esc | Karte ohne Fenster | Karte |

6. **Übernommen / gelöscht:**
   - **Wiederverwendet:** `ui/atlas/AtlasMap.tsx` (Props `orte`, `onOrt`, `onSelect`, `hoverZeilen`, `neubau`, `randRechts`, `ereignis`), `ui/atlas/marken.ts` (erweitert um `plan` und `gesperrt`), `ui/infrastruktur/linse.ts`, `ui/linsen/*`, `ui/reich/WunderBild.tsx`, `ui/reich/Regional.tsx` (Ortswahl entfällt, der Ort ist die Provinz), `ui/reich/Pflege.tsx` (Zeilenbaustein `Zeilen`).
   - **Umgebaut:** `ui/ProvinceCard.tsx` (wird Provinzkarte im Seitenfenster statt schwebendem Blatt über der Provinz; Plan 6: „Provinzfenster verdeckt die Provinz“), `ui/reich/WunderFenster.tsx` (Inhalt wird Ortkarte).
   - **Gelöscht:** `ui/akte/Bildkarten.tsx` (die vier Karten von 034; ihr Inhalt ist die Ortkarte), `ui/infrastruktur/Netze.tsx` als Seite (die Kacheln entfallen; die Detailtexte gehen in die Provinzkarte), die Kultur-Ansicht von `ui/Reich.tsx` für `bereich="kultur"`.
   - **Gehen hier auf:** 034 Lage der Regionen, 036 Netze, 037 Kultur und Erbe, 039 Behörden (AFAD → Katastrophen), 040 Entwicklung des Landes, 041 Zuständige Minister (→ Abzeichen), 042 Bau & Umsetzung (→ Bauleiste).

7. **Simulationsbedarf:**
   - `planOrte(w)` in sim/reich.ts (neu, rein).
   - `provinzSicht(w, plaka)` in sim/provinz.ts (neu, rein, bündelt nur vorhandene Funktionen).
   - `netzFarben(w, netz)` in ui/infrastruktur/linse.ts (neu).
   - `ressortVon(v)` in sim/ressorts.ts (neu, siehe A3).
   - In `reichMarken` die Restzeit aus `vorhabenSicht(w, id).restMonate` statt `monate * (1 − p)` (marken.ts, Zweig `art === "bau"`), damit Karte und Bauleiste dieselbe Zahl zeigen.
   - `KartenOrt.art` um `plan` und `gesperrt` erweitern (AtlasMap.tsx:40) samt Zeichnung in `MarkenForm.tsx`.
   - Keine Spielregel ändert sich.

8. **Texte:**
   - Neu: „Hier brennt es“, „Bauen / Netze / Kulturerbe / Gefährdung“, „Programm hier anlegen“, „In der Bauleiste zeigen“.
   - Es entfallen: „Lage: ruhig“, „Was Sie jetzt in Auftrag geben können“, „Infrastruktur und Bau öffnen“, „Baustelle ansehen →“, „Woher die Zahlen kommen“.
   - Kopfkennzahl „Infrastruktur 60“ entfällt. Sie war in Wahrheit der Netzknoten `verkehrsnetz` (Bereiche.tsx:133).
   - Auslastung in ganzen Prozent, Zustände und Indizes ganzzahlig, Monate ganzzahlig, Schuldenquote mit einer Nachkommastelle und „Pp.“.

9. **Abnahme:**
   - Seitenfenster ohne Scrollen bis einschließlich S3 (≤ 828 px). Keine Ansicht dieser Akte länger als 1,3 Bildschirme.
   - Jede Marke führt zur Ortkarte *dieses* Vorhabens (Test: Klick auf `v:kanal_istanbul` öffnet die Ortkarte mit diesem Namen).
   - Restzeit einer Baustelle gleich in Tafel, Ortkarte und Bauleiste (Test gegen `warteschlange(w).fertigIn`).
   - „Hier brennt es“ nennt jede Provinz mit `auslastung ≥ 1,0`, wenn sie unter den drei schlimmsten ist; der Widerspruch „0 Netze überlastet“ ist ausgeschlossen.
   - Keine Ikone ohne Beschriftung in der Preiszeile; keine Länderkürzel im Text.
   - Tests anpassen: `test/karte-marken.test.tsx` (neue Arten, Restzeit), `test/linsen.test.tsx` (Netz-Chips ohne neue Tasten), `test/akte-bildkarten.test.tsx` (entfällt), `test/akte-lage.test.tsx` und `test/akte-bereiche.test.tsx` (Land ohne Lage, Behörden, Bilanz, Personen), `test/aktennavigation.test.tsx` (drei Reiter), `test/infrastruktur.test.ts` (unverändert, nur UI-Teile prüfen).
   - Neu: `test/provinzsicht.test.ts`, `test/planorte.test.ts`.

10. **Aufwand und Abhängigkeiten:** L. Vorbedingung: Entscheidung W3 umgesetzt im Gerüst (Seitenfenster-Rahmen in Stage.tsx), Behebung „Linke Leiste verdeckt Ebenenmenü“ (Plan 6). Die Zuordnung A3 braucht eine Prüfung der Dekrete. Das Porträt im Abzeichen hängt an der Kabinett-Spezifikation.

#### Land › Bauleiste

1. **Frage und Erfolg:** „Was baut das Land gerade, in welcher Reihenfolge, wann ist es fertig, und was kostet mich eine andere Reihenfolge?“ In 5 Sekunden: der Kapazitätsbalken zeigt, wer wie viel bekommt und wie viel frei ist; die oberste Zeile ist klar die, die zuerst baut.

2. **Aufbau (Zonen)** (Seitenfenster 480 px; mit dem Knopf „Breit“ 960 px über der Karte, dann zweispaltig):
   - **B1 Kapazität** (480 × 120 px): gestapelter Balken, darunter zwei Zahlen (Baupunkte verplant, Verwaltungskraft).
   - **B2 Filterchips** (480 × 36 px): Alle · Zivil · Rüstung · Pflege · Ressort ▾.
   - **B3 Warteschlange** (480 × Rest, eine Zeile 64 px; bei 8 laufenden Vorhaben 512 px): ziehbare Zeilen.
   - **B4 Verfällt** (zugeklappt, Zahl im Kopf): Bestandsstücke unter der Schwelle.
   - **B5 Neu beginnen ohne Ort** (zugeklappt): Vorhaben ohne `ort` (Reformen, Institutionen, Forschung ohne Werk, Vorlagen).
   - **B6 Vorteile** (eine Zeile Siegel, 48 px).
   - **B7 Zuletzt** (zugeklappt).
   - In der ersten Höhe: B1, B2 und mindestens fünf Zeilen von B3.

3. **Inhalte je Zone:**
   - **B1:** Gesamt `bauKapazitaet(w)` (ganzzahlig gerundet). Je laufendem Vorhaben ein Segment mit Breite `bauplan(w)[id] / bauKapazitaet(w)` und Farbe des Ministeriums (`ressortVon`). Rüstung schraffiert. Grauer Rest „frei“. Pausierte Vorhaben und solche in der Vergabephase haben Rate 0 und erscheinen nicht als Segment, sondern als Punkt unter dem Balken. Darunter: „Verwaltungskraft 99 · +2 im Monat“ aus `verwaltungBilanz(w)` (`vorrat`, `netto`), aufklappbar in `einkommen`, `bau`, `unterhalt`. Ein ⓘ erklärt, wie die Kapazität entsteht: `110 + 0,35 × m_bauindustrie + 0,25 × m_industrie_modernisierung + 0,15 × m_fachkraefteprogramm + Bestand` (sim/reich.ts:188). Das sind Spielparameter, hier nur als Satz „wächst mit Bauindustrie, Industriemodernisierung, Fachkräften“ mit Sprung zu den drei Maßnahmen. Ersetzt den zugeklappten Kasten „Was den Bau beschleunigt“.
   - **B3 Zeile** aus `warteschlange(w)` (sim/reich.ts:862) und `vorhabenSicht(w, id)`:
     - links Griff ⠿ und Platzziffer (`position`);
     - Ikone nach Klasse bzw. Ministerium;
     - Name, darunter Ressortname;
     - Fortschrittsbalken (`fortschritt`);
     - rechts „36 Bp./Monat“ (`rate`, ganzzahlig) und „fertig in 16 Mon.“ (`fertigIn`); wenn `startIn > 0`: „beginnt in 3 Mon.“; in der Vergabephase: Uhr-Ikone „Ausschreibung läuft: 2 Mon.“ (`vergabeMonate`);
     - ganz rechts „Pausieren/Weiter“.

     Die Vergabe steht **nur als kleines Ikon mit Hover** (Ausschreibung, Stammfirma, Sparvergabe; `VERGABE_NAMEN`), nicht als gelber Stempel in jeder Zeile. Kostenüberschreitung oder Scheiterrisiko (`v.ueberzug`, `v.scheitern`) als Warnpunkt mit Hover, ohne Prozentangabe, wenn nicht schon im Katalog angezeigt.
   - **B3 Ziehen:** Beim Ziehen nach oben steht am Griff „Vorziehen um 2 Plätze: 20 Verwaltungskraft · verdrängt: F-16 Block 70, Stahlkuppel“. Preis = `VORZIEHEN_VERWALTUNG × überholte Plätze` (sim/reich.ts:805). Die Vorschau der neuen Restzeiten aller Zeilen rechnet eine Kopie von `warteschlange` mit neuer Reihenfolge (neue reine Funktion `warteschlangeMit(w, reihenfolge)`). Loslassen ruft die neue Funktion `verschiebeNach(w, id, zielPosition)`. Sie prüft die Verwaltungskraft für den Gesamtpreis vorab und entspricht sonst genau n Aufrufen von `verschiebe` (gleiche Regel). Nach hinten ziehen kostet nichts (wie heute). Tastatur: Pfeil hoch/runter auf fokussierter Zeile.
   - **B2 Filter:** Zivil = `bereich !== "militaer"`; Rüstung = `"militaer"`; Pflege = Vorhaben mit `pflegt` oder Klasse `restaurierung`; Ressort nach `ressortVon`. Im Filter bleiben Platzziffern die echten Positionen (Lücken erlaubt), damit niemand meint, es gäbe getrennte Schlangen.
   - **B4 Verfällt:** `pflegeStand(w, id)` für alle `z.bestand`, sortiert nach `dringlichkeit`, die ersten 5. Zeile: Name, Zustand, „in 5 Jahren: Zustand X“ (`verfall.zustand`), Knopf „Instandsetzen · 2 Kapital · 150 Bp. · 8 Mon.“ (`pflege.v.kosten`). Der Rest steht auf der Karte (Marken mit Lage `verfallen` oder `gefahr`).
   - **B5 Neu beginnen ohne Ort:** `vorhabenListe(w, b)` für alle Bereiche, Status `verfuegbar`, ohne `v.ort`, gruppiert nach Ressort, Zeile mit Preis und „Beginnen“ (mit Vergabewahl). Vorhaben mit Ort werden hier nicht angeboten; sie beginnen auf der Karte (Leitsatz: Orte auf der Karte). Rüstungsvorhaben erscheinen hier nicht, sie beginnen in Sicherheit (A1).
   - **B6 Vorteile:** `aktiveVorteile(w)` und alle `VorteilDef` (data/reich/typen.ts) als Siegel: aktiv golden, nicht erreicht grau. Hover zeigt Bedingungen (`voraus`), Dauerwirkung und `kehrseite`.
   - **B7 Zuletzt:** `z.meldungen` und abgeschlossene `Eingriff`e (sim/reich-typen.ts:368) mit Vorher/Nachher, höchstens 5.
   - **Vorgänge** (heute Reiter 042, `VorgaengePlatz`): Wohnungsbau aus Zusagen erscheint als normale Zeile in B3 mit Siegel „versprochen bis März 2031“ aus `versprechensLage(w)` (sim/katastrophe.ts:645) bzw. den Vorgängen (`sim/vorgaenge.ts`). Kein eigener Reiter.

4. **Zustände:**
   - *Leer* (nichts im Bau): B1 ganz grau „133 Baupunkte frei“, B3 eine Zeile „Nichts im Bau. Auf der Karte bauen“ mit Sprung zur Karte, Ebene Bauen.
   - *Verwaltungskraft 0*: B1 rot gerahmt „Bau halbiert“, das Vorziehen gesperrt mit Grund.
   - *Krise*: Wiederaufbau-Zeilen aus Katastrophen mit roter Frist.
   - *Vor der Wahl*: Versprechens-Zeilen mit Frist vor dem Wahltag rot.
   - *0 Kapital*: Beginnen und Instandsetzen gesperrt mit „fehlen X Kapital“. Ziehen bleibt möglich (kostet Verwaltung, nicht Kapital).

5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Segment in B1 | Klick | Zeile in B3 markiert und sichtbar gescrollt | B3 |
| Segment | Hover | Name, Rate, Anteil | — |
| ⓘ Kapazität | Klick | Satz und drei Sprünge | Politik › Maßnahme |
| Filterchip | Klick | Filter an/aus | B3 |
| Zeile | Klick | Ortkarte (mit Ort: Kamera fährt hin; ohne Ort: Ortkarte ohne Kamera) | Karte S4 |
| Griff ⠿ | Ziehen | Preisvorschau, Restzeiten aller Zeilen live | — |
| Griff | Loslassen | `verschiebeNach`; Meldung „kostet 20 Verwaltungskraft, verdrängt …“ | B3 |
| Pfeil hoch/runter | Taste | ein Platz, gleiche Regel | B3 |
| „Pausieren/Weiter“ | Klick | `pausiere` | B3 |
| Rüstungszeile | Klick | Ortkarte mit Knopf „In Sicherheit öffnen“ | Sicherheit › Streitkräfte & Bau |
| „Instandsetzen“ (B4) | Klick | `beginne(w, pflegeId)` | B3 (neue Zeile) |
| „Beginnen“ (B5) | Klick | Vergabewahl, dann `beginne` | B3 |
| Siegel (B6) | Hover/Klick | Bedingungen; Klick springt zur ersten fehlenden | Zielansicht |
| „Breit“ | Klick | Seitenfenster 960 px | — |

6. **Übernommen / gelöscht:**
   - **Wiederverwendet aus `ui/Reich.tsx`:** die Logik von `Baureihenfolge` (Zeile 137), `ImBau`, `VorteileListe`, `Verlauf`; `ui/reich/Pflege.tsx`; `ui/reich/Neues.tsx` (wird B5); `ui/reich/Schaetzblatt.tsx` (freie Großprojekte, als Knopf „Eigenes Großprojekt schätzen“ am Ende von B5).
   - **Gelöscht:** die Mehrfachdarstellung `Reich.tsx:553` in allen Bereichen; die Unterreiter „Lage / Bauwerke pflegen / Neue Vorhaben“ (035, 037); `Bauhilfe` und `Groessen` als Blöcke (die Werte stehen in der Provinzkarte bzw. als Netzbalken); `ui/akte/Vorgaenge.tsx` als Reiter.
   - **Gehen hier auf:** 035 Infrastruktur und Bau, Baureihenfolge aus 037, 042 Bau & Umsetzung; die Baureihenfolge aus Justiz und Verwaltung (Kritik A/B).

7. **Simulationsbedarf:**
   - `verschiebeNach(w, id, ziel)` und `warteschlangeMit(w, reihenfolge)` in sim/reich.ts (neu; Regel unverändert, `VORZIEHEN_VERWALTUNG` je überholtem Platz).
   - `ressortVon` (A3).
   - Keine neue Regel.

8. **Texte:**
   - „Bauleiste“ ersetzt „Baureihenfolge“ und „Bau & Umsetzung“.
   - „Bp.“ als Abkürzung für Baupunkte mit ⓘ.
   - Es entfällt der Absatz „Die Schätzungen gelten, solange …“ (wird ⓘ am Kopf von B3) und der Stempel „TRANSPARENTE AUSSCHREIBUNG“ je Zeile.
   - Zahlen ganzzahlig.

9. **Abnahme:**
   - Die Baureihenfolge erscheint im ganzen Spiel genau einmal (Komponente); Sicherheit nutzt dieselbe mit Filter (Test: kein `Baureihenfolge`-Render in Kultur, Recht, Haushalt).
   - Ziehen um n Plätze kostet genau `n × VORZIEHEN_VERWALTUNG` und ergibt dieselbe Reihenfolge wie n Einzelschritte (Unit-Test).
   - Restzeit je Zeile = `warteschlange(w).fertigIn`.
   - Höhe bei 8 Vorhaben ≤ 828 px ohne aufgeklappte Abschnitte.
   - Tests anpassen: `test/reich-ui.test.tsx` (Baureihenfolge, Unterreiter), `test/reich.test.ts` (neue Funktionen).

10. **Aufwand und Abhängigkeiten:** M. Abhängig von A1 (Rüstung), A3 (Ressortfarben) und dem Seitenfenster-Rahmen. Sicherheit › Streitkräfte & Bau (Kritik/Spezifikation D) nutzt die Komponente.

#### Land › Katastrophen

1. **Frage und Erfolg:** „Wie gut bin ich auf das nächste Beben vorbereitet, wo droht es, und was kann ich jetzt tun?“ In 5 Sekunden: Halbrund „Bereitschaft 45 von 100“ mit Referenzmarke, die Karte färbt die Gefährdung, fünf Vorsorge-Zeilen mit Regler und Preis sind sichtbar.

2. **Aufbau (Zonen):** Die Karte färbt automatisch in der Ebene `risiko`.
   - **C1 Halbrund** (480 × 140 px).
   - **C2 Gefahren** (480 × 6 Zeilen à 44 px = 264 px).
   - **C3 Vorsorge** (480 × 5 Zeilen à 72 px = 360 px; Zeile aufklappbar).
   - **C4 Beben simulieren** (Knopf in C1 und auf der Karte unten links; öffnet über der Karte eine Leiste 904 × 160 px).
   - **C5 Laufende Fälle** (nur bei Fällen, dann ganz oben vor C1).
   - **C6 Versprechen** (zugeklappt, Zahl im Kopf).
   - **C7 Chronik** (zugeklappt).
   - Ziel: ≤ 1,3 Bildschirmhöhen bei geschlossenen Klappen (heute 3.596 px).

3. **Inhalte je Zone:**
   - **C1:** `bereitschaft(w)` (sim/katastrophe.ts:248, Landesmittel des Knotens `katastrophenschutz`), ganzzahlig, als Halbrund 0–100. Marke „Referenz“ aus dem heute angezeigten Referenzwert (Lage.tsx:46, `marke ref`). Darunter ein Satz aus `bereitSenkung(stand)` und `bereitGegenReferenz(stand)` (sim/katastrophe.ts:857, 862): „Bei einem schweren Beben etwa 20 % weniger Tote als ohne Vorsorge“. Nur ganze Prozent; die heutige Nachkommastelle entfällt.
   - **C2:** `risikoUebersicht(w)` (sim/katastrophe.ts:925): je Zeile Ikone nach `art`, Titel, „etwa 12 % in 12 Monaten“ (`jahresChance`, ganze Prozent; unter 1 % „unter 1 %“), Saison, Kennzahl (`kennzahl`: Vorsorge im Gebiet bzw. Wassermangel, mit Ampel nach `gut`). Die Provinzliste steht nicht als Text. Hover oder Klick hebt die Provinzen aus `gebiet` auf der Karte hervor, die Zeile zeigt nur „17 Provinzen · 16,6 Mio. Einwohner“ (`bevoelkerung`, eine Nachkommastelle bei Millionen).
   - **C3:** `hebel(w)` (ui/katastrophe/daten.ts, `HEBEL_IDS`: `m_afad_ausbau`, `m_fruehwarnsystem`, `m_versicherungspflicht`, `m_gebaeudeverstaerkung`, `m_bauaufsicht`). Je Zeile:
     - Name;
     - **echter Regler** Stufe 0–100, Ausgangspunkt `stufe`, vorgeschlagenes Ziel `ziel`;
     - am Regler Preis „9 Kapital · 0,012 % des BIP im Jahr“ (`pk`, `bip`; drei Nachkommastellen nur, weil der Wert so klein ist, sonst zwei) und „volle Wirkung nach 12 Monaten“ (`monate`);
     - Umsetzungsbalken, wenn `umsetzung < 100` (`restMonate`);
     - „liegt im Parlament“, wenn `imParlament`;
     - Knopf „Beschließen“ = Weg Gesetz über `bringeEin` (wie heute „Als Gesetz einbringen“, Entscheidung W2).

     Die AFAD-Zeile klappt die Behörde `afad` auf (Achsen Personal, Technik, Reichweite je 1–5, Ausbauen/Kürzen mit Preis aus `BehoerdeDetail`, dazu der Einsatz der Übung `instrument.uebung`), siehe A4. „Im Politikfenster ansehen“ entfällt; die Maßnahme ist hier dieselbe.
   - **C4:** `szenario(w, art, provinzen, staerke, staende)` (sim/katastrophe.ts:1003). Bedienung: auf der Karte eine Zone wählen (Klick auf eine gefärbte Provinz setzt `provinzen` auf die Zone aus `ZONEN`), Regler Stärke. Ergebnis als Tabelle mit drei Spalten „heute / Referenz / mit vollem Ausbau“ und den Zeilen aus `SzenarioZeile` (Tote, Verletzte, Obdachlose, Schaden). Die Rechnung steckt im Modell; die Tabelle zeigt nur dessen Zeilen. Dazu ein Wellenring über `ereignis` (Art `beben`, `kamera: false`) als Vorschau.
   - **C5:** `dossier(w).sichten` (`FallSicht`, sim/katastrophe.ts:808–846) mit `ui/katastrophe/Faelle.tsx` und `Hilfskette.tsx`. Handlungen `soforthilfe`, `zusageFestlegen`, `starteUebergang`, `beginneWiederaufbau` mit Preis am Knopf. Die Fallprovinzen sind auf der Karte rot umrandet (`marken` mit Art `krise`).
   - **C6:** `versprechensLage(w)` und `versprechensschuldMalus(w)`.
   - **C7:** Chronik der Fälle (heute Reiter „Chronik“).

4. **Zustände:**
   - *Kein Fall* (Normalfall): C5 fehlt.
   - *Fall läuft*: C5 oben, rote Marke im Ansichtsreiter, die Karte fliegt beim ersten Öffnen zum Ort.
   - *Mehrere Fälle*: C5 als Liste, jeder Fall klappbar.
   - *Vor der Wahl*: C6 offen, wenn `versprechensschuldMalus(w).punkte > 0`.
   - *0 Kapital*: „Beschließen“ gesperrt, Regler bleibt bedienbar (zeigt Preis).
   - *Gesetz im Parlament*: Regler gesperrt, Hinweis mit Sprung zur Tagesordnung.

5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Gefahrenzeile | Hover/Klick | Provinzen des Gebiets hervorgehoben, Kamera passt Ausschnitt an | Karte |
| Provinz (Ebene Gefährdung) | Klick | Provinzkarte mit Gefährdungsteil | Karte S4 |
| Regler Vorsorge | Ziehen | Preis und Wirkung live | — |
| „Beschließen“ | Klick | `bringeEin(…,"gesetz")`; Zeile zeigt „im Parlament“ | bleibt; Parlament › Tagesordnung bekommt den Eintrag |
| AFAD ▾ | Klick | Behördenachsen | C3 |
| „Ausbauen“ / „Kürzen“ (AFAD) | Klick | `baueAus` / `kuerze` (sim/behoerden.ts) | C3 |
| „Beben simulieren“ | Klick | Leiste C4 über der Karte | Karte |
| Zone auf der Karte (in C4) | Klick | Szenario neu gerechnet | C4 |
| Stärke-Regler (C4) | Ziehen | Tabelle neu | C4 |
| Fallhandlung (C5) | Klick | wie heute (Faelle.tsx) | C5 |
| Versprechen ▾ / Chronik ▾ | Klick | aufklappen | C6/C7 |

6. **Übernommen / gelöscht:**
   - **Umgebaut:** `ui/katastrophe/Lage.tsx` (Dreispalten-Raster entfällt, daher kein Überlappen mehr; `Szenario` bleibt als Logik), `ui/katastrophe/daten.ts`, `Faelle.tsx`, `Hilfskette.tsx`, `Versprechen.tsx`; `ui/Katastrophe.tsx` (innere Reiter entfallen).
   - **Gelöscht:** innere Reiterleiste „Lage und Vorsorge / Laufende Fälle / Versprechen / Chronik“ (038), die Kennzahlpillen (doppelt zum Kopf), der Scheinbalken `kr-hebel-stufen` (Lage.tsx:120–124).
   - **Gehen hier auf:** 038 und 039 (AFAD).

7. **Simulationsbedarf:** keiner für die Ansicht. Für die Karte: hervorgehobene Provinzmenge als Prop (`AtlasMap` kann heute nur `selected` für eine Provinz; neu `hervor?: number[]`). Verwerfungslinien als Datenlücke (siehe Karte).

8. **Texte:**
   - Neu: „Bereitschaft“, „Beben simulieren“, „Beschließen“.
   - Es entfällt: „Szenario: Was wäre, wenn …“ als Überschrift, „Im Politikfenster ansehen“, der Erklärabsatz zur Bereitschaft (wird ⓘ).
   - Prozente ganzzahlig, BIP-Anteile mit so wenigen Nachkommastellen wie nötig, um nicht 0 zu zeigen.

9. **Abnahme:**
   - Höhe ohne Fälle und mit geschlossenen Klappen ≤ 1,3 × 828 px.
   - Kein Text überlappt (Prüfung im Bildschirmfoto 1440×900 und 1280×800).
   - Jeder Hebel hat einen bedienbaren Regler mit Preis.
   - Ein AFAD-Hebel, nicht zwei Orte.
   - Tests anpassen: `test/katastrophe-ansicht.test.ts`; unverändert `test/katastrophe.test.ts`, `test/katastrophe-abschluss.test.ts`.

10. **Aufwand und Abhängigkeiten:** M. Abhängig von W2 (Weg Gesetz über Maßnahme, Tagesordnung im Parlament) und vom Seitenfenster-Rahmen. Prop `hervor` in AtlasMap.

#### Forschung & Ziele › Bäume

1. **Frage und Erfolg:** „Welchen Weg schlage ich als Nächstes ein (Fokus), was forsche ich (Technik), und was verbaue ich mir?“ In 5 Sekunden: Oben stehen der laufende Fokus und die laufende Forschung mit Ring und Restzeit (oder ein leuchtendes „Fokus wählen“). Im Baum leuchten nur die jetzt wählbaren Knoten golden, lesbar ohne Zoom.

2. **Aufbau (Zonen):** Vollbild über der Karte, ohne Aktenkopf (Akteninhalt 1150 × 750 px wird hier überschrieben: 1384 × 828 px).
   - **T1 Leiste** (Breite × 88 px): drei Felder à 1/3. Fokus (Ring, Name, „noch 4 Monate“) · Forschung (laufende Technik mit Ring; bei mehreren die erste plus „+1“) · Forschungsetat (Regler).
   - **T2 Umschalter** (unter T1 links, 2 Knöpfe à 160 × 36 px): **Fokus** · **Technik**. Daneben Zoom „+ − Ganz“.
   - **T3 Baum** (Breite − 380 × Rest, etwa 1000 × 700 px).
   - **T4 Detail** (rechts 380 × 700 px), leer mit Satz „Knoten wählen“.

3. **Inhalte je Zone:**
   - **T1 Fokus:** `fokusUeberblick(w)` (sim/fokus.ts:236): `aktiv` (Name `fokusName`, `lauf`, `restTage` → ganze Monate), sonst „Kein Fokus · 7 Wege offen“ (`moeglich`) als goldener, pulsierender Knopf.
   - **T1 Forschung:** `baumSicht(w)` (sim/wissensbaum.ts:276): Knoten mit `zustand === "laeuft"`. Bei Rüstung aus der Bauleiste (A1), Restzeit immer aus `warteschlange(w).fertigIn`. Tempo „×1,0“ aus `tempo.gesamt` mit einer Nachkommastelle (Faktor, kein Index).
   - **T1 Etat:** Regler über dem Haushaltsposten `forschung` (`stufeVon(w,"forschung")`, Vorschau `postenVorschau(w,"forschung",stufe)`, Setzen `setzePosten`, sim/haushalt.ts:256, 323). Am Regler: Etat in % des BIP (`forschungsBudget(w)`), Innovationsgrenze (`forschungsSicht(w, budget).grenze`), „verpufft“ (`verpufft`) rot, wenn > 0, und Kapitalpreis aus der Vorschau. Daneben die Zahl Hochschulen (Netzknoten `hochschule`, Landesmittel, ganzzahlig) mit Sprung zur Bildungsverwaltung (`BehoerdeDetail` für `bildung`, aufgeklappt in T4). Damit entfällt der Reiter Behörden (048).
   - **T3 Fokus:** `FOKI` (data/fokusbaum.ts) in 7 Ästen nach `FOKUS_AESTE_META` (data/fokus/index.ts:23; hat `farbe` und `ikone`). Status je Knoten aus `fokusSicht(w, id)` (sim/fokus.ts:192):
     - `moeglich` golden mit Glanz;
     - `laeuft` mit Ring;
     - `fertig` voll farbig mit Haken;
     - `gesperrt` blass;
     - `ausgeschlossen` grau mit Schloss und dem Namen des Gegenwegs (`durch`).

     Knoten als runde Ikone 48 px mit Beschriftung **mindestens 12 px**. Wenn der Platz nicht reicht, steht im Zoom „Ganz“ nur die Ikone, der Name im Hover. Nie wieder 5-px-Schrift. Startausschnitt: nicht der ganze Baum, sondern die Wurzeln aller 7 Äste mit ihren ersten wählbaren Stufen (die Spalten bis „erste nicht-fertige Ebene + 1“). Verbindungen: Vorgänger als Linie, Gegenwege nur beim Darüberfahren als rote gestrichelte Bögen (heute dauerhaft gekreuzt).
   - **T3 Technik:** der vorhandene Civ-6-Baum aus `ui/wissen/BaumFenster.tsx` (Zweige als farbige Bahnen, Epochen als Zeitstrahl, Symbole aus `ui/wissen/symbole.tsx`), **eingebettet statt als Portal**. Daten: `baumSicht(w).zweige` (6 Zweige aus `ZWEIGE`). Rüstungsknoten mit Schild-Ikon. Laufend zeigen sie „Bauleiste Platz 3“ (A1).
   - **Querverbindungen:** Ist ein Fokus gewählt, der Knoten öffnet (`OEFFNET[id].wissen`), zeigt T4 „öffnet in Technik: Kampfjet KAAN, Triebwerk“ mit Sprung (Umschalter wechselt, Knoten blinkt). Umgekehrt nennt ein Technikknoten die Foki, die ihn öffnen. Gesetzesöffnungen (`OEFFNET[id].gesetze`, Kennungen `gv_*`) verweisen nach W2 auf die benannte Fassung an der Maßnahme. Die Abbildung `gv_* → Maßnahme + Fassung` kommt aus der Spezifikation Parlament.
   - **T4 Fokus-Detail:** Logik und Texte aus `ui/fokus/Fokusbaum.tsx` (Zeilen 100–230): Titel, Untertitel, Preis „12 Kapital · 4 Monate · Aufmerksamkeit“ (`pk`, `monate`, `def.aufmerksamkeit`), Bedingungen als Häkchen (`bedingungen`), Folgen (`fokusFolgen`), Reaktion der Partner und Gruppen (`fokusReaktion`), Gegenwege mit Namen, Knöpfe „Beginnen“ (`beginneFokus`) bzw. „Abbrechen“ (`brichFokusAb`).
   - **T4 Technik-Detail:** `ui/wissen/Detail.tsx`: Voraussetzungen mit `sprung`, Lizenz (`lizenzgeber`, `kaufeLizenz`), Werk und Standort (`standortSichten`), Heureka (`heureka`), Preis (`beginnPreis`), „Beginnen“ (`beginneKnoten`). Schwerpunkt des Zweigs (`setzeSchwerpunkt`, Sperre `schwerpunktSperre`) als Knopf am Zweigkopf.

4. **Zustände:**
   - *Kein Fokus*: T1-Fokusfeld pulsiert, Umschalter steht auf Fokus.
   - *Fokus läuft*: wählbare Knoten bleiben golden, aber „Beginnen“ ist gesperrt mit Grund „Fokus X läuft noch 4 Monate“ (`fokusSicht.grund`).
   - *0 Kapital*: „Beginnen“ gesperrt mit Fehlbetrag.
   - *Krieg*: Foki mit Bedingung `krieg` werden wählbar bzw. gesperrt wie im Modell; Lizenzgeber im Krieg oder mit Sanktion zeigen „gesperrt“ (`partnerGesperrt`).
   - *Abwanderung*: T1 zeigt Warnung, wenn `baumSicht(w).abwanderung`.
   - *Spielende*: alles lesbar, nichts startbar.

5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| T1 Fokusfeld | Klick | Umschalter Fokus, laufender oder erster wählbarer Knoten zentriert | T3/T4 |
| T1 Forschungsfeld | Klick | Umschalter Technik, Knoten zentriert | T3/T4 |
| Etat-Regler | Ziehen/Loslassen | Vorschau, dann `setzePosten` | bleibt; Haushalt gleicher Stand |
| Hochschulen | Klick | Bildungsverwaltung in T4 | T4 |
| Umschalter Fokus/Technik | Klick, Taste F/T | Baum wechselt | T3 |
| + / − / Ganz | Klick, Mausrad | Zoom | T3 |
| Astkopf / Zweigkopf | Klick | Ausschnitt auf Ast; am Zweig zusätzlich „Schwerpunkt setzen“ | T3/T4 |
| Knoten | Hover | Weg bis zum Knoten hervorgehoben, Gegenwege rot | — |
| Knoten | Klick | Detail | T4 |
| „Beginnen“ | Klick | `beginneFokus` / `beginneKnoten`; Ring erscheint, T1 neu | bleibt |
| „Lizenz kaufen (EU)“ | Klick | `kaufeLizenz` mit Preis und Rivalen-Folge | bleibt |
| Voraussetzung (rot) | Klick | Sprung: Knoten (im Baum), Maßnahme (Politik, Zielstufe), Bildung, Land (Außen) | Zielansicht, „Zurück“ |
| „öffnet in Technik: …“ | Klick | Umschalter, Knoten blinkt | T3 |
| Rüstungsknoten „Bauleiste Platz 3“ | Klick | Bauleiste, Zeile markiert | Land › Bauleiste |
| Esc | Taste | schließt Vollbild | Karte |

6. **Übernommen / gelöscht:**
   - **Wiederverwendet:** `ui/fokus/Fokusbaum.tsx` (Logik und Detail; Anordnung neu), `ui/wissen/BaumFenster.tsx` (eingebettet), `ui/wissen/Detail.tsx`, `ui/wissen/symbole.tsx`, `ui/behoerden/Behoerde.tsx` (`BehoerdeDetail`).
   - **Gelöscht:** `ui/wissen/Wissensbaum.tsx` als Kurzansicht (046; ihr Inhalt ist T1), die Lage-Ansicht von Forschung (043) samt `lageZeilen` Zweig `wissen` (Bereiche.tsx:221–241), Behörden-Reiter (048), Fortschritt (049), Forschungskabinett (050).
   - **Gehen hier auf:** 043, 044, 046, 048, 049, 050.

7. **Simulationsbedarf:** keiner an Regeln.
   - Reine Hilfsfunktion `geoeffnetVon(knotenId): string[]` (Umkehrung von `OEFFNET`) in sim/fokus.ts.
   - Ein Layout-Wert je Fokus-Knoten (Spalte = Tiefe der Vorgänger), analog zu `spalteVon` (sim/wissensbaum.ts:191), ebenfalls rein.
   - Die Abbildung `gv_*` → Maßnahme hängt an W2 (Spezifikation Parlament).

8. **Texte:**
   - „Bäume“ als Ansichtsname, Umschalter „Fokus“ und „Technik“ (statt „Wissensbaum“, der kein Baum war).
   - Es entfällt „Stand der Agenda“, „Lage: gemischt“, „Woher die Zahlen kommen“, „und 1 weitere“ (toter Text), „Forschungskabinett“.
   - Monate ganzzahlig, Tempo mit einer Nachkommastelle und „×“.

9. **Abnahme:**
   - Keine Knotenbeschriftung unter 12 px in irgendeiner Zoomstufe (Test über die berechnete Schriftgröße im Layout).
   - Die wählbaren Knoten sind ohne Zoom im Startausschnitt sichtbar (Test: alle `fokusSicht.status === "moeglich"` liegen im Startrahmen).
   - Restzeit eines Rüstungsknotens = Bauleiste.
   - Etat-Regler und Haushalt zeigen nach dem Setzen dieselbe Stufe.
   - Tests anpassen: `test/fokusbaum.test.ts` (Layout), `test/wissensbaum-ui.test.tsx` (eingebettet statt Portal, Kurzansicht entfällt), `test/akte-bereiche.test.tsx` (Forschung ohne Lage, Behörden, Bilanz, Personen).

10. **Aufwand und Abhängigkeiten:** L (Fokus-Layout neu, BaumFenster entportalisieren). Abhängig von A1 (Rüstungsrestzeit). Die Gesetzesverweise hängen an W2.

#### Forschung & Ziele › Vermächtnis

1. **Frage und Erfolg:** „Was will ich in dieser Amtszeit und darüber hinaus erreicht haben, wie groß ist die Chance, und was muss ich dafür jetzt tun?“ In 5 Sekunden: oben die belegten und freien Plätze (3 Ziele, 2 Programmschritte), darunter zehn Monumente mit Stufenring und Chance, darunter acht Programmzeilen mit dem nächsten Schritt in Grün oder Rot.

2. **Aufbau (Zonen):** Seitenfenster bzw. Akteninhalt 1150 × 750 px (Forschung ist keine Kartenbühne).
   - **V1 Sockel** (1150 × 96 px): 3 Zielsockel und 2 Programmplätze nebeneinander, je 200 × 80 px.
   - **V2 Monumente** (links 760 × etwa 300 px): 10 Medaillons à 140 × 140 px in zwei Reihen à 5.
   - **V3 Programme** (links 760 × 8 Zeilen à 48 px = 384 px).
   - **V4 Detail** (rechts 370 × 650 px), Inhalt nach Auswahl.
   - In der ersten Höhe: V1, V2 vollständig, V3 mindestens fünf Zeilen. Gesamthöhe ≤ 1,3 Bildschirme.

3. **Inhalte je Zone:**
   - **V1:**
     - Zielsockel aus `grosseZiele(w).verfolgt` (höchstens `GROSSE_ZIELE.maxVerfolgt`). Belegt: Bild und Name; frei: „Ziel hierher ziehen“.
     - Programmplätze aus `programmZustand(w).laufend` (höchstens `MAX_LAUFEND`). Belegt: Schrittname und Ring (`lauf`, `restTage` → Monate); frei: „Bereiter Schritt: 2“ (Zahl der Schritte mit Status `bereit`).
     - Kosten in Aufmerksamkeit als ⓘ (`AUFMERKSAMKEIT_KOSTEN.programmSchritt`, sim/aufmerksamkeit.ts:79).
   - **V2:** `ZIELE` aus sim/grosseziele.ts (10 Einträge; Bild `bild`, Bereich `bereich`). Je Medaillon:
     - Strichbild;
     - Name;
     - **Stufenring** mit 3 Segmenten (`stand.stufe` von `stufen.length`), das nächste Segment beschriftet beim Hover;
     - Chance als **ganze Zahl in der Mitte** aus `chanceVon(w, id).chance × 100` mit Spannweite als feiner Bogen (`von`, `bis`).

     Das Wort aus `wort` entfällt im Medaillon. „aussichtsreich“ bei 34–54 % war missverständlich; im Detail steht „34 bis 54 von 100“. Verfolgte Ziele haben einen goldenen Rand; gesperrte (`verfolgeGrund`) sind blass.
   - **V3:** `PROGRAMME` (sim/programme.ts:57, 8 Programme). Zeile:
     - Ikone;
     - Titel;
     - 5 Punkte für die Schritte (fertig gefüllt, laufend mit Ring, bereit golden, offen hohl, gesperrt grau) aus `schrittSicht(w, s)` je Schritt;
     - nächster Schritt mit seinem Status als Text: „Gefährdete Gebäude erfassen · bereit“ bzw. „Straßen und Brücken · fehlt: Autobahnbau Stufe 55 von 60“;
     - rechts „Starten · 3 Kapital · 2 Mon.“ (`kapital`, `tage` → Monate);
     - optional das Ziel-Abzeichen aus `dient` (A2).
   - **V4 Ziel-Detail:**
     - Leitsatz;
     - Stufenleiter mit Namen;
     - Schwellen als Häkchen (`schwelleSicht(w, stufe)`);
     - Dafür und Dagegen als grüne und rote Chips (`chanceVon.dafuer`, `.dagegen`);
     - Wege als drei Knöpfe mit Preis (`WEGE.gipfel/fonds/kampagne`: `pk`, `aufmerksamkeit`, `bip`; `geheWeg`, `wegGrund`);
     - Vertretungen der Partnerländer (`vertretungVon`, `vertretungAusbauen` mit `GROSSE_ZIELE.vertretungPk`);
     - Knöpfe „Verfolgen/Loslassen“ (`verfolge`) und „Versuch wagen“ (`versuche`, `versuchGrund`) mit Preis der Stufe (`pk`, `aufmerksamkeit`) und deutlichem Hinweis „Ausgang ungewiss“.
   - **V4 Programm-Detail:**
     - Leitbild;
     - alle Schritte als senkrechte Kette mit `ergebnis` je Schritt;
     - Bedingungen (`pruefeBedingung`) mit Sprung zur Maßnahme samt Zielstufe;
     - „Starten“ (`starteSchritt`) mit Preis;
     - Rabatt und Schutz, falls vorhanden (`rabatt`, `schutz` am Schritt).

4. **Zustände:**
   - *Nichts verfolgt, nichts läuft*: Sockel leer mit Hinweis „Bis zu 3 Ziele: Ziehen oder Verfolgen“.
   - *Alle Plätze voll*: „Verfolgen“ und „Starten“ gesperrt mit Grund (`verfolgeGrund`, `programm.fehler.maxLaufend`).
   - *0 Kapital*: Knöpfe gesperrt mit Fehlbetrag.
   - *Aufmerksamkeit erschöpft*: Grund aus `neuanfangGrund(w)`.
   - *Krieg*: Ziele, deren Faktoren daran hängen, zeigen den Faktor im Dagegen (aus `chanceVon`, nichts Eigenes).
   - *Versuch läuft ab / Sperrzeit*: Medaillon mit Uhr (`stand.sperreBis`).
   - *Erfolg/Scheitern*: Stempel im Medaillon für die Dauer einer Meldung.

5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Medaillon | Klick | Ziel-Detail | V4 |
| Medaillon | Ziehen auf Sockel | `verfolge(w, id, true)` | V1 |
| Sockel (belegt) | Klick | Ziel-Detail; „Loslassen“ dort | V4 |
| Programmzeile | Klick | Programm-Detail | V4 |
| „Starten“ (Zeile/Detail) | Klick | `starteSchritt`; Platz in V1 belegt | V1 |
| Schrittpunkt | Klick | Detail auf diesen Schritt gescrollt | V4 |
| Bedingung (rot) | Klick | Politik › Maßnahme mit Zielstufe | Politik, „Zurück“ |
| Weg-Knopf | Klick | `geheWeg`; Chance im Medaillon neu | V2/V4 |
| „Versuch wagen“ | Klick | Bestätigung mit Preis und Chance, dann `versuche` | V4, Meldung |
| Vertretung ausbauen | Klick | `vertretungAusbauen` | V4 |
| Ziel-Abzeichen am Programm | Klick | Ziel-Detail | V4 |

6. **Übernommen / gelöscht:**
   - **Umgebaut:** `ui/grosseziele/GrosseZiele.tsx` (Karten werden Medaillons, Logik der Knöpfe Zeilen 67–98 bleibt); `ui/Programme.tsx` und seine Unterteile (Karten werden Zeilen).
   - **Gelöscht:** die Erklärkästen „Pläne für Jahre“ und „Ziele über Jahre, bis zur Utopie“ (werden ⓘ), die zwei gestrichelten Kästen „PLATZ FREI“ (werden Sockel), „Alle 5 Schritte ansehen“ (die Punkte genügen), der Pfeil „→“ an „Als Ziel verfolgen“.
   - **Gehen hier auf:** 045 Große Ziele, 047 Programme; die Abschnitte „Ziele der Amtszeit“ und „Programmschritte in Arbeit“ aus 043 (Amtszeitziele → Schreibtisch).

7. **Simulationsbedarf:**
   - Feld `dient?: string[]` an `Programm` (sim/programme.ts:48), rein darstellend (A2).
   - Für die Bedingungstexte: Maßnahmenname plus „Stufe 55 von 60“ statt „Autobahn- und Brückenbau mindestens auf Stufe 60 (jetzt 55)“. Das ist ein Textbaustein in `pruefeBedingung`, keine Regel.
   - Keine Änderung an Chancen, Plätzen oder Preisen.

8. **Texte:**
   - „Vermächtnis“ als Ansichtsname.
   - „Ziel verfolgen“ ohne Pfeil.
   - Chance als „34 bis 54 von 100“ im Detail, ganze Zahl im Medaillon.
   - Es entfallen die Wortstufen „gering / möglich / aussichtsreich / gut“ als Hauptangabe (bleiben höchstens als Farbe).
   - Monate ganzzahlig.

9. **Abnahme:**
   - Höhe ≤ 1,3 Bildschirme (heute 2.264 und 2.657 px).
   - Jede Bedingung führt mit einem Klick zur Maßnahme.
   - Das Wort „Ziele“ bezeichnet in Forschung nur noch Große Ziele; die Kopfkennzahl „Ziele erreicht“ (Amtszeit) steht nicht mehr hier (Test auf den Kern von Bereich `wissen`).
   - Tests anpassen: `test/grosseziele.test.tsx`, `test/programme.test.ts` (Text der Bedingung), `test/akte-bereiche.test.tsx`.

10. **Aufwand und Abhängigkeiten:** M. Abhängig von A2 (Zuordnung `dient` durch den Projektinhaber) und von der Schreibtisch-Spezifikation (Aufnahme der Amtszeitziele).

---

## C. Fehlerliste (sofort behebbar, unabhängig vom Umbau)

| # | Fehler | Ort | Behebung |
|---|---|---|---|
| 1 | Alle vier Bildkarten-Knöpfe öffnen denselben Reiter statt des Vorhabens | `ui/akte/Bildkarten.tsx:68` (`onClick={oeffnen}`) | `oeffnen(id)` übergeben und das WunderFenster bzw. die Ortkarte des Vorhabens öffnen |
| 2 | „0 Netze überlastet“ zählt nur das Landesmittel, obwohl Provinzen bei 109–118 % liegen | `ui/infrastruktur/Netze.tsx:52` (`ton(x.mittel)`) | zählen, wenn ein Eintrag in `x.engpaesse` `≥ SCHWELLE.ueberlast` liegt; Text „3 Netze mit Überlast in Provinzen“ |
| 3 | Finanzierungsstufe 0 als graue Fußnote | `ui/infrastruktur/Netze.tsx:160` | als Zeile mit Regler auf den Posten `investitionen` (`setzePosten`), Preis am Regler |
| 4 | Kopfkennzahl „Infrastruktur“ ist in Wahrheit der Knoten `verkehrsnetz` | `ui/akte/Bereiche.tsx:133` | in „Verkehrsnetz“ umbenennen, bis der Kopf entfällt |
| 5 | Land-Abzeichen „4“ zählt laufende Bauten als Alarm | `ui/Stage.tsx:578` | nur offene Fälle und Fristen unter 60 Tagen zählen |
| 6 | Bilanzkurve „Zustimmung“ auf Land und Forschung, Achse 50–52 | `ui/akte/Bereiche.tsx` `verlaufsReihen` (nur `zustimmung` für `land`, `wissen`) und `VerlaufsDiagramm` | Reiter entfernen; bis dahin y-Achse mindestens ±10 Punkte um den Mittelwert |
| 7 | Feste, fachfremde Minister | `ui/akte/Bereiche.tsx:369–370` | Reiter entfernen; Zuordnung über `ressortVon` (A3) |
| 8 | Katastrophen: linke Spalte leer, Text überlappt und bricht im Wort | `ui/katastrophe/Lage.tsx:294–315` (Raster `kr-lage`/`kr-abschnitt`) und `katastrophe.css` | Raster einspaltig bis zum Umbau; `min-width: 0` und `overflow-wrap` in den Spalten |
| 9 | Scheinregler der Vorsorge | `ui/katastrophe/Lage.tsx:120–124` (`kr-hebel-stufen`) | durch einen echten Regler ersetzen oder als beschrifteten Balken „Stufe 40 → 60“ ohne Griff zeichnen |
| 10 | Baureihenfolge mit Rüstung in Kultur, Recht, Haushalt | `ui/Reich.tsx:553` | nur noch in Infrastruktur (später Bauleiste) rendern |
| 11 | Stempel „TRANSPARENTE AUSSCHREIBUNG“ in jeder Zeile | `ui/Reich.tsx` `Baureihenfolge` (ab Zeile 137) | nur während `vergabePhase`, als kleines Ikon |
| 12 | Restzeit der Kartenmarke anders gerechnet als in der Reihenfolge | `ui/atlas/marken.ts`, Zweig `art === "bau"` (`monate * (1 - p)`) | `vorhabenSicht(w, id).restMonate` (aus `warteschlange`) verwenden |
| 13 | Länderkürzel im Wirkungstext („GEO: Vertrauen +3“) | `sim/reich.ts:500` `effektZeile`, Effekt `land` | `akteurName(land)` |
| 14 | Satzbruch „Keine Einträge in Programmschritte in Arbeit.“ | `i18n/katalog/de/gestaltung.json:36` (`gz.lage.ruhig`) mit `akte.b.lage.programme` | Vorlage „Derzeit nichts bei: {abschnitte}.“ oder leere Abschnitte ganz weglassen |
| 15 | Kopfkennzahl „Ziele erreicht 1/3“ (Amtszeitziele) in Forschung | `ui/akte/Bereiche.tsx:139–140` | aus Bereich `wissen` entfernen, im Schreibtisch zeigen |
| 16 | Fokusbaum-Schrift etwa 5 px in „Ganzer Baum“ | `ui/fokus/Fokusbaum.tsx:361` (`passend()`) | Mindestmaßstab, bei dem Beschriftungen ≥ 12 px bleiben; darunter nur Ikonen |
| 17 | „aussichtsreich“ bei 34–54 % | `sim/grosseziele.ts:295` (`wort`) bzw. Anzeige in `GrosseZiele.tsx` | Zahlenspanne zeigen; Wort nur als Farbe |
| 18 | Pfeil an „Als Ziel verfolgen →“ suggeriert Navigation | `ui/grosseziele/GrosseZiele.tsx:98` | Pfeil streichen |
| 19 | Behördenkarte klickbar, aber nicht erkennbar | `ui/behoerden/Behoerde.tsx` (`BehoerdenListe`) | sichtbarer Knopf „Ausbauen“ mit Preis an der Karte |
| 20 | Gleichnamige, verschiedene Größen: „Straßen und Autobahnen 60“ (Zustand) gegen „Autobahnbau Stufe 55“ (Maßnahme) gegen „74 %“ (Auslastung) | Reich-Größen (`ui/reich/Groessen.tsx`), `sim/programme.ts` `pruefeBedingung`, Netze | Benennung je Art: „Zustand Straßennetz“, „Maßnahme Autobahnbau: Stufe“, „Auslastung Straßen“ |

## D. Offene Fragen (höchstens fünf)

1. **Zuordnung A3:** Bestätigt der Projektinhaber die Ressorttabelle? Insbesondere TOKİ (Umwelt und Städtebau oder Präsidium), GAP-Regionalentwicklung (Industrie und Technologie) und SSB (Präsidium statt Verteidigung). Recherche an den Präsidialdekreten Nr. 1 und Nr. 4 nötig.
2. **AFAD:** Sollen Maßnahme `m_afad_ausbau` und Behörde `afad` zu einer Mechanik verschmelzen (Regeländerung) oder in einer Zeile nebeneinander bleiben (diese Spezifikation)?
3. **Programme → Große Ziele (`dient`):** Ist die vorgeschlagene Zuordnung in A2 richtig, und soll sie nur anzeigen oder später auch die Chance heben (Regeländerung, braucht Kalibrierung)?
4. **Bau im Krieg:** Ruht Bau in Provinzen unter Beschuss oder Besatzung? Im Reich-Code ist dazu nichts zu sehen. Falls ja, braucht die Bauleiste eine Anzeige; falls nein, bleibt sie ohne.
5. **Verlauf je Provinz:** Sollen Netzauslastung und Infrastruktur je Provinz monatlich gespeichert werden (Spielstandgröße: 81 Provinzen × 9 Netze × Monate), damit die Karte einen Zeitregler bekommt? Ohne diese Daten bleibt „Entwicklung des Landes“ ersatzlos gestrichen.
