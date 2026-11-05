# Spezifikation B: Wirtschaft und Gesellschaft (neue Ansichten)

Stand 5. November 2026. Grundlage: VORLAGE_SPEZ.md, PLAN_OBERFLAECHE_2026-11-05.md (Abschnitte 2 bis 4), kritik-B.md und der Code unter /home/user/NWO/game/src. Alle Pfade unten beziehen sich auf `game/src`, sofern nicht anders angegeben.

Gilt für alle Zahlen: Jede Zahl kommt aus einer genannten Funktion oder Datei. „Spielparameter“ heißt, dass ein Wert im Code ohne Quelle steht. „Datenlücke“ heißt, dass es den Wert noch nicht gibt; dann steht dabei, wo er zu suchen ist.

---

## 0. Gemeinsame Grundlagen beider Bereiche

### 0.1 Abhängigkeit: die 17 Ministerien (gemeinsam mit der Kabinetts-Spezifikation)
Haushalt Ebene 2, der Kabinettstisch und das Ressortrad brauchen **eine** Tabelle. Vorschlag: neue Datei `data/ministerien.ts`.

```ts
export type MinisteriumId =
  | "justiz" | "familie" | "arbeit" | "umwelt" | "aeusseres" | "energie" | "jugend" | "finanzen" | "inneres"
  | "kultur" | "bildung" | "verteidigung" | "gesundheit" | "industrie" | "landwirtschaft" | "handel" | "verkehr";
export type EtatTraeger = MinisteriumId | "praesidialamt";   // Präsidialamt: kein Ministerium, aber eigener Etat (MİT, Cyber, Religionsbehörde)
export interface MinisteriumDef {
  id: MinisteriumId; name: string; amtlich: string;           // amtlich: türkischer Name, z. B. „Sağlık Bakanlığı“
  icon: IconId; familie: "soziales" | "sicherheit" | "wirtschaft" | "staat";
  posten: string[];        // Haushaltsposten aus sim/haushalt.ts POSTEN
  behoerden: BehoerdeId[]; // aus data/behoerden.ts
  massnahmen: string[];    // Maßnahmen-IDs aus data/politiknetz.ts
}
```

`PostenDef` (sim/haushalt.ts) bekommt das Feld `traeger: EtatTraeger`, das `amt` ablöst. `RESSORT_POSTEN` (data/behoerden.ts) wird aus `MINISTERIEN[].posten` abgeleitet und nicht mehr von Hand gepflegt. `Figur.amt` (sim/spiel-typen.ts:36) muss die 17 Ministerien kennen; das regelt die Kabinetts-Spezifikation. Bis dahin gilt der heutige Rückfall `ministerFuer(w, amt)` aus sim/ministerfluss-kern.ts:65, der unbesetzte Ämter an „stab“ gibt. Die Oberfläche zeigt das dann ehrlich als „kommissarisch: Präsidialamt“.

### 0.2 Zuordnung der heutigen Haushaltsposten (sim/haushalt.ts `POSTEN`, Zeilen 108–150)

| Posten (id) | Start % BIP (data/haushaltsplan.ts `RESSORTS_2026`) | Beleg | Ministerium | Bemerkung |
|---|---|---|---|---|
| `rentenniveau` | 3,0 (2.329 / 783) | abgeleitet (SGK-Zuschuss) | arbeit | Etat über `rentenSicht(w).etat` (mit `demografieFaktor`) |
| `rentenalter` | 0 | Spielparameter | arbeit | spart je Stufe 0,15 % BIP; Regler ohne eigenes Stück |
| `sozialhilfe` | 1,0 | Spielparameter | familie | |
| `gesundheit` | 1,0 | Spielparameter | gesundheit | |
| `bildung` | 3,0 | Spielparameter | bildung | Hochschulen (YÖK) sind kein Ministerium; vorerst hier mit ⓘ |
| `forschung` | 0,4 | Spielparameter | industrie | TÜBİTAK hängt am Industrieministerium (zu prüfen) |
| `verteidigung` | 1,9 | Spielparameter | verteidigung | |
| `innere_sicherheit` | 1,0 | Spielparameter | inneres | trägt heute über `RESSORT_POSTEN.praesidialamt` auch MİT und Cyberabwehr (siehe Fehler F6) |
| `investitionen` | 1,7 (1.312 / 783) | abgeleitet: **alle** Kapitalausgaben | verkehr | ökonomische Art, keine Aufgabe; ⓘ „enthält Investitionen aller Ressorts, Aufteilung folgt mit der Quelle“ |
| `wohnen` | 0,3 | Spielparameter | umwelt | TOKİ steht außerhalb des Zentralhaushalts (zu prüfen) |
| `landwirtschaft` | 0,5 | Spielparameter | landwirtschaft | |
| `umwelt_energie` | 0,3 | Spielparameter | **wird geteilt:** `umwelt` → umwelt, `energie` → energie | neue Posten, siehe 0.3 |
| `kultur` | 0,2 | Spielparameter | kultur | |
| `justiz` | 0,35 | Spielparameter | justiz | |
| `diplomatie` | 0,15 | Spielparameter | aeusseres | |
| `personal` | 7,0 (5.507 / 783) | abgeleitet: **alle** Personalausgaben | finanzen (nur als Regler „Besoldung“) | eigenes Stück „Öffentlicher Dienst“, siehe 2.2 |
| `subventionen` | 0,8 | Spielparameter | energie (vorläufig) | stärkste Dauerwirkung `energiepreise −2`; siehe offene Frage 2 |
| `einkommensteuer`, `verbrauchsteuern`, `unternehmensteuer` | Einnahmen | | finanzen (Innenring) | |
| Zinsen | `zinsausgabenJetzt(w)` (sim/wirtschaft.ts) | | finanzen, **gesperrt** | |
| — | — | — | jugend, handel | **kein Posten im Spiel (Datenlücke)** |
| — | — | — | praesidialamt | kein eigener Posten; MİT und Cyber hängen heute an `innere_sicherheit` |

### 0.3 Neue Posten und Daten
1. **`umwelt` und `energie` statt `umwelt_energie`.** Je 0,15 % BIP Start, Schritt 0,05, Spanne wie heute (−3 bis 8), Reifezeit 24 Monate. Das alles ist Spielparameter, sichtbar gekennzeichnet. Die Dauerwirkungen werden aufgeteilt:
   - `umwelt`: `klimaschutz 0,6`, `luftqualitaet 0,4`
   - `energie`: `erneuerbare 0,6`, `stromversorgung 0,2`
   - Sofortwirkung wie heute auf `umwelt` (`junge`, `staedtische_saekulare`); `energie` hat keine Sofortwirkung.
   - Spielstand: `migriereHaushalt` (sim/wirtschaft.ts) übernimmt `stufen.umwelt_energie` für beide neuen Posten. `POSTEN_ALIAS.umwelt_energie` zeigt auf `umwelt`, und `energie` bekommt dieselbe Stufe.
   - Die Kataloge für die Texte unter `haushalt.posten.<id>.*` sind neu anzulegen.
2. **`jugend` und `handel`:** Ohne Quelle für den Startanteil **kein neuer Regler**. Beide Ministerien erscheinen unter dem Rad als graue Chips „noch kein eigener Etat im Spiel“. Ihre Maßnahmen (Liste 0.4) stehen auf Ebene 2 trotzdem.
3. **`praesidialamt`:** vorerst kein Regler, also ebenfalls Chip. MİT und Cyberabwehr bleiben über `innere_sicherheit` bezahlt, bis ein eigener Etat belegt ist.
4. **Kosten je Maßnahme:** `policyCost` (sim/netz.ts:487) summiert über alle Maßnahmen. Neu ist `massnahmeMehrkosten(model, s, id)`, die dieselbe Rechnung für einen Knoten zurückgibt: `(nationalAverage − startAverage) / 100 × node.cost` in % BIP. `policyCost` wird daraus summiert, damit die Spielregel gleich bleibt.

### 0.4 Zuordnung der kostenwirksamen Maßnahmen (data/politiknetz.ts) zu den Ministerien
Grundsatz: Das Thema bestimmt das Ministerium. Ausnahmen sind einzeln genannt. „(prüfen)“ heißt, dass die Zuordnung zur Behörde vor der Umsetzung zu belegen ist.

- **arbeit:** m_renten, m_fruehrente, m_arbeitslosengeld, m_gewerkschaftsrechte, m_ausbildung (İŞKUR, prüfen), m_fachkraefteprogramm, m_mindestlohn
- **familie:** m_sozialhilfe, m_kindergeld, m_kinderbetreuung, m_gewaltschutz
- **gesundheit:** m_krankenhausbau, m_aerztegehalt, m_hausarzt, m_zuzahlungen, m_medizintechnik
- **bildung:** m_lehrergehaelter, m_schulbau, m_religioese_schulen, m_berufsschulen, m_unigruendungen, m_wissenschaftsfreiheit, m_bildungstechnik
- **jugend:** m_stipendien (KYK, prüfen)
- **industrie:** m_investitionsanreize, m_kmu, m_industrie_modernisierung, m_forschung, m_regionalfoerderung (Entwicklungsagenturen, prüfen)
- **handel:** m_exportfoerderung, m_zoelle, m_preiskontrollen, m_handelssysteme
- **energie:** alle 16 Maßnahmen des Themas „energie“ außer m_umweltauflagen
- **umwelt:** m_umweltauflagen und das ganze Thema „wohnen“ (m_sozialwohnungen, m_mietdeckel, m_stadterneuerung, m_bauaufsicht, m_baukredite, m_bauamnestie, m_gebaeudeverstaerkung, m_versicherungspflicht, m_bauindustrie)
- **verkehr:** m_autobahnen, m_oepp_garantien, m_bahn, m_nahverkehr, m_breitband, m_smart_infrastruktur, m_instandhaltung, m_internetsperren (BTK, prüfen)
- **landwirtschaft:** das ganze Thema „landwirtschaft“ (DSİ bei m_staudaemme, prüfen)
- **kultur:** m_tourismuswerbung, m_denkmalschutz, m_kulturfoerderung, m_archaeologie
- **justiz:** das ganze Thema „recht“ außer m_notstand, dazu m_minderheitenrechte (prüfen)
- **inneres:** m_polizei, m_polizeitechnik, m_fruehwarnsystem, m_afad_ausbau, m_grenzschutz, m_rueckkehr, m_integration, m_versammlungsfreiheit
- **verteidigung:** m_verteidigung, m_wehrdienst, m_uebungen, m_offiziersauswahl
- **aeusseres:** m_eu_annaeherung
- **finanzen:** das ganze Thema „haushalt“, dazu m_kreditgarantien und m_bankenaufsicht (BDDK unabhängig, prüfen)
- **praesidialamt:** m_notstand, m_friedensprozess, m_ruestungsindustrie (SSB, prüfen), m_religionsbehoerde, m_staatsmedien, m_medienaufsicht (RTÜK, prüfen), m_digitale_oeffentlichkeit

**Behörden** (data/behoerden.ts):
- inneres: polizei, grenzschutz, afad
- justiz: justiz
- finanzen: steuer, statistik (TÜİK, prüfen)
- gesundheit: gesundheit
- bildung: bildung
- aeusseres: diplomatie
- praesidialamt: mit, cyber

### 0.5 Regeln, die beide Bereiche betreffen
- **Zustimmung:** Überall erscheint derselbe Wert, `angezeigteZustimmung(w).wert` (sim/medien.ts:863), benannt mit dem Institut („Ekran 54 %“). Den wahren Wert `spiel.umfrage.zustimmung` zeigt die Oberfläche nur, wenn `quelle === "rohdaten"`, und dann mit dem Etikett „Rohdaten“. Betroffen: Leiste (ui/Stage.tsx:429), Aktenkopf Gesellschaft (ui/akte/Bereiche.tsx:86) und Krisenrat (`sozialeKrisenlage`). Siehe Fehler F2.
- **Veröffentlicht statt wahr:** Kennzahlen mit Veröffentlichungsdatum (Inflation, Wachstum) zeigen immer `aktuellerWert(w, id)` aus sim/wirtschaft-kennzahlen.ts, nie `w.economy.*`.
- **Zahlenformat:** Indizes 0–100 als ganze Zahl. Prozent mit einer Nachkommastelle. Lira mit einer Nachkommastelle. Beträge in „Bio. ₺“ mit einer Nachkommastelle, unter 1 Bio. in „Mrd. ₺“ ganzzahlig. Datum mit `formatDateDe`, nie ISO.
- **Preisschild** an jedem Knopf, der etwas kostet, als einheitlicher Baustein `<Preis kapital aufmerksamkeit bip legitimitaet loyalitaet />`. Neu in ui/akte/Bausteine.tsx, ersetzt die verstreuten Regeltexte.
- **Bilder:** Tacho, Rad und Kreisfeld werden als eigene Bausteine in ui/akte/Bildkarten.tsx gebaut (diese Datei gibt es schon), damit Kabinett und Politik sie wiederverwenden.
- **Farben** prüft der Palettenprüfer wie beim heutigen Rad (Kommentar in ui/wirtschaft/HaushaltsRad.tsx, Zeile 4).

---

## Wirtschaft (sieben Reiter werden vier Ansichten: Lage · Haushalt · Geld & Lira · Handel)

**Aktenkopf Wirtschaft:** Die drei Kopfzahlen dürfen nicht in der Leiste stehen. Statt Inflation, Wachstum und Lira (ui/wirtschaft/Akte.tsx:56–58) kommen Arbeitslosigkeit (`aktuellerWert(w,"arbeitslosigkeit")`), Wachstum veröffentlicht (`aktuellerWert(w,"wachstum")`) und Netto-Reserven (`w.economy.reservenNettoUsdMrd`). Die Reiter stehen in einer Zeile. Es gibt keine rechte Reitergruppe mehr; „Bilanz & Entwicklung“ und „Wirtschaftskabinett“ entfallen.

#### Wirtschaft › Lage
1. **Frage und Erfolg:** „Was brennt in der Wirtschaft, und was kann ich tun?“ In 5 Sekunden sieht man, welche der sechs Größen rot ist, ohne zu scrollen und ohne Text zu lesen.
2. **Aufbau (Zonen), Akteninhalt 1150 × 750:**
   - Z1, Tachoband (1150 × 300, zwei Reihen à drei Kacheln von je ~370 × 140): ganz in der ersten Bildschirmhöhe.
   - Z2, Alltagszeile (1150 × 60): drei kleine Balken.
   - Z3, Detail (1150 × ~380, öffnet beim Klick auf eine Kachel und schiebt sich unter Z1, ohne die Seite neu aufzubauen): links die Kurve (700 px), rechts Ursachen und Handlungen (430 px).
   - Z4, zugeklappte Reiter: „Alle Kennzahlen“ · „Weltvergleich“.
3. **Inhalte je Zone:**
   - Z1, Tachos als Halbkreis 180° mit Zeiger, großer Zahl, Pfeil und „seit Amtsantritt“ (`startWert(w,id)`) in Grün oder Rot nach `bewertung(k, jetzt, start)` (sim/wirtschaft-kennzahlen.ts:493). Darunter eine 12-Monats-Linie mit fester Achse.

     | Tacho | Wert | Bänder (Quelle) |
     |---|---|---|
     | Inflation | `aktuellerWert(w,"inflation")` | grün < 10, gelb < 25, rot ≥ 25 (heutige Schwellen in ui/wirtschaft/Akte.tsx:56); Zielmarke `w.economy.inflationTarget` |
     | Arbeitslosigkeit | `aktuellerWert(w,"arbeitslosigkeit")` | keine Schwelle im Code. Neu als Spielparameter: grün ≤ Startwert, gelb bis +1 Punkt, rot darüber; gekennzeichnet |
     | Wachstum | `aktuellerWert(w,"wachstum")` (veröffentlicht) | grün ≥ 3, gelb ≥ 0, rot < 0 (Akte.tsx:57); Marke Potenzialwachstum `potential(w.economy)` |
     | Lira je Dollar | `aktuellerWert(w,"usd")` | keine Schwelle. Zeiger zeigt die reale Abwertung über 12 Monate: `fxChange12 − (inflation − PARAMS.foreignInflation)` (wie der Treiber in wirtschaft-kennzahlen.ts:131); grün ≤ 0, gelb ≤ 10, rot darüber (neuer Spielparameter) |
     | Defizit | `aktuellerWert(w,"defizit")` | Zielmarke 3,1 % BIP (Mittelfristprogramm 2027–2029, Kommentar zu `PLAN_2026.defizitProzentBip` in data/haushaltsplan.ts); bei IWF-Programm `iwfAuflagen(w).defizitMax` (sim/devisen.ts:366) |
     | Netto-Reserven | `w.economy.reservenNettoUsdMrd` | rot < `DEVISEN.kriseAn` (10), gelb < `DEVISEN.druckAn` (25) (sim/devisen.ts:65–69). Heute steht der Wert bei 23,9, also **gelb** (Zuschlag läuft). Die heutige Seite verschweigt das |

   - Z2, Alltag: `krisenAlltag(w)` (sim/krisengesetze.ts:17) für Lebenshaltung, Realeinkommen und Armut, als ganzzahlige Indizes mit Lesehilfe ⓘ „0–100, 50 = Stand 2026“ und Trendpfeil. Ersetzt den Kasten „Preise, Einkommen & Arbeit“ des Krisenrats.
   - Z3, Detail:
     - Kurve: `Diagramm` (ui/wirtschaft/Diagramm.tsx) mit `verlauf(w,id)`, `berechneReihen` (ui/wirtschaft/prognose.ts) und `alleMarken(w)`. Die Marken sind anklickbar.
     - Ursachen: `kennzahl(id).treiber(w).zeilen`, die drei mit dem größten Betrag, als waagrechte Balken.
     - Handlungen: `kennzahl(id).handlungen`, höchstens drei. Jede ist ein Knopf mit Preisschild. Der Preis kommt bei Haushaltsposten aus `postenVorschau(w, posten, stufe)` (`kapital`, `defizitNachher`), bei der Zinssitzung aus `druckOptionen(w)`. Der Knopf zeigt die Wirkung als gestrichelte Prognose auf derselben Kurve (heutiges `vorschau` in ui/wirtschaft/Lage.tsx:206).
   - Z4, „Alle Kennzahlen“: die heutige Liste der `KENNZAHLEN` als Tabelle (Name, Wert, Einheit, Pfeil, kein Sparkline-Wald). „Weltvergleich“: eine Zeile je Größe aus `VergleichBalken` und `ZUORDNUNG`/`spielWert` (ui/vergleich), mit Rang und Weltwert, ohne Balkenliste.
   - Wirkungsberichte: als Marken in der Kurve. Datenquelle ist `berichteFuer(w, themen)` (genutzt in ui/akte/Bereiche.tsx `VerlaufAnsicht`); ein Klick zeigt den Bericht in einer Sprechblase.
4. **Zustände:**
   - Ohne Verlauf (erster Monat): Tachos ohne Linie, „seit Amtsantritt“ entfällt.
   - Krise (ein Tacho rot): Diese Kachel ist beim Öffnen vorgewählt, Z3 ist offen.
   - IWF-Programm aktiv: Die Defizitmarke wird zur Auflage, ein Siegel „IWF“ steht an der Kachel.
   - 0 Kapital: Handlungsknöpfe deaktiviert mit Grund aus `kannZahlen` (sim/kapital.ts).
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Tacho | Klick | öffnet Z3 für diese Größe | Lage, Z3 |
   | Tacho | Hover | Tooltip: Wert, Band, Quelle der Messung (`kennzahl.gemessen`) | – |
   | Kurvenmarke | Klick | Sprechblase Bericht oder Ereignis | – |
   | Handlung Haushalt | Klick | Haushalt Ebene 2 des zuständigen Ministeriums, Zeile vorgewählt | Haushalt › Ministerium |
   | Handlung Zentralbank | Klick | Geld & Lira, Zone Sitzung | Geld & Lira |
   | Handlung Vorschau | Hover | gestrichelte Prognose in der Kurve | – |
   | „Alle Kennzahlen“ | Klick | klappt Tabelle auf; Zeile → Z3 | Lage |
   | Alltagsbalken | Klick | Z3 mit Kurve dieser Größe (über `netzKennzahl`) | Lage |
6. **Übernommen / gelöscht:**
   - Umgebaut wird ui/wirtschaft/Lage.tsx: Die Liste wird zum Reiter „Alle Kennzahlen“, das Detail bleibt erhalten.
   - Übernommen: ui/wirtschaft/Diagramm.tsx, prognose.ts, ui/VergleichBalken.tsx.
   - Gelöscht wird ui/wirtschaft/Akte.tsx der Reiter „verlauf“ (026.png) und „personen“ (027.png).
   - Hier gehen auf: Wirtschaftslage (021), Bilanz & Entwicklung (026) und der Alltagskasten aus dem Krisenrat (022b).
7. **Simulationsbedarf:** keiner außer dem neuen Spielparameter für die Bänder von Arbeitslosigkeit und Lira, als `WIRTSCHAFT_BAENDER` in sim/wirtschaft-kennzahlen.ts, gekennzeichnet.
8. **Texte:**
   - Die Verweise „(Z1)“ bis „(Z5)“ fallen aus allen Texten von i18n/katalog/de/kennzahlen.json (10 Stellen).
   - „Index“-Werte bekommen die Lesehilfe „0–100, 50 = Stand 2026“.
   - Aus „Gefühlte Teuerung“ und „Lebenshaltungskosten“ wird ein Begriff, „Lebenshaltung“.
9. **Abnahme:**
   - Erste Bildschirmhöhe zeigt sechs Tachos und die Alltagszeile.
   - Gesamthöhe ohne aufgeklappte Reiter ≤ 1,3 × 750 px.
   - Kein Wert steht zweimal (Kopf ≠ Tachos ≠ Leiste).
   - Wachstum im Kopf = Wachstum im Tacho.
   - Keine Zeichenkette „(Z“ im Katalog.
   - Tests: test/akte-lage.test.tsx und test/wirtschaft.test.ts anpassen; neuer test/wirtschaft-tachos.test.tsx (Bänder je Tacho, Reserven 23,9 ergibt gelb).
10. **Aufwand:** M. Vorbedingung: der Baustein Tacho; Haushalt Ebene 2 für die Sprungziele.

#### Wirtschaft › Haushalt
Drei Ebenen in **einer** Ansicht. Die Ebenen wechseln durch Hineinzoomen (Animation 300 ms), nicht durch neue Reiter.

**Ebene 1, Gesamtrad**
1. **Frage und Erfolg:** „Wohin geht das Geld, woher kommt es, wie groß ist die Lücke?“ In 5 Sekunden zeigt das Rad das größte Ressort, den Kreditanteil (schraffiert) und das Defizit in der Mitte.
2. **Aufbau:**
   - Z1, Kopf (1150 × 60): Defizit, Fensterstatus, Finanzminister.
   - Z2, Rad links (520 × 520).
   - Z3, rechte Tafel (600 × 520): Auswahl und Fertige Pakete.
   - Z4, Fußzeile (1150 × 120): Schulden, Zinsen, Mehrheit des Haushaltsgesetzes, Chips der Ministerien ohne Etat.
   - Z5, zugeklappte Reiter: Alle Posten · Verfahren · Bisher · Rechnung.
   - In der ersten Bildschirmhöhe: Z1 bis Z3.
3. **Inhalte je Zone:**
   - Z1:
     - „Defizit 2,9 % des BIP“ aus `defizitJetzt(w)` (sim/wirtschaft.ts).
     - Fenster aus `haushaltsfenster(w)` (sim/haushalt.ts): „Haushaltsfenster offen bis …“ oder „Nächstes Fenster Oktober 2030 · in 8 Monaten · Änderungen jetzt als Nachtrag: Kapital ×2“. Der Faktor kommt aus `HAUSHALT_ZYKLUS.nachtragFaktor`.
     - Porträt Finanzminister `ministerFuer(w,"finanzen")` mit Ring = Loyalität. Liegt das Defizit über der Zielmarke 3,1 %, sagt er einen Satz (neuer Katalogtext).
   - Z2, Rad:
     - Außenring: ein Stück je Etatträger mit Etat > 0. Betrag = Summe von `etatBip(p, stufeVon(w,p.id))` über `MINISTERIEN[id].posten` (Arbeit: `rentenSicht(w).etat`) × `staatsfinanzen(w).bip / 100`.
     - Dazu „Zinsen“ (`zinsausgabenJetzt(w)`), grau, mit Schloss.
     - Dazu „Öffentlicher Dienst und Übriges (nicht zugeordnet)“ als Rest, grau schraffiert, siehe 2.2.
     - Farbe nach `familie` in vier Farbtönen, in Hellstufen gestaffelt; Ikone und Name auf dem Ring ab 4 % Anteil, darunter nur Ikone.
     - Innenring: die heutigen Einnahmestücke aus `radStuecke` (ui/wirtschaft/HaushaltsRad.tsx), mit fünf deutlich unterscheidbaren Tönen statt fünf Brauntönen, dazu „Neue Schulden“ schraffiert (`staatsfinanzen(w).kreditMrd`).
     - Mitte: Defizit, beim Hover das Stück.
     - Die Summe des Außenrings ist **genau** `staatsfinanzen(w).ausgabenMrd`.
   - Z3, Tafel:
     - Ohne Auswahl: „Fertige Pakete“, sieben Knöpfe: `PAKETE` (sim/haushalt.ts:380: konsolidieren, investieren, zukunft, aufruestung) und `KRISENPAKETE` (sim/krisenpaket.ts:18: entlastung, umschichten, dienste).
     - Jeder Paketknopf trägt ein Preisschild: Kapital aus `krisenPaketPlan(w,id).pk` bzw. Summe `postenVorschau`, Saldo in % BIP und Mehrheit `prognose`.
     - Hover über ein Paket färbt das Rad als Vorschau um (wachsende Stücke kräftig, schrumpfende blass). Klick übernimmt es: im Fenster `paketInEntwurf`, außerhalb `bringeKrisenPaketEin` (nur Krisenpakete; die vier Finanzpakete sind außerhalb des Fensters gesperrt, mit Grund).
     - Mit Auswahl (Hover oder Klick auf ein Stück): Name, Betrag in Bio. ₺, Anteil am Haushalt, % BIP, Minister, Veränderung seit 2026 in Stufen und Lira, Knopf „Öffnen“.
   - Z4:
     - „Schulden 23,0 % · Zinsen 3,1 % des BIP“ (heutiges `hd-kern`).
     - Mehrheit als kleines Halbrund mit 301-Linie aus `haushaltsEntwurfsSicht(w)` oder `haushaltsGesetzSicht(w)`, Knopf „Haushaltsgesetz einbringen“ (heutige Komponente ui/wirtschaft/HaushaltsMehrheit.tsx).
     - Chips für Etatträger ohne Posten: Jugend und Sport, Handel, Präsidialamt („noch kein eigener Etat im Spiel“).
   - Z5:
     - „Alle Posten“: die heutige Reglerliste (ui/wirtschaft/Haushalt.tsx `seite()`), nach Ministerium statt nach Gruppe geordnet.
     - „Verfahren“: heutige `_zyklus` und `_plan`.
     - „Bisher“: `_bisher` und `_abschluss`.
     - „Rechnung“: ui/wirtschaft/Staatsfinanzen.tsx.

**Ebene 2, Ministeriumsrad** (Klick auf ein Stück)
1. **Frage und Erfolg:** „Wofür gibt dieses Ministerium sein Geld aus, wo kann ich kürzen, und wer schreit dann?“ In 5 Sekunden sieht man das größte Stück, den Wunsch des Ministers und den Preis einer Kürzung am ersten Regler.
2. **Aufbau:**
   - Z1, Kopf (1150 × 90): zurück, Name, Minister, Etat.
   - Z2, Rad links (380 × 380).
   - Z3, rechts (720 × 520): Zeilen mit Regler.
   - Z4, unter dem Rad (380 × 140): „Wen es trifft“, betroffene Wählergruppen als kleine Kreise.
   - Alles in der ersten Bildschirmhöhe; bei mehr als sechs Zeilen scrollt nur Z3.
3. **Inhalte je Zone:**
   - Z1: „← Gesamthaushalt“, Ikone, Name (z. B. „Gesundheit · Sağlık Bakanlığı“).
   - Z1, Minister: Porträt der Figur des Ministeriums. Bis Kabinett-17 umgesetzt ist, `ministerFuer(w, amt)` mit Hinweis „kommissarisch“, wenn `f.amt !== amt`. Ring = Loyalität, Satz = Wunsch: `ministerWunsch(w, posten)` (sim/haushalt.ts:313), dargestellt als „will +2 Stufen = +x % BIP = +y Mrd. ₺“ über `schritt` und `mrdJeStufe(p, w)` (Beispiel Bildung: 2 × 0,2 = 0,4 % BIP).
   - Z1, Etat: Bio. ₺ · % BIP · % des Haushalts.
   - Z2, Stücke in drei Arten:
     - (a) **Grundetat je Haushaltsposten** des Ministeriums: `etatBip × bip`.
     - (b) **Programme**: die Maßnahmen des Ministeriums mit Mehrkosten > 0 gegenüber 2026, aus `massnahmeMehrkosten` (0.3 Punkt 4).
     - (c) **Behörden**: dünner Innenring im Stück des bezahlenden Postens, Anteil = `behoerdenVerbrauch(w)` (`ausEtat`) des Jahres plus laufender Mehrunterhalt `behoerdeSicht(w,id).unterhalt`.
     - Programme mit negativen Mehrkosten (Einsparung) stehen als Liste neben dem Rad, nicht im Rad.
     - Unter dem Rad als ⓘ: „Aufteilung nach Haushaltsposten und Maßnahmen. Die Unterteilung nach Ausgabenart (Personal, Betrieb, Investitionen, Übertragungen) folgt mit dem Haushaltsgesetz 2026 nach Einrichtungen.“ Steht bei einem Posten `beleg === SPIEL`, erscheint ein Siegel „Startanteil geschätzt“.
   - Z3, Zeilen je Stück:
     - Haushaltsposten: Name, Betrag (Mrd. ₺ und % BIP, vorher → nachher), Regler −/+ (heutige Zeile aus Haushalt.tsx).
     - Preisschild am Regler aus `postenVorschau(w,id,stufe)`: `kapital`, im Nachtrag `zyklus.faktor` und Legitimität `HAUSHALT_ZYKLUS.nachtragLegitimitaet`, Loyalität ±1 des Ministers (Regel in `wende`, sim/haushalt.ts:300).
     - Wirkung: `vorschau.zeilen` mit Reifezeit `reifeMonate`, Gewinner und Verlierer aus dem Katalog `haushalt.posten.<id>.gewinner/verlierer/kehrseite`.
     - Maßnahme: die Zeile der Maßnahmentafel (ui/politik/MassnahmenTafel.tsx `MassnahmenTafel` mit `massnahmen` gefiltert auf das Ministerium), damit der Weg zum Gesetz derselbe bleibt (Entscheidung 2). Keine zweite Reglerlogik.
     - Behörde: Name, Leitung, drei Achsen als Punkte, Knopf „Öffnen“ (Ebene 3).
   - Z4: Gruppen aus `p.sofort` (Stimmung sofort) der gewählten Zeile als kleine Kreise in den Farben des Kreisfelds (G1). Beim Verschieben des Reglers blinken sie rot oder grün auf.
   - Wirkung auf die Gesamtlage: Unten rechts steht immer „Defizit vorher → nachher“ (`defizitVorher`, `defizitNachher`).

**Ebene 3, Behörde** (Klick auf eine Behörde)
- Die vorhandene Behördenkarte (ui/behoerden/Behoerde.tsx `BehoerdenListe` und die Detailtafel; beim MİT zusätzlich `MitZusatz` aus ui/behoerden/Mit.tsx) erscheint als Tafel rechts. Das Ministeriumsrad bleibt links sichtbar und zeigt das Behördenstück hervorgehoben.
- Ausbau und Kürzung nutzen `vorschau`, `baueAus`, `kuerzVorschau` und `kuerze` (sim/behoerden.ts).
- „Etat ohne Spielraum“ wird zur Zeile „Spielraum 0 % BIP. Ressortetat +1 Stufe gibt X % BIP Spielraum“. X = `schritt × AUSBAU.etatSpielraum`. Dazu ein direkter +1-Knopf am Posten mit Preis.

**Für alle drei Ebenen**

4. **Zustände:**
   - Fenster offen: Regler stellen den Entwurf (`setzeEntwurf`); das Preisschild sagt „kostenlos, wirkt mit dem Haushaltsgesetz“.
   - Fenster zu: Nachtrag (`setzePosten`); das Preisschild zeigt Kapital ×2 und Legitimität.
   - Gesetz im Parlament: Regler gesperrt mit Grund `haushalt.fehler.im_parlament`.
   - 0 Kapital: Regler zur unbeliebten Seite gesperrt (`kannZahlen`), die beliebte Seite bleibt offen, sofern bezahlbar.
   - Krieg: Verteidigung oben in der Paketliste; das Paket „aufruestung“ ist hervorgehoben.
   - IWF aktiv: Defizitgrenze als roter Strich im Mittelfeld.
   - Rest negativ (Konsistenzfehler): ⓘ-Warnung, siehe 2.2.
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Stück Außenring | Hover | Tafel Z3 zeigt Ressort | Ebene 1 |
   | Stück Außenring | Klick | Zoom in das Ministeriumsrad | Ebene 2 |
   | Zinsen | Klick | Tooltip „nicht kürzbar: Schuld × Zins“, Verweis Geld & Lira | Ebene 1 |
   | Öffentlicher Dienst | Klick | Ebene 2 Finanzen, Zeile „Besoldung“ vorgewählt | Ebene 2 |
   | Innenring Steuer | Klick | Ebene 2 „Einnahmen“: Rad aus `STEUERN_2026` (zehn Steuerarten), drei Steuerregler | Ebene 2 |
   | Schraffur Schulden | Klick | Tooltip und Verweis auf Lage, Tacho Defizit | Lage |
   | Paketknopf | Hover | Vorschau im Rad | Ebene 1 |
   | Paketknopf | Klick | Entwurf oder Einbringen, Rückmeldung | Ebene 1 |
   | Chip ohne Etat | Klick | Ebene 2 dieses Ministeriums, nur Maßnahmen | Ebene 2 |
   | „← Gesamthaushalt“ / Esc | Klick oder Taste | Zoom zurück | Ebene 1 |
   | Regler −/+ | Klick | Vorschau, danach Bestätigung (ui/wirtschaft/Bestaetigung.tsx) | Ebene 2 |
   | Ministerporträt | Klick | Ministerakte am Kabinettstisch | Kabinett |
   | Behördenzeile | Klick | Behördenkarte | Ebene 3 |
   | Maßnahmenzeile | Klick | Zeile klappt auf (Maßnahmentafel), „Als Gesetz einbringen“ | Ebene 2 |
   | Gruppenkreis Z4 | Klick | Seitenleiste dieser Gruppe | Gesellschaft › Das Volk |
   | „Haushaltsgesetz einbringen“ | Klick | heutiger Ablauf HaushaltsMehrheit | Ebene 1 |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/wirtschaft/HaushaltsRad.tsx (Ministerien, Rest, Zoom), ui/wirtschaft/Haushalt.tsx (Zeile wird Baustein, Liste wird Reiter „Alle Posten“).
   - Übernommen: HaushaltsMehrheit.tsx, HaushaltsBericht.tsx, Staatsfinanzen.tsx, Bestaetigung.tsx, ui/behoerden/*.
   - Ui/wirtschaft/Krisenrat.tsx entfällt: Pakete nach Z3, Alltag nach Lage. ui/wirtschaft/KrisenGesetze.tsx entfällt: Die drei Krisengesetze `KRISENGESETZE` (m_mindestlohn, m_arbeitslosengeld, m_ausbildung) werden benannte Fassungen dieser Maßnahmen in der Politik (Entscheidung 2).
   - Behördenreiter: Der Reiter „behoerden“ in ui/akte/Bereiche.tsx (Zeilen 439–449) entfällt für alle Akten.
   - Hier gehen auf: Haushalt (023), Krisenrat (022), Behörden (031) und die Behördenreiter der anderen Bereiche.
7. **Simulationsbedarf:**
   - `data/ministerien.ts` und `PostenDef.traeger` (0.1).
   - Posten `umwelt`/`energie` mit Migration (0.3).
   - `massnahmeMehrkosten` (0.3).
   - Neu `sim/ministerien.ts` mit `ministeriumSicht(w, id)`: `{ etatMrd, etatBip, anteil, minister, wunsch, posten: PostenVorschau[], programme: {id, mehrkostenBip}[], behoerden: BehoerdeSicht[] }`, gemeinsam genutzt vom Kabinettstisch.
   - `ministerWunsch` und `wende` lesen den Minister über `traeger` statt `amt`. Die Spielregel ±1 Loyalität bleibt gleich.
   - Behörden-Rückfallposten korrigieren (Fehler F6).
   - Keine neue Kostenregel.
8. **Texte:**
   - „Staat und Preise“ entfällt.
   - „Personal“ heißt „Besoldung im öffentlichen Dienst (alle Ressorts)“.
   - „Ministerium will +2“ heißt „{Name} will +2 Stufen (+0,4 % BIP)“.
   - „Ein Klick führt zu den Reglern“ heißt „Klicken Sie ein Ressort an, um seinen Etat zu öffnen“.
   - Die Preisregel als Absatz unter dem Rad entfällt (steht im Preisschild).
   - Stufen immer mit Lira-Gegenwert.
9. **Abnahme:**
   - Summe Außenring = `ausgabenMrd` (±0,1 %).
   - Die Prozente beider Ringe ergeben je 100.
   - Kein Posten in zwei Stücken.
   - Ebene 1 bis 3 ohne Seitenscroll in 1440 × 900.
   - Jeder Regler hat ein Preisschild.
   - Keine zwei Posten mit identischem Betrag ohne Siegel „geschätzt“.
   - Zoom zurück mit Esc.
   - Tests:
     - neu test/haushaltsrad.test.ts (Summen, Personal nur im Reststück)
     - neu test/ministerien.test.ts (jeder Ausgabeposten genau einem Träger, jede kostenwirksame Maßnahme genau einem Träger, jede Behörde genau einem Träger)
     - anpassen: test/haushalt-ressorts.test.ts, test/haushaltszyklus.test.ts, test/krisenpaket.test.tsx, test/krisengesetze.test.tsx (Ziel wandert), test/behoerden.test.ts (Rückfallposten), test/staatsfinanzen.test.tsx
10. **Aufwand:**
    - L insgesamt.
    - Der Personal-Fix (2.2) ist S und sofort machbar.
    - Ebene 2 setzt `data/ministerien.ts` voraus (Abstimmung mit der Kabinetts-Spezifikation).
    - Die volle Ausgabenart-Gliederung setzt die Recherche (2.3) voraus.

##### 2.2 Behebung der Doppelzählung beim Personal (ui/wirtschaft/HaushaltsRad.tsx), sofort und vor dem Umbau
**Befund mit Zahlen vom Bildschirm (023):**
- Die sieben Außenstücke ergeben 4,0 + 1,3 + 5,6 + 3,7 + 3,6 + 10,8 + 3,9 = **32,9 Bio. ₺**. Die Überschrift nennt **29,2 Bio. ₺** (`staatsfinanzen(w).ausgabenMrd`).
- Ursache: `radStuecke` summiert die absoluten Etats aller Ausgabeposten je Gruppe, darunter `personal` mit 7,0 % BIP (data/haushaltsplan.ts: „überschneidet sich mit den Fachressorts“). `staatsfinanzen` (sim/staatsfinanzen.ts) rechnet dagegen ausdrücklich keine „Summe über überlappende Funktions- und Personalausgaben“.
- Weil `summeAussen = Math.max(ausgabenMrd, Σ Stücke)` gilt, beziehen sich die Prozente auf 32,9 statt auf 29,2. Renten sind dann „12 %“ statt rund 14 %.

**Änderung in `radStuecke`:**
1. Die Gruppensummen (Zeile ~37) lassen `p.id === "personal"` aus.
2. Nach den Zinsen wird `rest = fin.ausgabenMrd − bekannt` gerechnet. Ist `rest ≥ 0`, kommt das Stück `{ id: "oeffentlicher_dienst", name: t("hd.rad.oeffentlich"), mrd: rest, farbe: UEBRIG, ziel: "staat" }` hinzu; „Öffentlicher Dienst und Übriges (nicht zugeordnet)“ mit ⓘ-Aufschlüsselung:
   - Personaländerung seit 2026 `stufeVon(w,"personal") × schritt × bip`
   - Reformen `w.economy.policyCost × bip`
   - weitere Impulse aus `staatsfinanzen(w).ausgaben` (Zeile „weitere“)
3. Ist `rest < 0`, wird `konsistent: false` zurückgegeben, ein Hinweis „Die geschätzten Ressortanteile übersteigen die Ausgaben um X Bio. ₺“ angezeigt und das Stück weggelassen.
4. `summeAussen = r.ausgabenMrd` (das `Math.max` entfällt). Dasselbe gilt für den Innenring: `einnahmenMrd + kreditMrd`.
5. Die Gruppe „staat“ heißt danach „Justiz, Äußeres, Kultur, Preisstützung“, bis die Ministeriumsansicht sie auflöst.

Rechnerische Größenordnung aus den Bildschirmwerten: Ressortstücke ohne Personal ≈ 20,1 Bio., mit Zinsen ≈ 24,0 Bio. Das Reststück liegt damit bei etwa 5,2 Bio. ₺. Das ist keine neue Zahl, sondern Folge der vorhandenen Startanteile; der Test prüft die Summe, nicht den Betrag.

##### 2.3 Nötige Recherche: Ministeriumshaushalte 2026
1. **Zentralhaushaltsgesetz 2026** (2026 Yılı Merkezi Yönetim Bütçe Kanunu, Resmî Gazete), **Tabelle (A)**: Mittel je Einrichtung (kurumsal sınıflandırma) und darin nach ökonomischer Art (Personal, Sozialbeiträge, Waren und Dienstleistungen, Zinsen, laufende Übertragungen, Investitionen, Kapitaltransfers, Darlehen, Reserve). Liefert die 17 Ministerien × Ausgabenart und beendet die Schätzung „Spielparameter“ für 13 Posten.
2. **Haushaltsbegründung** (Bütçe Gerekçesi) des Strategie- und Haushaltsamts (SBB) und **funktionale Gliederung** (fonksiyonel sınıflandırma, COFOG) der Muhasebat Genel Müdürlüğü. Daraus ergibt sich die Gliederung nach Aufgaben (Gesundheit, Bildung …) einschließlich Personal.
3. **Programmhaushalt** des SBB (Programme je Einrichtung), für Programmstücke statt Maßnahmen-Näherung. Zu prüfen ist, ob die Gliederung nutzbar ist.
4. **Abgrenzung außerhalb des Zentralhaushalts:** SGK, TOKİ, BOTAŞ, TMO und Kommunen. Das bestimmt, was im Rad nur als Zuschuss erscheint (Renten heute schon richtig als SGK-Zuschuss 2.329 Mrd.).
5. **Zugeordnete Einrichtungen** (bağlı, ilgili, ilişkili kuruluşlar), zur Prüfung der Behörden- und Maßnahmenzuordnung in 0.4: TÜBİTAK, KOSGEB, DSİ, AFAD, Diyanet, MİT, SSB, BTK, RTÜK, TÜİK, Zoll.

**Was die Ansicht bis dahin zeigt:**
- Ebene 1 mit den Etatträgern aus den vorhandenen Posten (Stücke mit Spielparameter tragen das Siegel „geschätzt“) und dem ehrlichen Reststück.
- Ebene 2 mit Posten, Programmen und Behörden statt Ausgabenarten, mit dem ⓘ-Satz aus Ebene 2, Zone Z2.
- Jugend und Sport, Handel und Präsidialamt als Chips.
- Keine erfundene Aufteilung.

#### Wirtschaft › Geld & Lira
1. **Frage und Erfolg:** „Was macht die Bank bei der nächsten Sitzung, mische ich mich ein, und wie viel Reserve habe ich?“ In 5 Sekunden sieht man den Zins heute, was die Bank beschließen will, das Datum und die Tankfüllung.
2. **Aufbau:**
   - Z1, links (330 × 520): Gouverneurin.
   - Z2, Mitte (480 × 520): Halbrund Leitzins mit Sitzung und Einmischung.
   - Z3, rechts (340 × 520): Reserventank mit Intervention.
   - Z4, zugeklappte Reiter (1150 × 40): Zentralbankgesetz · IWF · Beschlüsse.
   - Alles in der ersten Bildschirmhöhe. Ziel ≤ 900 px gesamt (heute 4.798).
3. **Inhalte je Zone:**
   - Z1, Gouverneurin:
     - Porträt aus `figur(w,"zentralbank")` (sim/figuren.ts), Name aus `w.governor.name`.
     - Zwei getrennt benannte Werte: „Linie: streng / ausgewogen / gefügig“ (`w.governor.stance`, Typ `GovernorStance` = vorsichtig | ausgewogen | gefuegig, Anzeige „streng“ für vorsichtig) und „Loyalität zu Ihnen: 50“ (`figurHaltung`).
     - Glaubwürdigkeit `glaubwuerdigkeitWort(w.economy.credibility)`.
     - Unabhängigkeit: Stufe aus `zbZustand(w)` mit Namen aus `STUFEN`.
     - Knopf „Ersetzen ▾“ öffnet die drei Typen mit `ernenneGouverneur`, Preis (Marktvertrauen) und Sperrfrist (`zb.neubesetzung`).
   - Z2, Halbrund 0–40 %:
     - Zeiger 1 „Leitzins 23,5 %“ (`w.economy.policyRate`).
     - Marke „Inflation 19,2 %“ (veröffentlicht); der Bogen dazwischen ist der Realzins, eingefärbt (`realRate(e)`, sim/economy.ts:115).
     - Zeiger 2 gestrichelt „Bank will 23,0 %“ = `ppkDecision(e, stance, druck).newRate`.
     - Darunter: Sitzung „17. März 2030 · in 42 Tagen“ (`naechsteSitzung(w)`).
     - Einmischung als vier Knöpfe aus `druckOptionen(w)`: keiner, gespraech_senken, rede_senken, gespraech_straffen, rede_straffen. Ist der Zins weisungsgebunden, kommt die Vorgabe dazu (`setzeVorgabe`).
     - Jeder Knopf mit `neu` (Beschluss danach), `kosten` als Preisschild und `moeglich`/Grund. Hover setzt Zeiger 2 auf `neu`.
     - Risikoaufschlag `e.riskPremium` als kleine Zahl unter dem Bogen.
   - Z3, Tank:
     - Netto-Reserven als Füllstand (`reservenNettoUsdMrd`) mit Marken `DEVISEN.druckAn` 25 und `kriseAn` 10, brutto als Zahl daneben.
     - Monatsfluss aus `leistungsbilanzZerlegung` und `kapitalflussZerlegung` als Pfeil ±.
     - Drei Knöpfe 2, 5 und 10 Mrd. $ mit `interventionsVorschau(w, x)` als Preisschild und Wirkung auf den Kurs; Ausführen mit `interveniere`.
     - Unter der Gelbmarke erscheint die Notfallkarte IWF: `iwfAnfrageMoeglich`, `iwfSicht`, „Beim IWF anfragen“ mit `iwfAuflagen` als Preis.
   - Z4:
     - Zentralbankgesetz: `stufenWechsel`, `aendereStufe`.
     - IWF, wenn aktiv: `iwfSicht`, `iwfKuendigen`.
     - Beschlüsse: Verlauf der Sitzungen aus `zbZustand(w)`.
4. **Zustände:**
   - Sitzung in weniger als 7 Tagen: Z2 hervorgehoben.
   - Weisungsgebunden: Zeiger 2 ist vom Spieler ziehbar.
   - Reserven < 25: Tank gelb, IWF-Karte sichtbar.
   - Reserven < 10: rot, Warnung `zb.warnung`.
   - IWF aktiv: Auflagen als Marken im Halbrund (`zinsMindest`).
   - 0 Kapital: Knöpfe mit Kapitalpreis gesperrt, „Nicht einmischen“ bleibt.
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Einmischungsknopf | Hover | Zeiger 2 auf neuen Beschluss | Geld & Lira |
   | Einmischungsknopf | Klick | Bestätigung, `machDruck` | Geld & Lira |
   | Porträt | Klick | Gespräch und Personenakte | Kabinett |
   | „Ersetzen ▾“ | Klick | drei Typen mit Preis | Geld & Lira |
   | Interventionsknopf | Klick | Bestätigung, `interveniere` | Geld & Lira |
   | IWF-Karte | Klick | Anfrage mit Auflagen | Geld & Lira |
   | Halbrund | Klick | Lage mit Tacho Inflation und Kurve Leitzins | Lage |
   | Reiter Z4 | Klick | klappt auf | Geld & Lira |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/wirtschaft/Zentralbank.tsx (486 Zeilen, neun Abschnitte, wird drei Zonen und drei Reiter).
   - Gelöscht: die Kurve „Was danach kommt“ mit fünf Unterreitern (doppelt zur Lage) und der Satz „Reformen und Haushalt benötigen zusätzlich …“ (`finanzierungsMehrbedarf`; er gehört als ⓘ an das Defizit im Haushalt).
   - Hier gehen auf: Zentralbank und Devisen (025) sowie die Gouverneurskarte aus dem Wirtschaftskabinett (027).
7. **Simulationsbedarf:** keiner.
8. **Texte:**
   - „Haltung“ für die Gouverneurin heißt „Linie“, „Haltung“ für die Loyalität heißt überall „Loyalität“ (betrifft auch ui/Personen.tsx).
   - Risikoaufschlag in „Punkten“ (ganzzahlig).
9. **Abnahme:**
   - Höhe ≤ 900 px ohne Reiter.
   - Jeder Eingriff mit Preisschild.
   - Das Wort „Haltung“ kommt auf der Seite nicht vor.
   - Tests: test/devisen.test.ts unverändert. Neuer test/geld-lira.test.tsx (Zeiger 2 = `ppkDecision`, Tank-Farbe bei 23,9 gelb).
10. **Aufwand:** M. Keine Vorbedingung außer den Bausteinen Halbrund und Preisschild.

#### Wirtschaft › Handel
1. **Frage und Erfolg:** „Fehlt etwas, von wem bin ich abhängig, was verdiene ich am Export?“ In 5 Sekunden sieht man, ob eine Ware unter 100 % liegt und welches Lieferland gefährdet ist.
2. **Aufbau:**
   - Z1, Warenband (1150 × 130): 16 Warenikonen als Füllstände, in vier Gruppen nach `art`.
   - Z2, Handelsbild (1150 × 420): Sankey, links die Lieferländer, Mitte Türkei, rechts die Abnehmer, für die gewählte Ware oder alle.
   - Z3, nur im Engpass (1150 × 160): Vorrang und Instrumente.
   - Z4, Reiter: Mengenrechnung · Versorgungsprogramme.
3. **Inhalte je Zone:**
   - Z1: `gueterSicht(w)` (sim/gueter.ts:259) je Gut. Füllstand = Deckung `warenDeckung(w,id)` (sim/versorgung.ts:51), Farbe = `ampel` (grün, gelb, rot, keine). Darunter Reichweite `reichweiteJetzt` in Tagen, wenn endlich. Lebensmittel, Energie, Industrie, Rohstoffe und Rüstung als Gruppen (Getreide ist eine Ikone in der Gruppe Nahrung, kein eigener Abschnitt).
   - Z2: Linke Bänder aus `GutDef.lieferanten` (data/gueter.ts: Land und Anteil in %; Rest „übrige Welt“), gefährdet rot nach `fluss.wege[].grund` (krieg, sanktion). Rechte Bänder aus `GutDef.kunden`.
     - **Datenlücke:** Die Kunden haben keine Anteile. Bis zur Quelle (TÜİK-Außenhandel nach Ländern und Warengruppen) werden die Abnehmer als gleich breite Bänder mit ⓘ „Anteile folgen“ gezeichnet.
     - Breite links = Einfuhrwert, wo `importUsdMrd` vorliegt, sonst Menge. Wert und Saldo: `letzteVersorgung(w).handelsDeltaUsdMrd`.
     - Knopf „Auf der Weltkarte“ öffnet die vorhandene `TransportTafel` (ui/gueter/TransportKarte.tsx).
   - Z3, nur wenn eine Ware `fehlProzent > 0` hat oder `militaerVersorgung(w).faktor < 1`:
     - Vorrang (ausgewogen, zivil, militaer) mit `setzeVersorgungsPrioritaet`; Preis wie heute „3 Kapital, 30 Tage Bindung“ als Preisschild.
     - Je Ware im Engpass die Instrumente `gutInstrumente(w,gut)` (reserve, freigabe, foerderung, stopp, quelle), jeweils mit `pk`, `bip` und `wirkung`.
     - Die Wahl „militaer“ ist nur im Krieg sichtbar.
   - Z4: Mengenrechnung (`WarenFluss`, heute Inventar). Versorgungsprogramme (`VersorgungsProgramm` schutz, energie, netz) als Verweis auf die Maßnahmen, siehe offene Frage 5.
4. **Zustände:**
   - Frieden ohne Engpass: Z3 fehlt, die Seite endet nach Z2.
   - Engpass: Ikone rot, Z3 offen, Kopfhinweis.
   - Krieg: zusätzlich Kachel „Treibstoff für die Front“ (`militaerVersorgung`).
   - Hormus gesperrt: Bänder mit `hormusAnteil` gestrichelt.
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Warenikone | Klick | Sankey nur dieser Ware, Z3 dieser Ware | Handel |
   | Lieferland | Klick | Länderkarte | Außen › Welt (Seitenfenster neben Karte) |
   | „Auf der Weltkarte“ | Klick | TransportTafel auf der Karte | Karte |
   | Vorrang | Klick | Bestätigung, Preis | Handel |
   | Instrument | Klick | `fuehreGutInstrumentAus` | Handel |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/gueter/Inventar.tsx.
   - Übernommen: TransportKarte.tsx, VersorgungsKursKarte.tsx (als Z3).
   - Gelöscht aus der Ansicht: VersorgungsMonatsbericht.tsx, also der Block „Was Ihre Entscheidungen bewirken / im Vergleich / Warum die Parteien reagieren“. Er steht doppelt auf Parlament 007 und wird höchstens ein Eintrag im Verlauf.
   - Hier geht auf: Versorgung & Handel (024).
7. **Simulationsbedarf:** keiner. Daten: Kundenanteile (Datenlücke, s. o.).
8. **Texte:**
   - Der Kicker „KABINETT · VERSORGUNG & SICHERHEIT“ entfällt.
   - „Zivile Bedarfsdeckung¹“ heißt „Versorgung“.
   - „Treibstoff für den Einsatz —“ entfällt im Frieden.
9. **Abnahme:**
   - Im Frieden ohne Engpass ≤ 650 px Höhe.
   - Kein Knopf ohne Wirkung im Frieden (Vorrang ausgeblendet).
   - Kein Wert „0,00“ sichtbar.
   - Tests: test/gueter.test.ts unverändert; test/versorgung.test.tsx und test/versorgungsbericht.test.tsx an den neuen Ort anpassen.
10. **Aufwand:** M. Recherche Kundenanteile (S).

---

## Gesellschaft (sieben Reiter werden: Das Volk · Opposition & Straße · Wahlkampf nur zeitweise)

**Aktenkopf Gesellschaft:** Zustimmung steht in der Leiste, also nicht im Kopf. Stattdessen:
- Stärke der Opposition (`gesellschaftLage(w)` id `opposition`)
- Protestdruck (`protest`)
- Rathäuser im Lager (`rathaeuserLager(w)`)

Das Urteil „Lage: ruhig“ (ui/akte/Bereiche.tsx:266–268, nur drei Kopfwerte) entfällt.

#### Gesellschaft › Das Volk
1. **Frage und Erfolg:** „Würde ich gewinnen, wer trägt mich, wen verliere ich, und was hilft?“ In 5 Sekunden sieht man auf einer Achse, wie viel Fläche rechts der Trägerlinie steht und welcher Kreis nach links wandert.
2. **Aufbau:**
   - Z1, Band oben (1150 × 70): Umfrage, Ziel und Wahl.
   - Z2, Kreisfeld (1150 × 430): elf Wählergruppen.
   - Z3, Milieuleiste (1150 × 90): fünf Milieus.
   - Z4, Seitenleiste rechts (400 × 600, überlagert Z2 rechts, wenn eine Gruppe gewählt ist).
   - Z5, Reiter: Verlauf · Abwanderung.
   - Z1 bis Z3 in der ersten Bildschirmhöhe.
3. **Inhalte je Zone:**
   - Z1:
     - „Umfrage {Institut} 54 %“ aus `angezeigteZustimmung(w)` (`wert`, `institut`, `streuung` als ± und `alterTage`).
     - Bei `quelle === "rohdaten"` steht daneben „Rohdaten 50 %“.
     - Zielwert „strebt zu {n} %“ aus `koalition(w).zielZustimmung`.
     - Wahl: „Wahl am 5. Dezember 2030 · in 10 Monaten“ (`zustimmungsBilanz(w).wahlDatum` mit `formatDateDe`, `wahlIn`).
     - Koalitionsbalken (heute gut) mit `traeger`, `schwankend` und `gegner`.
     - Mini-Kurve der Umfrage aus `institutsReihe(w)` mit fester Achse 30–70.
   - Z2, Kreisfeld nach Democracy 4:
     - Daten: `koalition(w).gruppen: GruppeKurz[]` (sim/waehler-detail.ts:519). Waagrechte Achse 0–100 = `laune` (Stimmung, `nationalAverage(NET, w.net, id)`), mit senkrechten Linien bei `SCHWELLE_SCHWANKEND` 45 und `SCHWELLE_TRAEGER` 58 (waehler-detail.ts:31–32). Beschriftet sind die Bereiche links „gegen Sie“, Mitte „schwankend“ und rechts „trägt Sie“.
     - **Kreisfläche** ∝ `anteil` = `gewicht / GRUPPEN_SUMME` (sim/gruppen.ts). Das ist ausdrücklich das Gewicht in der Zustimmung und ein Spielparameter (Werte 0,5 bis 1,4); die Legende sagt „Größe = Gewicht in der Umfrage“, nicht Bevölkerungsanteil.
     - **Füllfarbe** = `laune` auf einer Skala rot (0) über grau (50) bis grün (100).
     - **Rand** = `rolle` (`rolleVon`): voll bei Träger, gestrichelt bei schwankend, rot bei Gegner.
     - **Pfeil** vom Kreis zu `ziel` (Tendenz, `tendenz(w,id).ziel`) als blasser Schatten des Kreises am Zielort.
     - **Zahl** im Kreis ist `laune` ganzzahlig, mit kleinem ▲▼ `trend` (Veränderung zu vor 3 Monaten, `vorMonaten`).
     - Senkrechte Lage: Kraftlayout (Beeswarm) nur gegen Überlappung, ohne Bedeutung.
     - Hervorhebungen: `gewinnbar` mit goldenem Ring und Etikett „am ehesten zu gewinnen“, `gefaehrdet` mit rotem Puls.
     - Hover über einen Kreis: die drei stärksten `treiber(w,id)` (waehler-detail.ts:112) als Linien zu kleinen Ikonen am oberen Rand (Maßnahme oder Größe), grün oder rot wie in Democracy 4.
   - Z3, Milieus: `milieuLage(w)` (sim/gesellschaft.ts:259) für alle **fünf** (kurden, aleviten, frauen, gefluechtete, diaspora), als gleich große Kreise (keine belegte Größe: Datenlücke).
     - Farbe = `stimmung`, Dicke des roten Zackenrings = `groll`, Pfeil = `trend` (steigt, fällt, gleich).
     - Eine dünne Linie zum Gruppenkreis, auf den der Groll zurückwirkt (`MilieuDef.gruppe`: kurden und aleviten → minderheiten, frauen → staedtische_saekulare; gefluechtete und diaspora haben keine Linie).
   - Z4, Seitenleiste der gewählten Gruppe (`gruppenDetail(w,id)`):
     - drei Ursachen (`treiber`) als Balken mit Klartext statt Netzkette
     - drei Wünsche aus `praeferenzen(w,id).will` und `hasst`, je eine Zeile mit Stufe „von 50 auf 70“ (statt „+20 Stufen“)
     - „Was jetzt helfen würde“: `hilfen(w,id,3)` als `HilfeKarte` (ui/waehler/HilfeKarte.tsx) mit Preis `pk`, `kostenBip`, `monate`, `mehrheitFehlt` und Wirkung `zustimmung`; Knopf „Einbringen“ (Maßnahmenweg)
     - „wechselt zu …“ aus `wanderung(w,id)` als Pfeil mit Parteifarbe
     - Region: `regionen(w,id)` als Mini-Karte (`Karte2D`, ui/atlas/Karte2D.tsx, Füllung je Provinz)
   - Z5: Verlauf aus `zustimmungsVerlauf(w)` und `gesellschaftLage(w).reihe` mit festen Achsen 0–100 und Zustimmung 30–70; Abwanderung aus `abwanderung(w)`.
   - **Datenlücke Gruppengröße:** echte Größen fehlen. Mögliche Quellen:
     - Beschäftigte, Landwirte und Unternehmer: TÜİK-Arbeitskräfteerhebung
     - Rentner: SGK-Statistik
     - Junge: TÜİK-Bevölkerung nach Alter
     - Beamte: Personalstatistik des öffentlichen Dienstes
     - Arme: TÜİK-Armutsquote
     - Konservative, Säkulare, Nationalisten und Minderheiten: Umfragen zur Selbstverortung (prüfen)

     Die Gruppen überschneiden sich. Bis dahin bleibt „Gewicht in der Umfrage“ als Größe, offen benannt.
4. **Zustände:**
   - Vor dem ersten Umfragemonat: `quelle === "start"`, Band zeigt „noch keine Umfrage“.
   - Publikationsverbot (`publikationsverbot(w)`): Zahl eingefroren, Siegel „Verbot“.
   - Wahl in weniger als 56 Tagen (`WAHLKAMPF.beginnTage`): Band wird rot umrandet, Knopf „Zum Wahlkampf“.
   - Krise (Gruppe unter 30): Kreis pulsiert.
   - 0 Kapital: Einbringen-Knöpfe gesperrt mit Grund.
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Gruppenkreis | Hover | Linien zu den Treibern | Das Volk |
   | Gruppenkreis | Klick | Seitenleiste | Das Volk Z4 |
   | Treiber-Ikone | Klick | Maßnahmenzeile im Politikkreis | Politik |
   | Milieukreis | Klick | Seitenleiste Milieu: Ursachen `milieuLage().ursachen`, Groll, verknüpfte Gruppe | Das Volk Z4 |
   | Wunschzeile | Klick | Maßnahmenzeile aufgeklappt | Politik |
   | „Einbringen“ (HilfeKarte) | Klick | Gesetzesweg der Maßnahme | Parlament › Tagesordnung |
   | Umfragezahl | Klick | Rohdaten kaufen und Institute | Medien |
   | „Zum Wahlkampf“ | Klick | Wahlkampf | Gesellschaft › Wahlkampf |
   | Esc / ✕ | Taste oder Klick | schließt Seitenleiste | Das Volk |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/Waehler.tsx (`Barometer` wird Z1, `KoalitionsBalken` bleibt, die Kartenliste wird zum Kreisfeld), ui/waehler/GruppenDetail.tsx (wird Seitenleiste, vier Aufklapper werden drei Blöcke).
   - Übernommen: HilfeKarte.tsx, Sparkline.tsx, Kette.tsx (nur für das ⓘ „Warum genau?“).
   - Gelöscht: die Lageansicht der Gesellschaft mit „Lage: ruhig“ und „Milieus“ (Bereiche.tsx `lageZeilen` für gesellschaft), der Verlaufsreiter (032), der Personenreiter (033) und der Unterreiter „Gesellschaft, Opposition, Straße“ in ui/Waehler.tsx:213.
   - Hier gehen auf: Stimmung im Land (028), Wählerkoalition (029), Gesellschaft im Wandel (032).
7. **Simulationsbedarf:** keiner für die Anzeige. Optional `GRUPPEN[].bevoelkerung?` (sim/gruppen.ts) für die echte Größe nach Recherche, getrennt vom Gewicht, damit die Zustimmungsrechnung unverändert bleibt.
8. **Texte:**
   - „Stimmung“ statt „Laune“ in der Oberfläche.
   - „Gewicht“-Wörter (`gewichtWort`) entfallen, die Größe zeigt es.
   - „+20 Stufen“ heißt „von 50 auf 70“.
   - Datum deutsch.
   - Der Verweis „Rohdaten gibt es im Reiter ‚Medien‘ der Zeitung“ wird ein Knopf an der Zahl.
9. **Abnahme:**
   - Erste Bildschirmhöhe: Band, Kreisfeld und Milieus.
   - Höhe ohne Reiter ≤ 900 px (heute 4.086).
   - Alle elf Gruppen und alle fünf Milieus sichtbar, kein „1 weiterer Eintrag“.
   - Die Zustimmung zeigt in Kopf, Leiste und Band denselben Wert.
   - Kein ISO-Datum.
   - Tests: test/waehler-ui.test.tsx umschreiben (Kreisfeld statt Karten), test/waehler-detail.test.ts unverändert. Neu test/kreisfeld.test.tsx (Fläche ∝ `anteil`, Rand nach `rolle`, Schwellen 45/58).
10. **Aufwand:** L (Kreisfeld mit Layout und Hover-Linien). Vorbedingung: Regel 0.5 Zustimmung.

#### Gesellschaft › Opposition & Straße
1. **Frage und Erfolg:** „Wie stark ist die Opposition, wo brennt die Straße, wo habe ich Rathäuser verloren, und was tue ich dagegen, zu welchem Preis?“ In 5 Sekunden sieht man Arıkans Stärke, die Brandherde auf der Karte und die Zahl verlorener Rathäuser.
2. **Aufbau:**
   - Z1, links (400 × 560): Gegner und Instrumente gegen die Opposition.
   - Z2, rechts (730 × 560): Provinzkarte mit Rathäusern und Bewegungen.
   - Z3, Leiste unter der Karte (730 × 90): drei Tachos.
   - Z4, Reiter: Frühere Bewegungen · Züge der Opposition · Kommunalwahl.
3. **Inhalte je Zone:**
   - Z1:
     - Porträt der Oppositionsführung: Figur `amt === "opposition"` (heute Cem Arıkan), Partei `parteiName(o.partei)`, Bündnis `o.buendnis`.
     - Stärketacho 0–100 aus `oppositionVon(w).staerke`, mit Marke `zielStaerke(w,o)` (sim/opposition.ts:66).
     - Marken: `verfahren`, `maertyrer`, `immunitaetAufgehoben`, `verbot`, `ausschussBis`.
     - Instrumente aus `oppositionInstrumente(w)` (gespraech, ausschuss_zulassen, ermittlung, immunitaet, verbot), je eine Zeile mit Preisschild (`kapital`, `aufmerksamkeit`), Folgen-Chips (`folgen`), Vorschau `staerkeSofort` und `moeglich`/`grund`.
     - Nächster Zug „Die Opposition plant: …“ aus `naechsterZugArt(w,o)` und `o.naechsterZug`.
   - Z2, Karte `Karte2D` (ui/atlas/Karte2D.tsx):
     - Füllung je Provinz = Partei des Rathauses aus `kommunenVon(w)` (Lager oder Opposition; Zwangsverwaltung schraffiert).
     - Seit Amtsantritt verlorene Rathäuser rot umrandet: Vergleich mit `kommunenStart(w)` (sim/kommunen.ts:35).
     - Bewegungen als Brandherd-Marken aus `bewegungsOrte(w)` (sim/bewegungen.ts:332) in der Größe `groesse`.
     - Zähler „Rathäuser im Lager 19 (beim Amtsantritt 32)“.
     - Klick auf eine Provinz mit Bewegung öffnet eine Karte mit `bewegungenSicht(w)`: Antworten dialog, zugestaendnis, polizei, verbot, je mit Preis `antwortKapital` (wächst mit der Größe) und Vorschau (Größe, Radikalität, Märtyrer).
     - Klick auf ein Rathaus öffnet Zwangsverwalter einsetzen oder abziehen (`zwangsverwalterEinsetzen`/`zwangsverwalterAbziehen`, Preis `VERWALTER_KOSTEN`).
   - Z3, Tachos mit fester Achse 0–100 und gut/schlecht-Farbe:
     - Polarisierung (`knoten(w,"polarisierung")`)
     - Protestdruck (`protestdruck`)
     - Repression (`g.repression`)

     Daneben das kleine Porträt der Innenministerin (`ministerFuer(w,"inneres")`) mit ihrem Wunsch.
   - Z4: frühere Bewegungen (heute `ges.bew.frueher`), Zugliste `o.zuege`, Kommunalwahlstand `ges.kom.stand`.
4. **Zustände:**
   - Keine Bewegung: Karte ohne Brandherde, Satz „Keine Bewegung auf der Straße“.
   - Verbotsverfahren läuft: Banner mit Entscheidungsdatum.
   - Kommunalwahl fällig (`kommunalwahlFaellig`): Hinweis mit Datum.
   - 0 Kapital: Instrumente gesperrt mit Grund (`ges.grund.kapital`).
   - Krieg und Ausnahmezustand: Instrumente mit Zusatzfolgen nach heutiger Logik.
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Instrument | Klick | Bestätigung, `oppositionInstrument(w,id)` | Opposition & Straße |
   | Porträt Opposition | Klick | Gegnerprofil (`gegnerProfil`) | Opposition & Straße |
   | Provinz mit Bewegung | Klick | Bewegungskarte mit Antworten | Opposition & Straße |
   | Antwort | Klick | `bewegungAntworten` | Opposition & Straße |
   | Rathaus | Klick | Zwangsverwalter-Karte | Opposition & Straße |
   | Provinz | Doppelklick | Provinzkarte | Land › Karte |
   | Innenministerin | Klick | Ministerakte | Kabinett |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/gesellschaft/GesellschaftAkte.tsx. Die vier Unterreiter (lage, opposition, strasse, kommunen) entfallen; Opposition wird Z1, Straße und Kommunen werden Z2.
   - Übernommen: Karte2D.
   - Gelöscht: Politische Akteure (033).
   - Hier geht der versteckte Unterreiter „Gesellschaft, Opposition, Straße“ aus 029 auf.
7. **Simulationsbedarf:** keiner. Hilfsfunktion `rathausVerluste(w)`: Provinzen, deren Rathaus seit `kommunenStart` vom Lager zur Opposition ging. Sie liest nur vorhandene Felder.
8. **Texte:**
   - „Haltung: abtrünnig (24)“ beim Oppositionsführer entfällt; dort steht „Stärke 65“.
   - Bewegungsarten mit Ikone.
9. **Abnahme:**
   - Höhe ≤ 750 px ohne Reiter.
   - Jedes Instrument mit Preis.
   - Die Zahl der Rathäuser stimmt mit `rathaeuserLager(w)` überein.
   - Tests: test/gesellschaft.test.ts unverändert. Neu test/opposition-strasse.test.tsx (Karte färbt nach `kommunenVon`, Brandherde = `bewegungsOrte`).
10. **Aufwand:** M. Vorbedingung: Karte2D im Aktenrahmen (Größe 730 × 560).

#### Gesellschaft › Wahlkampf (nur ab `WAHLKAMPF.beginnTage` = 56 Tage vor der Wahl)
1. **Frage und Erfolg:** „Wo setze ich diese Woche meine 10 Aktionspunkte ein, und lohnt sich das Duell?“ In 5 Sekunden sieht man die Punkte, die Karte mit den knappen Provinzen und das Duelldatum.
2. **Aufbau:**
   - Z1, Band (1150 × 70): Punkte, Woche, Duell, Tage bis zur Wahl.
   - Z2, Karte (760 × 520).
   - Z3, rechts (390 × 520): Versprechen, Diaspora-Touren, Duell.
   - Z4, Ticker (1150 × 60).
3. **Inhalte je Zone:** alles aus `wahlkampfSicht(w)` (sim/wahlkampf.ts:824).
   - Z1:
     - `ap`/`apMax` als zehn Münzen, `resetIn`, `tageBisWahl`.
     - Duell `duell.datum` mit Zustand `vorbereitet`.
     - Gegner `gegner` (`gegnerProfil`).
     - Bei Rolle „nachfolger“ der Nachfolger (`nachfolger.name`, `staerke`).
   - Z2, Karte2D:
     - Füllung je Provinz = Abstand zur Mehrheit aus der Umfrage je Region (`regionen` bzw. `regionenMitProvinzen()`).
     - Ein Klick auf eine Provinz zeigt `reiseVorschau(w, plaka)` (stärke, risiko, probleme, relevant, abnutzung) und `reiseKosten(plaka)` in Punkten.
     - Münze auf die Provinz ziehen oder Knopf „Reisen“ (`reise`).
     - Bereits besuchte Provinzen `reisen` mit Haken.
   - Z3:
     - Versprechen aus `versprechen` (`versprechenAngebot`, `verspreche`) mit Glaubwürdigkeit `glaubwuerdigkeit` als Leiste.
     - Diaspora: `diaspora` (beitrag, beteiligung) mit Tour-Knöpfen (`auslandstour`).
     - Duell vorbereiten (`duellVorbereiten`) mit Preis.
     - Schwachstelle `schwachstelle(w)` als Warnung.
   - Z4: `ticker` und Wirkungssumme `effekte.gesamt` mit `teile` als ⓘ.
4. **Zustände:**
   - **Vor der Phase:** keine Ansicht und kein Reiter. Stattdessen im Band von „Das Volk“: „Wahl am 5. Dezember 2030 · Wahlkampf ab 10. Oktober 2030“ (`beginntIn`).
   - In der Phase: Reiter sichtbar mit Zähler „noch {tageBisWahl} Tage“.
   - 0 Punkte: Aktionen gesperrt mit „neue Punkte in X Tagen“.
   - Publikationsverbot: Ticker ohne Umfragewerte.
   - Kommunalwahl: Sie zeigt keinen Wahlkampf, sondern nur den Hinweis in Opposition & Straße (heute gibt es keine Kampagnenmechanik dafür).
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Provinz | Klick | Reisevorschau | Wahlkampf |
   | Münze auf Provinz / „Reisen“ | Ziehen oder Klick | `reise` | Wahlkampf |
   | Versprechen | Klick | `verspreche` mit Preis | Wahlkampf |
   | Tour | Klick | `auslandstour` | Wahlkampf |
   | „Duell vorbereiten“ | Klick | `duellVorbereiten` | Wahlkampf |
   | Gegnerporträt | Klick | Gegnerprofil | Opposition & Straße |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/Wahlkampf.tsx (286 Zeilen, Abschnitte werden die Zonen; die Karte ersetzt die Provinzliste) und ui/Wahlversprechen.tsx.
   - Gelöscht: der Platzhaltertext „Der Wahlkampf steht noch bevor“ (030).
7. **Simulationsbedarf:** keiner.
8. **Texte:** „Aktionspunkte“ heißt „Wahlkampfpunkte“; Tage statt Wochen in der Countdown-Zeile.
9. **Abnahme:**
   - Der Reiter existiert nur bei `wahlkampfAktiv(w)` (sim/wahlkampf.ts:124).
   - Höhe ≤ 750 px.
   - Jede Aktion zeigt ihre Punkte.
   - Tests: test/wahlkampf.test.ts und test/wahlkampf-reisen.test.tsx anpassen (Reise über die Karte). Neu: Reiter fehlt bei `beginntIn > 0`.
10. **Aufwand:** M. Vorbedingung: Karte2D im Aktenrahmen (dieselbe wie Opposition & Straße).

---

## Fehlerliste (aus kritik-B, mit Ort und Behebung)

| Nr | Fehler | Ort | Behebung |
|---|---|---|---|
| F1 | Haushaltsrad zählt das Personal doppelt; Stücke ergeben 32,9 statt 29,2 Bio., Prozente auf falscher Basis | ui/wirtschaft/HaushaltsRad.tsx `radStuecke` (Gruppensummen ~Z. 37), `summeAussen` (~Z. 116) | wie 2.2; Test test/haushaltsrad.test.ts |
| F2 | Zustimmung 50 / 50,2 / 54 / 54,2: Leiste und Kopf zeigen den wahren Wert, die Wählerkoalition die Umfrage; das hebelt die Rohdaten-Mechanik aus | ui/Stage.tsx:429 und :699, ui/akte/Bereiche.tsx:86, sim/krisenpaket.ts `sozialeKrisenlage` (Anzeige), ui/SpeicherDossier.tsx:131 | überall `angezeigteZustimmung(w).wert`; wahr nur mit `quelle==="rohdaten"` |
| F3 | Wachstum 3,6 im Kopf gegen 4,1 in der Liste (Kopf zeigt den unveröffentlichten wahren Wert) | ui/wirtschaft/Akte.tsx:57 (`w.economy.growth`) | `aktuellerWert(w,"wachstum")`; ebenso Inflation in Zeile 56 auf den veröffentlichten Wert prüfen |
| F4 | Unter „Arbeitslosigkeit 9,7 %“ steht „Inflation: 19,2 % pro Jahr“ (und nutzt `economy.inflation`) | ui/wirtschaft/KrisenGesetze.tsx:19, Katalog `kg.inflation` (i18n/katalog/de/krisenpaket.json:70) | Unterzeile auf Trend der Arbeitslosigkeit; entfällt mit dem Umbau |
| F5 | Interne Kürzel „(Z1)“ bis „(Z5)“ im Spielertext | i18n/katalog/de/kennzahlen.json (10 Stellen, z. B. `wk.cf1d329`) | Klammern streichen; Katalogtest gegen `\(Z\d\)` |
| F6 | Behörden-Rückfallposten falsch: Gesundheitswesen `posten: "gesundheit_bildung"` → Alias auf **bildung**; Polizei und Grenzschutz `"sicherheit"` → **verteidigung**; MİT und Cyber über `RESSORT_POSTEN.praesidialamt` aus **innere_sicherheit** | data/behoerden.ts:84, 128, 173, 184, 214; sim/haushalt.ts:152 (`POSTEN_ALIAS`) | Gesundheit → `gesundheit`, Polizei und Grenzschutz → `innere_sicherheit`; Präsidialamt als offener Punkt (Frage 3); `RESSORT_POSTEN` aus `data/ministerien.ts` ableiten |
| F7 | Wahldatum im ISO-Format „2030-12-05“ | sim/waehler.ts:170 (`wahlDatum`), Ausgabe in ui/Waehler.tsx (`medien.barometer.text_*`) | `formatDateDe` beim Einsetzen |
| F8 | „Lage: ruhig“, obwohl die Opposition auf 65 gestiegen ist und 13 Rathäuser verloren sind | ui/akte/Bereiche.tsx:260–268 (Urteil nur aus drei Kopfwerten) | entfällt mit dem Umbau; bis dahin Urteil auch aus `gesellschaftLage` (opposition, rathaeuser gegen Start) |
| F9 | Fünftes Milieu (Kurden) hinter „1 weiterer Eintrag“ | ui/akte/Bereiche.tsx `lageZeilen` gesellschaft und Begrenzung in `LageAnsicht` | alle fünf zeigen; entfällt mit dem Umbau |
| F10 | „Haltung“ meint bei der Gouverneurin die Linie und auf Personenkarten die Loyalität | ui/wirtschaft/Zentralbank.tsx (`zb.haltung`), ui/akte (`PersonenListe`) | „Linie“ gegen „Loyalität“ |
| F11 | Drei Wirtschaftsminister heißen Erdem | Namensvergabe der Figuren (sim/personen.ts bzw. Startszenario) | keine doppelten Nachnamen im Kabinett, Test über alle `figuren` |
| F12 | Drei Posten exakt „1.270 Mrd. · 1,0 % BIP“ ohne Hinweis | data/haushaltsplan.ts `RESSORTS_2026` (sozialhilfe, gesundheit, innere_sicherheit `startBip: 1`) | Siegel „geschätzt“ bei `beleg === SPIEL`; Werte mit Recherche 2.3 ersetzen |
| F13 | Leiste nennt das Defizit „2,9 % Haushalt“ | Kopfleiste (ui/kopf) | Etikett „Defizit“ |
| F14 | Bilanzkurven auf Minimum bis Maximum skaliert (50–52 wirkt wie Absturz) | ui/akte/Bereiche.tsx `VerlaufAnsicht` / `VerlaufsDiagramm` | feste Achse oder Zielband; entfällt mit dem Umbau |
| F15 | Haushaltsposten und Maßnahmen zahlen dieselbe Sache doppelt (Verteidigung gegen m_verteidigung, Sozialhilfe gegen m_sozialhilfe, Subventionen gegen m_energiesubventionen und m_agrarsubventionen, Forschung gegen m_forschung, Renten gegen m_renten) | sim/haushalt.ts `POSTEN`, data/politiknetz.ts (cost), sim/netz.ts `policyCost` | keine stille Änderung; im Ministeriumsrad getrennt als „Grundetat“ und „Programm“ zeigen, Entscheidung offen (Frage 2) |
| F16 | Der Monatsbericht-Block steht doppelt (Versorgung 024 und Parlament 007) und zeigt im Frieden nur Nullen | ui/gueter/VersorgungsMonatsbericht.tsx | aus Handel entfernen, als Verlaufseintrag führen |

## Offene Fragen (höchstens fünf)
1. **Personal:** Bleibt „Öffentlicher Dienst“ nach der Recherche ein eigenes Stück (Besoldungsregler beim Finanzministerium), oder wird der Personalanteil auf die 17 Ministerien verteilt und der Regler `personal` je Ressort geteilt? Das ist eine Spielregeländerung.
2. **Doppelte Geldhebel (F15):** Sollen Haushaltsposten und gleichnamige Maßnahmen zu einem Hebel verschmelzen? Vorschlag: Der Haushaltsposten ist der Etat, die Maßnahme ist nur noch Gesetz ohne eigene Kosten. Und wohin gehört `subventionen` (Energie, Landwirtschaft oder geteilt)?
3. **Präsidialamt:** Bekommt es einen eigenen Etatträger im Rad (MİT, Cyber, Religionsbehörde, Kommunikation, Rüstungsamt), obwohl es kein Ministerium ist?
4. **Jugend und Sport, Handel:** neue Regler erst mit Quelle (Vorschlag) oder vorher als Spielparameter?
5. **Versorgungsprogramme** (schutz, energie, netz in sim/versorgungspolitik.ts) gehen als eigene Vorlagen durchs Parlament. Werden sie nach Entscheidung 2 benannte Fassungen von Maßnahmen (etwa m_lng_vertraege, m_netzausbau, m_preiskontrollen)?
