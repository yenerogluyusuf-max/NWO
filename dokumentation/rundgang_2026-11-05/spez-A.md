# Spezifikation A – Einstieg, Schreibtisch, Hauptmenü, Politik, Parlament, Kabinett

Grundlage: `PLAN_OBERFLAECHE_2026-11-05.md` (Abschnitte 2, 3, 4), ENTSCHEIDUNGEN W vom 5. November (17 Ministerien, ein Weg zum Gesetz, Karte als Bühne) und die Kritik `kritik-A.md`. Alle Pfade gelten relativ zu `/home/user/NWO/game/src`. Richtwert: Bildschirm 1440×900, Akteninhalt ca. 1150×750 px.

Für alle Ansichten gelten Regeln, die hier nicht bei jeder Ansicht wiederholt werden (**R1–R8**):

- **R1 Zahlen.** Indizes (0–100) werden als ganze Zahl gezeigt. Prozent haben höchstens eine Nachkommastelle, und nur wenn sie im echten Leben üblich ist (Inflation 19,2 %, Leitzins 23,5 %). Kapital ist immer eine ganze Zahl. Geld steht in Mrd. ₺ ohne Nachkommastelle und zusätzlich in % des BIP mit einer Stelle. Fristen bis 60 Tage stehen in Tagen, darüber in Monaten („in 22 Monaten“), über 24 Monaten in Jahren.
- **R2 Richtung.** Rot heißt schlechter, Grün besser. Es gibt **eine** Quelle für „hoch ist schlecht“, eine neue Funktion `hochIstSchlecht(id)` in `sim/wertung.ts`. Sie ersetzt drei heute getrennte Listen: `HOCH_SCHLECHT` in `sim/personen.ts:17`, `SCHLECHT_WENN_HOCH` in `ui/politik/bereiche.ts:58` und `EXTRA_SCHLECHT`/`schlechtBeiHoch` in `sim/berichte.ts:160–169`. Ein Pfeil ▲▼ zeigt nur den Trend, die Farbe zeigt die Wertung.
- **R3 Eine Größe, ein Wert.** Zustimmung hat genau zwei benannte Werte: „Stab misst“ (`spiel.umfrage.zustimmung`) und „Umfrage“ (`angezeigteZustimmung(w)` in `sim/medien.ts:863`). Wo beide stehen, stehen sie nebeneinander und tragen ihren Namen.
- **R4 Preis am Knopf.** Jeder Knopf, der etwas verändert, trägt Kapital, Aufmerksamkeit und Geld in seiner Beschriftung oder als Marke direkt daran („Einbringen · 6 Kapital“). Regeltext steht im ⓘ.
- **R5 Höchstens zwei Ebenen.** Bereich → Ansicht. Ein Drill-down öffnet sich **im** Bild (Seitenleiste oder Zoom), nicht als weiterer Reiter.
- **R6 Personen** erscheinen als klickbares Porträt (`PersonPortraet`/`Cameo` unter `ui/art`). Ein Klick öffnet die Ministerakte bzw. die Parteikarte.
- **R7 Loyalität** hat **eine** Skala mit fünf Worten aus `stimmungVon` in `sim/kabinett.ts:83`. Wegfallen `loyalWort` in `ui/akte/Bausteine.tsx:45` und die Schwellen 40/55 als Text in `sim/ministerfluss.ts:488/549`. Die Schwellen bleiben als Spielregel erhalten, ihr Wort kommt aber aus derselben Skala.
- **R8 Höhe.** Jede Ansicht ist höchstens 1,3 Bildschirme hoch (≤ 1.000 px Inhalt). Längere Listen sind Ausklapper oder Seitenleisten.

---

## Teil 1: Gemeinsame Grundlagen

### 1.1 Ein Weg zum Gesetz (Entscheidung W2)

**Heute** gibt es zwei Wege, die beide auf dasselbe Politiknetz wirken:

| | Weg „Maßnahme“ | Weg „Gesetzesvorhaben“ |
|---|---|---|
| Daten | `NET.nodes` mit `kind:"massnahme"` (117 Maßnahmen, `data/politiknetz.ts`) | `GESETZESVORHABEN` in `data/gesetzesvorhaben.ts` (26 Einträge mit je `massnahme`, `richtung`, `schritte` 30/18/8, `fuer`, `gegen`, `erlass`, `grundrechte`, `protest`, `kommunal`, `kalender`) |
| Einbringen | `bringeEin(w, id, stufe, ort, "gesetz"/"erlass")` in `sim/handeln.ts:497` aus `MassnahmenTafel` und Wirkungsnetz | `bringeVorhabenEin(w, id, fassung, weg)` in `sim/gesetzgebung.ts:332`. Ruft intern `bringeEin` auf und ergänzt `name`, `vorhaben`, `fassung`, `stimmenBonus` |
| Stimmen | `pruefeVorhaben(...).gesetz.stimmen.erwartet` | dieselbe Zahl **plus** `stimmenBonusFuer(w, v, fassung)` (`sim/gesetzgebung.ts:213`): Kompromiss holt Oppositionsstimmen, scharf verliert Partner |
| Folgen | Netzwirkung | zusätzlich `folgenNachBeschluss` (Verbände, Wählergruppen, Protest, Rathäuser), `ruhe`, Normenkontrolle (`pruefungen`, `klaeger`) |
| UI | `ui/politik/MassnahmenTafel.tsx`, Wirkungsnetz | `ui/gesetze/Gesetzesvorhaben.tsx` (Kachelwand „Mehrheit steht“) |

Hier liegt die Ursache für „373 gegen 362“: Die Kachel rechnet mit dem Bonus der Fassung „Kompromiss“, die Fraktionsseite ohne.

**Neu, Regel G1–G8:**

- **G1 Eine Eingangstür.** Gesetze bringt man nur noch an der Maßnahmenzeile ein (Politik → Bereich → Zeile → Prüfzeile). `ui/gesetze/Gesetzesvorhaben.tsx` entfällt als Ansicht, die Logik in `sim/gesetzgebung.ts` bleibt.
- **G2 Benannte Fassungen.** Hat eine Maßnahme einen Eintrag in `GESETZESVORHABEN`, zeigt ihre Prüfzeile über dem Regler drei Knöpfe: „Mindestlohngesetz: scharf · Kompromiss · verwässert“. Jeder Knopf setzt den Regler auf `stufe + richtung × schritte[i]`, so wie es `vorhabenSicht` (`sim/gesetzgebung.ts:241`) schon rechnet. Der Name kommt aus `t("gesetz.v.<id>.titel")`, der Satz aus `gesetz.v.<id>.satz`. Ohne Katalogeintrag zieht man den Regler frei. Die Zeile heißt dann „Änderung: Mindestlohn auf Stufe 60“.
- **G3 Eine Prognose.** Neue Funktion `gesetzesPrognose(w, massnahme, ziel, ort)` in `sim/gesetzgebung.ts`. Sie liefert `{ ja, luecke, urteil, fassung, stimmenBonus, dafuer, dagegen, erlass, gerichtP, pk, kostenBip, monate }`. `MassnahmenTafel.Pruefzeile`, `vorhabenSicht` und die Tagesordnung nutzen nur noch sie. Liegt die freie Stufe auf einer Fassungsstufe, gilt deren Bonus. Für freie Stufen schlage ich **Variante A** vor: die nächstliegende Fassung nach Betrag des Schritts (≥ scharf → scharf, ≥ Kompromiss → Kompromiss, sonst verwässert). **Variante B** wäre: kein Bonus, keine Verbandsfolgen. Das ist eine **Regeländerung** (Variante A gibt freien Entwürfen Verbandsfolgen, die sie heute nicht haben) und muss in ENTSCHEIDUNGEN entschieden werden (offene Frage 1).
- **G4 Dafür/Dagegen.** `lagerVon(w, v)` (`sim/gesetzgebung.ts:110`) erscheint in der Prüfzeile als zwei Porträt- bzw. Ikonenreihen. Wählergruppen tragen ihre Ikone aus `ui/waehler`, Verbände eine Wappenikone. Bei Maßnahmen ohne Katalog zeigt die Prüfzeile stattdessen die betroffenen Wählergruppen aus den Netzkanten (`NET.edges` mit `to` = Gruppenknoten).
- **G5 Erlass.** Den Knopf „Als Erlass · n Kapital · Gericht p %“ gibt es nur, wenn `erlassMoeglich(id)` (`sim/handeln.ts:311`) gilt und, bei einem Katalogeintrag, `v.erlass === "anfechtbar"` und nicht `grundrechte`. Das Risiko kommt aus `gerichtWahrscheinlichkeit` (`sim/gesetzgebung.ts:199`).
- **G6 Ruhe und Prüfung.** `ruhe[v.id]`, `pruefungen` und `neuanfangGrund` sperren den Einbringen-Knopf. Der Grund steht als Satz am gesperrten Knopf, z. B. „Ruht noch 4 Monate nach der Annahme“.
- **G7 Ministervorschläge** (`sim/vorschlaege.ts`, ministerfluss-Vorlagen mit Maßnahmenbezug) erscheinen an der Zeile nur als Marke „Murat Erdem rät: Stufe 60“ (heute `po2.vorschlag` in `MassnahmenTafel.tsx`). Als Entscheidung stehen sie im Eingang des Schreibtischs. Vorschläge, deren Vorschau keine Änderung ergibt (`nutzen.jetzt === nutzen.mit === nutzen.ohne`, Bild 003: „20 → 20 · ohne Eingriff 20“), werden nicht mehr erzeugt bzw. nicht gereiht (`sim/ministerfluss.ts`, `empfiehl`, und die Reihung in `sim/vorschlaege.ts:94`).
- **G8 Kalender.** `kalender` (z. B. Mindestlohn im Dezember, Renten im Juli) erzeugt wie bisher die Vorlage im Eingang. Der Klick darauf öffnet die Maßnahmenzeile mit vorgewählter Fassung „Kompromiss“.

**Was mit dem heutigen Parlament › Gesetzesvorhaben geschieht:**
- Die Kachelwand (Bild 006) entfällt.
- Die Suche wandert in die Politik-Ansicht als ein Suchfeld über den Bereichskreisen. Treffer sind Maßnahmen und Gesetzesnamen („Mietpreisbremse“ findet `m_mietdeckel`).
- „Auf dem Tisch“ (die ersten `GESETZGEBUNG.vorn` Vorhaben aus `gesetzesTisch`) wird im Bereichskreis zur Marke „Thema drängt“ (oranger Punkt) und im Eingang zu einer Zeile, wenn `akuteVorhaben(w)` (`sim/gesetzgebung.ts:312`) sie führt.
- Die Normenkontrolle (`laufendeVerfahren(w).gericht`) steht in der Tagesordnung.

**Was die Tagesordnung zeigt:** siehe Ansicht 3.2.

### 1.2 Die 17 Ministerien und die Zuordnung (Entscheidung W1)

**Recherchehinweis (vor dem Einbau belegen):** Der Präsidialerlass Nr. 1 vom 10.07.2018 (Cumhurbaşkanlığı Teşkilatı Hakkında CBK) schuf nach meiner Kenntnis **16** Ministerien. Die Zahl **17** entstand 2021: Das Ministerium für Familie, Arbeit und Soziales wurde in „Familie und Soziales“ und „Arbeit und Sozialversicherung“ geteilt, und „Umwelt und Städtebau“ bekam den Zusatz „Klima“. Die Zuordnung der Behörden (bağlı/ilgili/ilişkili kuruluşlar) steht im Präsidialerlass Nr. 4 (2018) und seinen Änderungen. Bitte am Text bei mevzuat.gov.tr prüfen, bevor die Liste und die Behördenzuordnung als Tatsache in die Daten gehen. Die Spalte „Behörden (real)“ unten ist **zu belegen**.

**Neue Amt-Kennungen** (`Figur["amt"]`, `sim/spiel-typen.ts`). Die vorhandenen Kennungen bleiben, damit alte Spielstände laden:

| # | Ministerium (de) | türkisch | `amt` | heute | Behörden (real, zu belegen) | Behörden im Spiel (`data/behoerden.ts`) |
|---|---|---|---|---|---|---|
| 1 | Justiz | Adalet | `justiz` | vorhanden | HSK (Vorsitz Minister), Strafvollzug | `justiz`, `sonderkammern` |
| 2 | Familie und Soziales | Aile ve Sosyal Hizmetler | `familie` | **neu** | – | – |
| 3 | Arbeit und Sozialversicherung | Çalışma ve Sosyal Güvenlik | `arbeit` | **neu** | SGK, İŞKUR | – |
| 4 | Umwelt, Städtebau und Klima | Çevre, Şehircilik ve İklim Değişikliği | `umwelt` | **neu** | TOKİ, İller Bankası | – |
| 5 | Äußeres | Dışişleri | `aussen` | vorhanden | Direktion für EU-Angelegenheiten | `diplomatie`, `vermittlung` |
| 6 | Energie und natürliche Ressourcen | Enerji ve Tabii Kaynaklar | `energie` | **neu** | BOTAŞ, MTA | – |
| 7 | Jugend und Sport | Gençlik ve Spor | `jugend` | **neu** | KYK (Stipendien, Wohnheime) | – |
| 8 | Finanzen | Hazine ve Maliye | `finanzen` | vorhanden | GİB, Privatisierungsverwaltung, (TÜİK, BDDK: Verhältnis prüfen) | `steuer`, `statistik`, `revision`, `datenabgleich` |
| 9 | Inneres | İçişleri | `inneres` | vorhanden | Polizei, Gendarmerie, AFAD, Migrationsverwaltung | `polizei`, `afad`, `grenzschutz`, `brennpunkte`, `mobile_teams`, `schwerpunkt` |
| 10 | Kultur und Tourismus | Kültür ve Turizm | `kultur` | **neu** | Stiftungsdirektion (Vakıflar) | – |
| 11 | Bildung | Millî Eğitim | `bildung` | **neu** | – (YÖK ist Verfassungsorgan, Art. 131) | `bildung` |
| 12 | Verteidigung | Millî Savunma | `verteidigung` | **neu** | Generalstab (seit 2018 dem Ministerium zugeordnet) | – |
| 13 | Gesundheit | Sağlık | `gesundheit` | **neu** | – | `gesundheit` |
| 14 | Industrie und Technologie | Sanayi ve Teknoloji | `industrie` (alias `wirtschaft`) | vorhanden als `wirtschaft` | TÜBİTAK, KOSGEB, Entwicklungsagenturen | – |
| 15 | Landwirtschaft und Forst | Tarım ve Orman | `landwirtschaft` | **neu** | DSİ, TAGEM | – |
| 16 | Handel | Ticaret | `handel` | **neu** | Zoll | – |
| 17 | Verkehr und Infrastruktur | Ulaştırma ve Altyapı | `verkehr` | **neu** | BTK, KGM, TCDD | – |
| – | Präsidialamt (kein Ministerium) | Cumhurbaşkanlığı | `stab` | vorhanden | Diyanet, Kommunikationsdirektion, MİT, SSB | `mit`, `cyber`, `schutzschirm`, `uebung`, `grenzlage` (prüfen) |
| – | Generalstab (Soldat, kein Minister) | Genelkurmay | `generalstab` | vorhanden | – | – |
| – | Zentralbank | TCMB | `zentralbank` | vorhanden | – | – |
| – | Bündnispartei, Opposition | – | `partner`, `opposition` | vorhanden | gehören ins Parlament, nicht ins Kabinett | – |

Die Behörden-Kennungen `sonderkammern`, `revision`, `datenabgleich`, `brennpunkte`, `mobile_teams`, `schwerpunkt`, `schutzschirm`, `uebung`, `grenzlage` und `vermittlung` sind in `data/behoerden.ts` laut `grep` Instrumente bzw. Unterkennungen. Ihre Zuordnung folgt der Mutterbehörde und ist beim Einbau am Feld `ressort` zu prüfen.

**Uneinheitliche Kennungen:** `data/behoerden.ts` nutzt `ressort: "praesidialamt"`, `sim/personen.ts` dagegen `amt: "stab"`. Eine Kennung (`stab`) für beides, `RESSORT_POSTEN` (`data/behoerden.ts:213`) wird angepasst.

**Maßnahmen je Ministerium** (alle 117 Maßnahmen aus `data/politiknetz.ts`, je genau ein Ministerium). Neues Feld `ressort: Amt` an `NodeSpec` oder eine Tabelle `MASSNAHME_RESSORT` in `data/ressorts.ts`. Das ersetzt `AmtDef.massnahmen` (`sim/personen.ts:42–99`):

| Ministerium | Maßnahmen | n |
|---|---|---|
| Justiz | m_justizreform, m_antikorruption, m_richterstellen, m_richterrat, m_haftvermeidung, m_urteilsumsetzung | 6 |
| Familie und Soziales | m_kindergeld, m_sozialhilfe, m_kinderbetreuung, m_gewaltschutz | 4 |
| Arbeit und Sozialversicherung | m_mindestlohn, m_renten, m_fruehrente, m_arbeitslosengeld, m_gewerkschaftsrechte, m_ausbildung, m_fachkraefteprogramm | 7 |
| Umwelt, Städtebau und Klima | m_umweltauflagen, m_co2_preis, m_bauindustrie, m_sozialwohnungen, m_mietdeckel, m_stadterneuerung, m_bauaufsicht, m_baukredite, m_bauamnestie, m_gebaeudeverstaerkung | 10 |
| Äußeres | m_eu_annaeherung (dazu die Diplomatie der Welt-Ansicht) | 1 |
| Energie und natürliche Ressourcen | m_energiesubventionen, m_solar_wind, m_kernkraft, m_gasfoerderung, m_netzausbau, m_lng_vertraege, m_regas_ausbau, m_gasspeicher, m_yeka_serie, m_sakarya_phase3, m_akkuyu_ppa, m_heimische_kohle, m_energieeffizienz, m_preiswahrheit, m_gashub, m_speicher_smartgrid | 16 |
| Jugend und Sport | m_stipendien | 1 |
| Finanzen | m_einkommensteuer, m_mwst, m_koerperschaftsteuer, m_kraftstoffsteuer, m_immobiliensteuer, m_steueramnestie, m_steuerfahndung, m_privatisierung, m_verwaltungsdigital, m_kreditgarantien, m_bankenaufsicht, m_versicherungspflicht | 12 |
| Inneres | m_polizei, m_polizeitechnik, m_fruehwarnsystem, m_afad_ausbau, m_versammlungsfreiheit, m_grenzschutz, m_integration, m_rueckkehr | 8 |
| Kultur und Tourismus | m_denkmalschutz, m_kulturfoerderung, m_archaeologie, m_tourismuswerbung | 4 |
| Bildung | m_lehrergehaelter, m_schulbau, m_religioese_schulen, m_berufsschulen, m_bildungstechnik, m_unigruendungen, m_wissenschaftsfreiheit | 7 |
| Verteidigung | m_verteidigung, m_wehrdienst, m_ruestungsindustrie, m_offiziersauswahl | 4 |
| Gesundheit | m_krankenhausbau, m_aerztegehalt, m_hausarzt, m_zuzahlungen, m_medizintechnik | 5 |
| Industrie und Technologie | m_investitionsanreize, m_kmu, m_industrie_modernisierung, m_forschung, m_regionalfoerderung | 5 |
| Landwirtschaft und Forst | m_agrarsubventionen, m_bewaesserung, m_staudaemme, m_wasserleitungen, m_saatgut, m_mechanisierung, m_agrarforschung | 7 |
| Handel | m_exportfoerderung, m_zoelle, m_preiskontrollen, m_handelssysteme | 4 |
| Verkehr und Infrastruktur | m_autobahnen, m_oepp_garantien, m_bahn, m_nahverkehr, m_breitband, m_smart_infrastruktur, m_instandhaltung, m_internetsperren | 8 |
| Präsidialamt | m_notstand, m_friedensprozess, m_digitale_oeffentlichkeit, m_medienaufsicht, m_staatsmedien, m_religionsbehoerde, m_minderheitenrechte | 7 |
| Generalstab | m_uebungen | 1 |
| **Summe** | | **117** |

**Fraglich und zu belegen:**
- `m_internetsperren`: Die Sperren laufen technisch über die BTK (Gesetz 5651). Politisch könnte man sie auch Präsidialamt oder Justiz zuordnen.
- `m_medienaufsicht`: Die RTÜK-Mitglieder wählt die TBMM. Hier steht sie beim Präsidialamt als politischem Träger.
- `m_mietdeckel`: Das Mietrecht steht im Obligationengesetz (Justiz).
- `m_wasserleitungen`: Gebaut wird von DSİ und den Kommunen bzw. der İller Bankası.
- `m_minderheitenrechte`: Die Zuordnung ist ausdrücklich offen.
- `m_bankenaufsicht`: Heute hängt sie am Amt `zentralbank` (`sim/personen.ts:63`). Die BDDK ist nicht die TCMB, darum wird sie verschoben.

**Datenlücke:** Für Jugend und Sport (1 Maßnahme) und Äußeres (1 Netzmaßnahme) hat das Netz kaum Hebel. Sportpolitik fehlt ganz. Vorschlag: Diese beiden Minister zeigen ihre Akte mit Behörden, Etat und Befehlen. Neue Maßnahmen gibt es erst nach einer Recherche, sie werden nicht erfunden.

**Politikbereiche → Leitministerium** (für das Porträt am Bereichskreis). „Mit“ heißt, dass Maßnahmen des Bereichs auch dort liegen:

| Thema (`Theme`) | Name | Leitministerium | mit |
|---|---|---|---|
| wirtschaft | Wirtschaft | Industrie und Technologie | Handel, Arbeit (Mindestlohn), Finanzen, Kultur und Tourismus |
| haushalt | Haushalt und Steuern | Finanzen | – |
| arbeit | Arbeit und Soziales | Arbeit und Sozialversicherung | Familie und Soziales |
| gesundheit | Gesundheit | Gesundheit | – |
| bildung | Bildung und Fachkräfte | Bildung | Jugend und Sport, Industrie und Technologie (Forschung) |
| wohnen | Wohnen, Bau und Erdbeben | Umwelt, Städtebau und Klima | Finanzen (Pflichtversicherung) |
| energie | Energie und Umwelt | Energie und natürliche Ressourcen | Umwelt, Städtebau und Klima |
| landwirtschaft | Landwirtschaft und Wasser | Landwirtschaft und Forst | – |
| infrastruktur | Infrastruktur und Verkehr | Verkehr und Infrastruktur | Industrie und Technologie (Regionalförderung) |
| sicherheit | Innere Sicherheit und Frieden | Inneres | Präsidialamt (Friedensprozess) |
| recht | Recht und Justiz | Justiz | Präsidialamt (Ausnahmezustand) |
| militaer | Streitkräfte | Verteidigung | Generalstab |
| kultur | Kultur und Erbe | Kultur und Tourismus | Präsidialamt (Minderheitenrechte) |
| gesellschaft | Medien und Gesellschaft | Präsidialamt | Familie (Gewaltschutz), Inneres (Versammlung), Verkehr (Internetsperren) |
| aussen | Außenpolitik und Migration | Äußeres | Inneres (Migration, Grenze), Handel (Zollsysteme) |

**Haushaltsposten → Ministerium** (`POSTEN[].amt` in `sim/haushalt.ts:108–147`). Diese Änderung schiebt Loyalitätsgewinne und -verluste bei Etatbeschlüssen auf andere Minister (`wende`, `sim/haushalt.ts:300–309`). Das ist eine sichtbare Regelfolge und gehört in ENTSCHEIDUNGEN:

| Posten | heute `amt` | neu | Anmerkung |
|---|---|---|---|
| rentenniveau, rentenalter | stab | arbeit | SGK |
| sozialhilfe | stab | familie | |
| gesundheit | stab | gesundheit | |
| bildung | stab | bildung | |
| forschung | wirtschaft | industrie | TÜBİTAK |
| verteidigung | generalstab | verteidigung | `ministerWunsch` (`sim/haushalt.ts:318`) prüft `p.amt === "generalstab"` für den doppelten Wunsch, das muss auf `verteidigung` umgestellt werden |
| innere_sicherheit | inneres | inneres | |
| investitionen | wirtschaft | **ressortübergreifend** | Datenlücke: Aufteilung nach Ressorts laut Investitionsprogramm (Yatırım Programı 2026) bzw. Tabelle A des Haushaltsgesetzes 2026 |
| wohnen | wirtschaft | umwelt | |
| landwirtschaft | wirtschaft | landwirtschaft | |
| umwelt_energie | wirtschaft | energie + umwelt | Datenlücke: Aufteilung offen; bis dahin ein Stück „Energie und Umwelt (zwei Ressorts)“ |
| kultur | stab | kultur | |
| justiz | justiz | justiz | |
| diplomatie | aussen | aussen | |
| personal | finanzen | **Öffentlicher Dienst** (kein Ressort) | Plan 4.1. Der Wunsch −1 bleibt beim Finanzminister |
| subventionen | wirtschaft | **ressortübergreifend** | Datenlücke |
| Steuern (einnahme) | finanzen | finanzen | |

**Ämter (`AEMTER`, `sim/personen.ts:42`) → neue Ordnung:**

| Amt heute | wird | `fach` (Leitgrößen) | Änderung |
|---|---|---|---|
| finanzen | Finanzen | unverändert | `massnahmen` laut Tabelle (+ m_kreditgarantien, m_bankenaufsicht, m_versicherungspflicht) |
| inneres | Inneres | + `protestdruck`? (nur falls Knoten vorhanden) | + m_fruehwarnsystem, m_afad_ausbau, m_integration, m_rueckkehr |
| aussen | Äußeres | unverändert | m_integration und m_grenzschutz fallen weg (gehen an Inneres), m_handelssysteme an Handel |
| justiz | Justiz | unverändert | + m_richterrat. m_antikorruption bleibt |
| stab | Präsidialamt | unverändert | Maßnahmen laut Tabelle |
| generalstab | Generalstab (Soldat) | bereitschaft_*, truppenmoral, offiziersvertrauen | bleibt Figur, aber **nicht** am Kabinettstisch, sondern als Gast. Maßnahmen bis auf m_uebungen gehen an Verteidigung |
| wirtschaft | Industrie und Technologie | investitionen, industrie | export → Handel, auslandskapital → Finanzen oder Handel (offen) |
| zentralbank | Zentralbank | unverändert | m_bankenaufsicht fällt weg |
| partner, opposition | Parlament | – | stehen nicht mehr unter „Verantwortliche“ (Bild 020) |
| – | 13 neue Ämter | `fach` = schlechteste Größen ihres Leitthemas aus `lageZeilen(w, theme)` (`ui/politik/bereiche.ts:174`) | `wirkung`: **leer bis zur Kalibrierung**. Die Werte d=0,06…0,12 der bestehenden Ämter sind Spielparameter, sie werden nicht ungeprüft kopiert |

**Wirkung auf das Politische Kapital (Regel, nicht stillschweigend ändern):** `kapitalEinkommen.kabinett = kabinettStatus(w).kapitalSumme` (`sim/spiel.ts:329`) summiert über alle Minister. Mit 17 statt 7 Ministern wüchse das Einkommen um mehr als das Doppelte. Vorschlag: `berechneMinisterKapital` (`sim/kabinett.ts:92`) wird mit 7/Ministerzahl gewichtet, damit die Summe gleich bleibt. Alternative: Gewichte nach Etatanteil. Das ist eine Entscheidung (offene Frage 2). Dasselbe gilt für `termineInfo` (`sim/gespraeche.ts:167`, 4 Termine in 30 Tagen bei jetzt 17 Ministern) und `kabinettStatus.disziplin`.

**Spielstand-Wanderung:** Alte Stände haben 7 Ministerfiguren. Nach dem Muster der `ZUSATZ_ROLLEN` in `sim/figuren.ts:37` werden die 13 neuen Figuren beim Laden mit einem **eigenen Zufallsstrom** erzeugt, damit der Hauptstrom gleich bleibt. `amt:"wirtschaft"` bleibt als Kennung und zeigt „Industrie und Technologie“. Namensvorrat: `NACHNAMEN` (`sim/figuren.ts:17`) hat 24 Einträge. Bei 17 Ministern, Generalstab, Zentralbank, Partei- und Nebenfiguren reicht das nicht. Er muss auf mindestens 60 türkische Nachnamen wachsen, sonst greift die Dopplungssperre in `name()` ins Leere. Vornamen sollen ebenfalls nicht doppelt sein (heute dreimal Cem).

### 1.3 Das gemeinsame Ressortrad

Eine Komponente `ui/wirtschaft/RessortRad.tsx`. Sie wird an drei Stellen genutzt: Haushalt Ebene 2 (Plan 4.2), Ministerakte und Eingang (Etatforderung eines Ministers).

- **Daten:** `POSTEN.filter(p => p.seite === "ausgabe" && ressortVon(p) === amt)`. Betrag je Stück: `etatBip(p, stufeVon(w, p.id))` × `staatsfinanzen(w).bip` / 100 (wie `radStuecke` in `ui/wirtschaft/HaushaltsRad.tsx:33`). Renten über `rentenSicht(w).etat`.
- **Stücke:** ein Stück pro Haushaltsposten des Ressorts, außen ein Ring mit den Behörden des Ressorts (`BEHOERDEN.filter(b => b.ressort === amt)`), deren Ausstattung als Punkte (Personal/Technik/Reichweite, `stand(w, id)` in `sim/behoerden.ts:67`).
- **Datenlücke (sichtbar):** Eine Aufteilung nach Ausgabenart (Personal, Betrieb, Investitionen, Programme) fehlt. Der Untertitel lautet „Aufteilung nach Haushaltsposten; Unterteilung nach Ausgabenart folgt mit der Quelle (Zentralhaushaltsgesetz 2026, Tabelle A)“. Hat ein Ministerium nur einen Posten (Justiz, Gesundheit, Bildung …), ist das Rad ein Vollkreis mit einem Stück. Das ist ehrlich, aber karg. Dann steht der Regler groß in der Mitte.
- **Regler je Stück:** Zeile mit −/+ und Stufe (`p.min…p.max`). Preis und Wirkung kommen aus `postenVorschau(w, id, stufe)` (`sim/haushalt.ts:256`) bzw. `haushaltsPostenEntscheidung` (`sim/haushaltsentscheidung.ts`). Gezeigt werden Kapital (0 im Haushaltsfenster), Mrd. ₺, Defizit vorher → nachher und die Loyalität des Ministers ±1. Im Fenster geht die Änderung in den Entwurf (`setzeEntwurf`), außerhalb als Nachtrag mit doppeltem Kapital (Regel wie heute).
- **Ressortübergreifende Posten** (investitionen, subventionen, personal) erscheinen in keinem Ministeriumsrad. Sie stehen nur im Gesamtrad als graue, benannte Stücke.

---

## Teil 2: Einstieg, Schreibtisch, Hauptmenü

#### Einstieg › Titel und Fortsetzen
1. **Frage und Erfolg:** „Weiterspielen oder neu?“ Erfolg: Nach 5 Sekunden weiß der Spieler, wo er stand (Datum, Zustimmung, Wahl in n Monaten) und klickt „Fortsetzen“.
2. **Aufbau (Zonen):** Wie Bild t01: Karte im Hintergrund, mittiger Rahmen 1000×630.
   - Z1 Siegel und Titel (oben, ~260 px)
   - Z2 Untertitel (40 px)
   - Z3 Knopfspalte 260 px breit (~250 px)
   - Z4 Fußzeile mit Datenstand (30 px)
   - Sprachwahl oben rechts.

   Alles passt auf einen Bildschirm.
3. **Inhalte je Zone:**
   - Z3a „Neues Spiel“ (Gold), führt zum Prolog `ui/Prologue.tsx`.
   - Z3b **Fortsetzen-Karte** statt Textknopf, 260×84. Inhalt: Porträt des Präsidenten (`world.player`, aus dem Spielstand nicht ohne Laden lesbar, deshalb neues Feld in `SpielstandInfo`), Name, Datum (`spielstandInfo().datum`), Zustimmung (`spielstandInfo().zustimmung` aus `snapshotVon`, `ui/speicher.ts:33`, ganze Zahl) und „Wahl in n Monaten“. **Datenlücke:** `SpielstandInfo` (`ui/speicher.ts:43`) kennt weder Porträt-Saat noch Wahltag. Neue Felder `portraet?: string`, `wahlInTagen?: number` werden beim Sichern geschrieben.
   - Z3c „Frühere Sicherungen (n)“ klappt `fruehereStaende()` (`ui/speicher.ts:321`) als Liste auf: Datum · Zustimmung · gesichert um.
   - Z3d „Aus Datei laden“ (`importiereSpielstandDatei`).
   - Z4 Datenstand und Kurzlizenz, Link „Quellen und Lizenzen“ öffnet `ui/quellen/Quellen.tsx` als Fenster.
4. **Zustände:**
   - Kein Spielstand: Z3b, Z3c und Z3d sind ausgeblendet, nur „Neues Spiel“ und „Aus Datei laden“ bleiben.
   - Spielstand mit `ende`: Die Karte zeigt „Amtszeit beendet · Rückblick“ und lädt den Rückblick.
   - Speicherfehler: `letzterSpeicherfehler()` erscheint als rote Zeile unter der Karte.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Sprache | Klick | Sprache wechselt, `ui/SprachWahl.tsx` | Titel |
| Neues Spiel | Klick | Rückfrage, falls ein Stand existiert („Ihr Stand vom 3. Februar 2030 bleibt unter Frühere Sicherungen“) | Prolog |
| Fortsetzen-Karte | Klick / Enter | `ladeSpielstand()` | Stand der Dinge |
| Frühere Sicherungen | Klick | klappt auf | Liste |
| Eintrag der Liste | Klick | `ladeRueck(key)` | Stand der Dinge |
| Aus Datei laden | Klick | Dateiauswahl, `importiereSpielstandDatei` | Stand der Dinge |
| Quellen und Lizenzen | Klick | Fenster `Quellen` | Titel (Fenster) |

6. **Übernommen / gelöscht:** `ui/App.tsx` (Titelblock um Zeile 139) wird umgebaut, `titel.fortsetzen_datum` wird zur Karte. Das Laden im Schreibtisch-Reiter „Spielstand“ (s4) entfällt (siehe Hauptmenü).
7. **Simulationsbedarf:** keiner. Nur `ui/speicher.ts` bekommt die Felder `portraet` und `wahlInTagen` in `SpielstandInfo` und `snapshotVon`.
8. **Texte:** „Fortsetzen · 3. Februar 2030“ entfällt. Neu: „3. Februar 2030 · 50 % · Wahl in 10 Monaten“. „Spielstand aus Datei laden“ wird zu „Aus Datei laden“.
9. **Abnahme:** keine Nachkommastelle auf der Karte; Höhe ≤ 1 Bildschirm; `test/speicher.test.ts` um die neuen Felder erweitern; ein Test „Titel ohne Spielstand zeigt keine Fortsetzen-Karte“.
10. **Aufwand und Abhängigkeiten:** S. Keine Vorbedingung.

#### Einstieg › Stand der Dinge
1. **Frage und Erfolg:** „Was wartet auf mich, seit ich weg war?“ Erfolg: Der eine Knopf führt direkt zur dringendsten Sache. Der Spieler sieht höchstens drei Dinge und ihre Frist.
2. **Aufbau (Zonen):** Fenster 640×520 über der Karte (heute 640×560, Bild t02).
   - Z1 Kopf mit Datum, Amtszeit und Wahlbalken (80 px)
   - Z2 „Seit Ihrem letzten Besuch“ (nur wenn sich etwas bewegt hat, 70 px)
   - Z3 „Drei Dinge, die warten“ (3 Zeilen à 64 px)
   - Z4 „Zuletzt beschlossen“ (≤ 3 Zeilen, nur wenn vorhanden)
   - Z5 Knopfleiste (60 px)
3. **Inhalte je Zone:**
   - Z1: `standDerDinge(w, vorsitzung)` (`ui/standderdinge.ts:107`): `datum`, `amtszeit`, `monateBisWahl`. Dazu ein Wahlbalken, der vom letzten Wahltag bis `spiel.wahltag` reicht (Zeitstrahl, Füllung = vergangene Zeit).
   - Z2: Kacheln Zustimmung, Inflation, Kapital mit Vergleich. **Fehler heute:** Verglichen wird mit dem Beginn der letzten Sitzung (`vorsitzungSnapshot()`, `ui/speicher.ts:553`). Liegt diese Sitzung am selben Spieltag, ist der Vergleich immer ±0. **Neu:** Als Vergleichsbasis gilt der *Spieltag*, nicht die Sitzung. Hat sich seit dem Snapshot das Spieldatum nicht geändert (`vorsitzung.tag === w.day`), entfällt Z2 ganz. Sonst steht „seit 1. Januar 2030: Zustimmung 52 → 50 (▼2)“. Der Zustimmungswert ist „Stab misst“ (R3) als ganze Zahl.
   - Z3: Die ersten drei Einträge aus `schreibtischArbeit(...).alle` (`ui/schreibtisch/arbeitsplatz.ts:30`). Das ist dieselbe Reihung wie der Eingang, nicht die heutige Mischung aus `laufendeVorgaenge` (Bauten) und `warnungen(w).slice(0,3)`. Je Zeile: Porträt bzw. Ikone, Titel, Fristbalken (`p.tage`, Füllung über 30 Tage), Ton als Farbe. Laufende Bauten erscheinen nur, wenn sie in den nächsten 30 Tagen fertig werden („F-16 Block 70 fertig in 4 Monaten“ gehört nicht hierher).
   - Z4: `abgestimmt` (schon vorhanden) als Zeilen „Angenommen · Gebäude-Verstärkungsprogramm · 366 : 234“.
   - Z5: Primärknopf „Weiter: \<Titel der dringendsten Sache\>“, sekundär „Zum Schreibtisch“, tertiär „Zur Karte“.
4. **Zustände:**
   - Leer (nichts wartet): Z3 zeigt „Nichts drängt. Nächster fester Termin: \<agenda\>“, der Primärknopf heißt „Zum Schreibtisch“.
   - Krise: Liegt ein Ereignis mit Frist ≤ 3 Tage an, wird Z3 rot umrandet und der Knopf öffnet das Ereignisfenster.
   - Krieg: Die erste Zeile ist immer der Kriegsvorgang.
   - Vor der Wahl (≤ 8 Wochen): Der Wahlbalken ist rot, darunter „Wahlkampf läuft“.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Weiter: … | Klick / Enter | öffnet die Sache: `p.sprung` (intern → Eingang mit offener Zeile; extern → Ziel; vorgang → Vorgang) | Eingang bzw. Ereignisfenster |
| Zeile in Z3 | Klick | wie oben für diese Zeile | Eingang |
| Zum Schreibtisch | Klick | schließt | Eingang |
| Zur Karte | Klick / Esc | schließt | Karte |
| Abstimmung in Z4 | Klick | öffnet den Verlauf an diesem Datum | Verlauf |

6. **Übernommen / gelöscht:** `ui/StandDerDingeBlatt.tsx` wird umgebaut. In `ui/standderdinge.ts` werden `deltas` und `laufendeVorgaenge` neu geschrieben, `probleme` (warnungen) entfällt zugunsten der Eingangsreihung. Bild t02.
7. **Simulationsbedarf:** keiner. `KennzahlenSnapshot` braucht `tag` (vorhanden, wird in `abgestimmt` genutzt).
8. **Texte:** „± 0 zuletzt 50,2“ entfällt. „Laufende Vorgänge“ wird zu „Was wartet“. „Dringendste Frist“ fällt weg, weil das jetzt Zeile 1 ist.
9. **Abnahme:** Kein Vergleich bei gleichem Spieltag (Test in `test/stand-der-dinge.test.ts`: Snapshot am selben Tag ergibt `deltas === null`). Die erste Zeile entspricht `schreibtischArbeit(...).alle[0]` (Test). Keine Nachkommastelle. Höhe ≤ 560 px.
10. **Aufwand und Abhängigkeiten:** S. Hängt vom Eingang ab (gleiche Reihung, vorhanden).

#### Einstieg › Ereignisfenster
1. **Frage und Erfolg:** „Was passiert, was kann ich tun, was kostet es?“ Erfolg: Alle Antworten sind ohne Scrollen sichtbar, jede mit Preis und höchstens drei Folgen als Ikonen.
2. **Aufbau (Zonen):** Fenster 1060×720 (heute 1050×800, Bild t03).
   - Z1 Kopfbild (140 px, heute 150)
   - Z2 links Sprecherspalte 220 px mit Porträt, Name, Rolle und **einem** Ratsatz
   - Z3 rechts Titel, Zitat (2 Zeilen) und „Worum es geht“ (3 Kacheln, 70 px)
   - Z4 **Antworten nebeneinander**, 2–4 Spalten gleicher Breite, je ~200 px hoch
   - Z5 Fußzeile mit Fristbalken und „Später entscheiden“

   Alles in der ersten Bildschirmhöhe.
3. **Inhalte je Zone:**
   - Z1: `EreignisSzene thema` (`ui/ereignis/Szenen.tsx`). Für Themen mit Ort (Zypern, Provinz) zeigt die Szene **eine Kartenkachel** des Orts statt Globus und leerer Fahnen. Quelle ist der Ortsbezug der Vorlage (zu prüfen: `ansicht.vorlage`/`szene`). Fehlt der Ort, bleibt die Szene.
   - Z2: `sprecherFuer(w, ansicht)` (`ui/ereignis/kontext.ts:82`). Vom Rat (`sprecher.rat.zeilen`) bleibt **eine** Zeile. Sätze mit Stufen und Kapitalrechnung („von Stufe 35 auf 55; das kostet 9 Kapital“) kommen ins ⓘ.
   - Z3: `kennzahlenFuer(w, thema, id)`. Zustimmung als Paar „Stab 50 % · Umfrage 54 % (Ekran, vor 2 Tagen)“ (R3), heute nur die Umfrage (`kontext.ts:154`).
   - Z4: `ansicht.optionen`. Je Karte: Titel, Preis-Marke (`anzeigePk ?? pk` Kapital, Geld in Mrd. ₺ statt „0,05 % des BIP“), höchstens drei Folgen als Ikone, Pfeil und Wort („Schulden ↑“, „Religiös-Konservative ↑“, „Streitkräfte ↑“). Die Zahl der Folge steht im Hover, als ganze Zahl. Bei mehr als drei Antworten scrollt Z4 waagrecht mit sichtbarem Pfeil am Rand. Die heutige Liste `ev2-optionen` mit abgeschnittener dritter Karte entfällt.
   - Z5: `fristAnteil` (vorhanden), Satz „Ohne Entscheidung in 12 Tagen: \<Standardfolge\>“ **mit Namen** der Standardoption.
4. **Zustände:**
   - 0 Kapital: Karten mit Preis sind grau und tragen „fehlt n Kapital“ (heute `knapp`, `EreignisFenster.tsx:69`).
   - Krieg: Kopfbild rot getönt.
   - Ein einziges Optionspaar: zwei Spalten à 50 %.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Antwortkarte | Klick | entscheidet sofort (wie heute). Bei Preis ≥ 5 Kapital oder Krieg eine Bestätigung in der Karte („Wirklich? 4 Kapital“) | Karte, Meldung |
| Antwortkarte | Hover / Fokus | Folgen mit Zahl und Verzögerung | – |
| Tasten 1–4 | Taste | wählt Karte n (vorher Kollision mit Tempo- und Ebenentasten prüfen, Plan 6) | – |
| Porträt | Klick | öffnet die Ministerakte im Hintergrund, das Fenster bleibt offen | Ministerakte |
| „Mehr dazu“ | Klick | klappt den Text auf | – |
| Später entscheiden | Klick / Esc | schließt, das Ereignis steht im Eingang | Karte |
| × | – | **entfällt** (doppelt mit „Später“) | – |

6. **Übernommen / gelöscht:** `ui/EreignisFenster.tsx` wird umgebaut (Optionsliste → Spaltenraster), `ui/ereignis/kontext.ts` (Zustimmungspaar), `ui/ereignis/Szenen.tsx` (Ortskachel). `ui/EventWindow.tsx`: prüfen, ob der Code noch genutzt wird, und ggf. löschen.
7. **Simulationsbedarf:** keiner. Für die Ortskachel muss die Vorlage eine Ortsangabe tragen. Wo es sie nicht gibt, ist das eine Datenlücke je Vorlage.
8. **Texte:** „Schulden +0,05 Prozentpunkte“ wird zu „Schulden ↑ (0,6 Mrd. ₺)“. Die Umrechnung `geldAusBip` existiert (`sim/haushaltsentscheidung.ts` nutzt sie). „Rat aus dem Ressort“ bleibt als Überschrift, mit höchstens einem Satz.
9. **Abnahme:** Bei 1440×900 sind alle Antworten von Ereignissen mit ≤ 3 Antworten ohne Scrollen sichtbar (Test in `test/ereignis-fenster.test.tsx` per Layoutprüfung oder Snapshot der Spaltenzahl). Keine Zahl mit zwei Nachkommastellen. Die Standardfolge ist benannt.
10. **Aufwand und Abhängigkeiten:** M. Die Tastenbelegung hängt von Plan 6 ab (Tasten 1–4).

#### Schreibtisch › Eingang
1. **Frage und Erfolg:** „Was muss ich heute entscheiden?“ Erfolg: Oben steht die dringendste Sache, offen, mit zwei bis drei Knöpfen samt Preis. Jede Sache steht **nur hier** als Entscheidung.
2. **Aufbau (Zonen):** Akteninhalt 1150×750.
   - Links Z1 **Liste** (760 px breit): Zeilen à 56 px; die offene Zeile ≤ 360 px.
   - Rechts Z2 **Kalenderstreifen** (360 px): 30 Tage als senkrechter Zeitstrahl mit Ikonen.
   - Z3 Fußleiste (40 px): „n weitere im Posteingang“.
   - Kein Kopf mit Kennzahlen (die obere Leiste reicht).

   Erste Bildschirmhöhe: die ersten 6 Zeilen und die offene Zeile.
3. **Inhalte je Zone:**
   - Z1 Liste: `schreibtischArbeit(w, tageslage(w), schreibtischMappe(w,5).mappe, gefaehrdeteZusagen(w)).alle` (heute `ui/schreibtisch/Schreibtisch.tsx`). **Neu dazu kommen:**
     - (a) Ereignisse, die mit „Später“ zurückgestellt wurden (heute Stage `spaeter`), als Zeile mit Frist. Ein Klick öffnet das Ereignisfenster.
     - (b) Ministervorschläge mit Maßnahmenbezug (G7), auch wenn sie heute in der Mappe stehen.
     - (c) Gesetzesfristen aus `regierungsVorgaenge(w)` nur dann, wenn eine Handlung möglich ist (Stimmen fehlen, Duldung läuft aus). Sonst stehen sie nur im Kalender.
   - Je Zeile:
     - Porträt (`Cameo` des Ministers) oder Ikone (Ereignis, Zusage, Vorgang)
     - Titel ≤ 60 Zeichen
     - Grund als eine Zeile
     - Fristbalken mit Text (R1, „in 9 Tagen“ / „überfällig“)
     - Ton-Punkt
   - Die offene Zeile zeigt `TischDetail` (vorhanden) **gekürzt**: Optionen als 2–3 Karten mit Preis am Knopf und einem „Entscheiden“ je Karte. Die Vorschau erscheint beim Darüberfahren bzw. Fokussieren, nicht erst nach „Antworten und Folgen vergleichen“ (Bild s1b). Regelsätze zu Groll und Beziehungspreis kommen ins ⓘ am Preisschild. Das Zitat des Ministers hat ganze Zahlen (heute „87,3“, `VorlageKarte.tsx`/`zahl()`; Indizes nach R1).
   - Z2 Kalender: dieselbe `fristen`-Liste wie heute (`Schreibtisch.tsx`, Aufbau aus `regierungsVorgaenge`, `faellig`, `termine`, Wahlkampfbeginn), aber **als Zeitstrahl**. Tage 0–30 senkrecht, Ikone je Termin (Waage = Abstimmung, Münze = Haushalt, Urne = Wahl, Globus = Wahl im Ausland). Ausländische Wahlen (`termine` mit `weich`) sind kleiner und grau. Darunter klein „Aufmerksamkeit 100 · Belastung 12“ (aus `verfassungSicht`, `briefing.ts:253`) mit ⓘ.
   - Wegfallen im Eingang:
     - Kopf-Kennzahlen (`KENNZAHLEN`, Zustimmung, Kapital, Mehrheit, Preise sind doppelt zur Leiste)
     - Ausklapper „In Arbeit“ und „Rückblick“ (gehen in den Verlauf bzw. in die Ministerakte)
     - Epochenband (geht in den Verlauf)
     - Mentorin-Block (wird zum ⓘ-Knopf in der Leiste)
     - Türen „Alle Vorlagen und Befehle“ und „Heute: Was jetzt ansteht“ (doppelt)
     - Der Krisenrat (`Krisenrat`) wandert in die Wirtschaftsakte. Er bleibt hier nur dann als Zeile, wenn eine Krise aktiv ist.
4. **Zustände:**
   - Leer: „Nichts liegt auf dem Tisch. Nächster Termin: …“ und ein Knopf „Zeit laufen lassen“.
   - Krise: Krisenzeile oben, rot.
   - Krieg: Kriegsvorgang immer an Platz 1.
   - Vor der Wahl: Der Wahltag steht im Kalender als großer roter Strich.
   - 0 Kapital: Knöpfe mit Preis sind grau und tragen „fehlt n“. Eine Zeile „Kapital: nächster Zufluss am 1. März (+10)“ zeigt `kapitalEinkommen(w).summe`/`naechste`.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Zeile (intern) | Klick | klappt auf bzw. zu (nur eine offen) | Eingang |
| Zeile (extern/vorgang) | Klick | springt (↗) | Zielansicht |
| Porträt in Zeile | Klick | Ministerakte | Kabinett › Ministerakte |
| Optionskarte | Hover / Fokus | Vorschau der Folgen | – |
| Entscheiden · n Kapital | Klick | entscheidet, Zeile verschwindet, nächste öffnet sich | Eingang |
| ⓘ am Preis | Klick | Regeltext | Popover |
| Kalendereintrag | Klick | springt zum Vorgang (Tagesordnung, Haushalt, Wahl) | Zielansicht |
| n weitere | Klick | Posteingang (`ui/minister/Posteingang.tsx`) als Seitenleiste | Eingang |
| Taste ↑/↓, Enter | Taste | bewegt die Auswahl, öffnet | – |

6. **Übernommen / gelöscht:**
   - Bleiben: `ui/schreibtisch/Schreibtisch.tsx` (Liste, `TischDetail`) und `arbeitsplatz.ts`.
   - Entfallen: `SchreibtischInArbeit`, `SchreibtischRueckblick` und `EpochenBand` aus dem Eingang. Die beiden ersten gehen in Verlauf bzw. Ministerakte, das Epochenband in den Verlauf.
   - `ui/minister/Mappe.tsx` und `VorlageKarte.tsx` werden auf Kartenform mit Preis am Knopf umgebaut.
   - Reiter Chronik, Berichte, Spielstand und Quellen der Schreibtisch-Akte (s2–s5) entfallen.
   - Bilder s1, s1b. Der Ministerfall erscheint nicht mehr in Parlament (007) und Ministerrat (015).
7. **Simulationsbedarf:**
   - `schreibtischArbeit` nimmt zurückgestellte Ereignisse auf. Dafür braucht es eine neue Quelle in der Simulation statt UI-Zustand (`spaeter` liegt heute in Stage). Neues Feld `spiel.zurueckgestellt: { id, frist }[]`. Prüfen, ob die Ereignisschlange (`sim/ereignisse.ts`) das schon führt.
   - Vorschläge ohne Wirkung werden gefiltert (G7).
8. **Texte:** „Auf dem Tisch 8“ wird zu „Zu entscheiden · 8“. „Erst vergleichen, dann entscheiden …“ entfällt. „Groll“ und „Beziehungspreis“ kommen nur im ⓘ vor, mit Erklärung. „1,0 Kapital“ wird zu „1 Kapital“.
9. **Abnahme:**
   - Eine Ministerangelegenheit (z. B. `rv-*`, `ra-*`) erscheint in keiner anderen Ansicht als Entscheidung (Test: Rendern von Halbrund, Kabinettstisch und Politik enthält ihren Titel nicht als Knopf).
   - Die offene Zeile ist ≤ 360 px hoch.
   - Kein Wert der oberen Leiste wird wiederholt.
   - `test/schreibtisch-arbeitsplatz.test.tsx`, `schreibtisch-lage-aktuell.test.tsx` und `schreibtisch-briefing.test.ts` anpassen (Kopfkennzahlen und Türen entfallen).
10. **Aufwand und Abhängigkeiten:** M. Vorbedingung: Ministerakte (für Porträtklick) und Verlauf (für das Ausgelagerte).

#### Schreibtisch › Verlauf
1. **Frage und Erfolg:** „Was ist passiert, und hat es gewirkt?“ Erfolg: Eine Kurve der Amtszeit mit Punkten. Ein Klick auf einen Punkt zeigt Vorher/Nachher und führt zur Maßnahme zurück.
2. **Aufbau (Zonen):**
   - Z1 Zeitleiste (1150×300): Zustimmungskurve über die ganze Amtszeit mit Ereignispunkten darauf, Wahltage als senkrechte Linien.
   - Z2 Filterleiste (40 px): Ikonen Ereignis · Gesetz · Bericht · Wirtschaft · Außen · Personen.
   - Z3 links Liste der Punkte im sichtbaren Ausschnitt (420 px breit), rechts Z4 Detail des gewählten Punkts (700 px).

   Erste Bildschirmhöhe: Z1, Z2 und die ersten 5 Einträge.
3. **Inhalte je Zone:**
   - Z1 Kurve: `spiel.umfrage.verlauf` (`{monat, wert}`, genutzt in `ui/akte/Bereiche.tsx:376`), ganze Amtszeit. **Achse 0–100 oder 30–70 mit markiertem Achsenbruch.** Die heutige Achse 50–52 (`VerlaufsDiagramm`) entfällt. Linie bei 50 („Mehrheit im Volk“ wie in `ui/Chronik.tsx`). Zweite, gestrichelte Linie für die veröffentlichten Umfragen, wo vorhanden (`institutsReihe`, `sim/medien.ts`).
   - Punkte kommen aus `world.log` (`LogEntry` mit `kind`, `abstimmung`, `day`, `date`, `text`, `why`).
     - Gesetze (`l.abstimmung`): Farbe angenommen/abgelehnt.
     - Wirkungsberichte (`spiel.berichte`, Typ `Bericht` in `sim/berichte.ts:110`): Farbe nach `phase` (wirkt = grün, gemischt = gelb, gegenlaeufig = rot, zu_frueh = grau).
     - Ereignisentscheidungen.
     - Historische Momente aus `epochenSicht(w).momente` (`sim/epoche.ts`).
   - Mehrere Punkte im selben Monat stapeln sich zu einer Zahl im Kreis.
   - Z3 Liste: Datum, Ikone, Titel. **Ohne** den doppelten Titel im Text (Bild s2: „Rentner fordern Ausgleich: …“ zweimal). Text = `bericht.kurz` bzw. `l.text`; der Titel wird abgeschnitten, wenn er den Text wiederholt.
   - Z4 Detail:
     - Bericht: `BerichtAkte` (`ui/politik/BerichtAkte.tsx`) gekürzt auf je Größe (`bericht.groessen`) ein Vorher/Nachher-Balkenpaar mit ganzen Zahlen, Phase als Wort, Umsetzungsstand (`reife`). „Was der Bericht nicht sagen kann“ steht nur noch als ⓘ.
     - Ereignis: gewählte Antwort und Folgen.
     - Gesetz: Ja/Nein als Mini-Halbrund.
   - Laufende Beschlüsse („In Arbeit“, heute `SchreibtischInArbeit`): kleiner Block über Z3, „Läuft: Gebäude-Verstärkungsprogramm 26 → 40, noch etwa 4 Jahre“, Quelle `umsetzungsStand`/`restMonate` (`sim/umsetzung.ts`). Das ersetzt Parlament › Umsetzung (Bild 008).
4. **Zustände:**
   - Erster Monat: „Noch kein Verlauf. Die Kurve beginnt mit Ihrer ersten Umfrage.“
   - Viele Punkte (> 200): Z1 zeigt Monatsbalken statt Einzelpunkten.
   - Nach der Wahl: Amtszeiten werden durch eine dicke Linie getrennt, beschriftet „2. Amtszeit“.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Punkt auf der Kurve | Klick | wählt den Eintrag, Z3 scrollt dorthin, Z4 zeigt das Detail | Verlauf |
| Punkt | Hover | Datum und Titel | – |
| Kurve ziehen / Mausrad | Ziehen | Ausschnitt verschieben bzw. zoomen | – |
| Filterikone | Klick | an/aus | – |
| Listeneintrag | Klick | wie Punkt | Verlauf |
| „Maßnahme nachjustieren“ (im Berichtdetail) | Klick | öffnet die Maßnahmenzeile mit offener Prüfzeile | Politik |
| Ministername im Detail | Klick | Ministerakte | Kabinett |

6. **Übernommen / gelöscht:**
   - `ui/Chronik.tsx` (Kurve und Liste) und `ui/politik/BerichtAkte.tsx` (Detail) gehen hierin auf.
   - Aus `SchreibtischRueckblick` stammen die Zeitung („Ausgabe lesen“ als Link zur Medienakte) und die Ziele (als Ausklapper unter Z1). `EpochenBand` wird über Z1 als Band „Ihre Epoche: heroisch · +12“ gezeigt.
   - `UmsetzungAkte` (`ui/politik/UmsetzungAkte.tsx`) wird in Teilen übernommen.
   - Entfallen: Schreibtisch › Chronik (s2), Schreibtisch › Berichte (s3), Parlament › Umsetzung (008), Gesetzesbilanz (012), Regierungsbilanz (019) und alle `VerlaufAnsicht`-Reiter (`ui/akte/Bereiche.tsx:394`).
7. **Simulationsbedarf:** keiner. Eine reine Lesefunktion `verlaufsPunkte(w)` in `sim/chronik.ts` führt Log, Berichte und Momente zusammen (mit Test).
8. **Texte:** „Wirkungsbericht:“ als Präfix entfällt (die Ikone sagt es). „Gemischte Bilanz“ wird zu „wirkt teilweise“ mit Farbe. Die Unterscheidung kommt aus `phase`, nicht aus `urteil`.
9. **Abnahme:** Die y-Achse umfasst mindestens 20 Punkte. Jeder Bericht ist genau einmal als Punkt da (Test über `verlaufsPunkte`). Kein Satz wiederholt den Titel. Höhe ≤ 1,3 Bildschirme. `test/berichte.test.ts` und `berichte-neu.test.ts` bleiben, die UI-Tests für Chronik werden neu geschrieben.
10. **Aufwand und Abhängigkeiten:** M–L. Keine Vorbedingung.

#### Hauptmenü (≡) › Spielstand, Datei, Quellen, KI
1. **Frage und Erfolg:** „Wie sichere oder lade ich, woher kommen die Daten, wie stelle ich die KI ein?“ Erfolg: Alles Technische liegt hinter ≡ oben rechts, nichts davon in einer Akte.
2. **Aufbau (Zonen):** Das vorhandene Menü (`KopfMenue`, `ui/kopf/Kopfleiste.tsx:182`) bleibt eine Tafel mit Einträgen: Sichern (Strg+S) · Spielstände … · Ton · Sprache · KI-Berater … · Quellen und Lizenzen · Zum Titel. „Spielstände …“, „KI-Berater …“ und „Quellen …“ öffnen ein **Fenster** (900×640) mit drei Reitern Spielstände | KI | Quellen. Das ist eine Ebene.
3. **Inhalte je Zone:**
   - Reiter Spielstände: `SpeicherDossier` (`ui/SpeicherDossier.tsx`) gekürzt.
     - Oben: „Aktueller Stand · 3. Februar 2030 · 50 %“ mit Knöpfen „Jetzt sichern“, „Als Datei sichern“ (ohne „.json“) und „Datei laden“.
     - Mitte: „Frühere Sicherungen“ (`fruehereStaende()`).
     - Unten: fünf feste Plätze, als Raster 5×1 mit leeren Plätzen als „＋“. Die Notiz erscheint erst nach Klick (heute fünf Zeilen mit Eingabefeld, Bild s4).
     - **Fehler:** „Weitester Stand“ steht auch dann da, wenn er älter ist als der aktuelle Stand. Behebung siehe Fehlerliste F14.
   - Reiter KI: `KiEinstellungen` (`ui/KiEinstellungen.tsx`) unverändert. Der Hinweis „Regelwerk · KI nicht eingerichtet“ aus dem Gespräch (Bild 016) steht nur hier.
   - Reiter Quellen: `Quellen` (`ui/quellen/Quellen.tsx`). **Kontrastfehler:** Die Farben in `ui/quellen/quellen.css` (#cdb98f, #a89a80, #d8c69a … in Zeilen 15–74) sind für dunklen Grund gewählt, stehen aber auf Pergament. Neu werden die Tokens des Pergaments verwendet (Text ≥ 4,5:1).
4. **Zustände:** Speicherfehler: ≡ trägt einen roten Punkt (vorhanden), der Reiter Spielstände zeigt den Grund. Keine früheren Sicherungen: Der Abschnitt entfällt.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| ≡ | Klick / Esc | Tafel auf/zu; **hält die Zeit an** (Plan 6) | – |
| Sichern | Klick / Strg+S | `speichere(w)` | – |
| Spielstände … | Klick | Fenster, Reiter Spielstände | Menüfenster |
| Laden (Eintrag) | Klick | Rückfrage, dann `ladeRueck`/`ladeSlot` | Stand der Dinge |
| Platz n „＋“ | Klick | Notizfeld und Sichern | – |
| Als Datei sichern | Klick | `exportiereSpielstandDatei` | Download |
| KI-Berater … | Klick | Reiter KI | Menüfenster |
| Quellen … | Klick | Reiter Quellen | Menüfenster |
| Attributionstext kopieren | Klick | Zwischenablage | – |
| Zum Titel | Klick | Rückfrage („Ihr Stand ist gesichert“) | Titel |

6. **Übernommen / gelöscht:** `SpeicherDossier.tsx`, `KiEinstellungen.tsx` und `quellen/Quellen.tsx` werden wiederverwendet. Es entfallen die Schreibtisch-Reiter Spielstand (s4) und Quellen (s5) sowie das Akten-Ziel `speicher` in `Stage.tsx`.
7. **Simulationsbedarf:** keiner.
8. **Texte:** „Als Datei sichern (.json)“ wird zu „Als Datei sichern“. „Feste Speicher-Slots (1 bis 5)“ wird zu „Eigene Plätze“.
9. **Abnahme:** In keiner Akte steht ein Lade-, Sicher- oder Quellenknopf (Test über die Navigation: `test/aktennavigation.test.tsx`). Der Quellentext erreicht Kontrast ≥ 4,5:1 (`test/quellen.test.tsx` um eine Farbprüfung erweitern oder die Tokens prüfen). „Weitester Stand“ ist nie älter als der aktuelle Stand (Test in `test/speichern.test.ts`).
10. **Aufwand und Abhängigkeiten:** S.

---

## Teil 3: Politik

Die Politik ist **eine Ansicht** mit drei Stufen im selben Bild: Bereichskreise → Maßnahmentafel (Seitenfeld) → Wirkungsbild (in der offenen Zeile). Es gibt keine Reiter.

#### Politik › Bereichskreise
1. **Frage und Erfolg:** „Wo brennt es im Land?“ Erfolg: Ein Blick zeigt 15 Kreise. Die roten mit Ring sind sofort als Brennpunkte erkennbar, der größte rote Kreis ist das wichtigste Problem.
2. **Aufbau (Zonen):**
   - Z1 Suchfeld und Legende (1150×44).
   - Z2 **Kreisfeld** (links 640×700, wenn eine Tafel offen ist; sonst 1150×700): 15 Kreise in fester Anordnung nach `BEREICH_THEMEN` (`ui/politik/bereiche.ts:25`). Gruppiert sind sie in drei Bänder: „Was Menschen spüren“ (wirtschaft, haushalt, arbeit, gesundheit, bildung, wohnen), „Land und Versorgung“ (energie, landwirtschaft, infrastruktur), „Staat und Welt“ (sicherheit, recht, militaer, kultur, gesellschaft, aussen).
   - Z3 rechts **Maßnahmentafel** (500×700), sobald ein Kreis gewählt ist (siehe nächste Ansicht).
3. **Inhalte je Zone:**
   - Kreis: Ikone (`ui/politik/embleme.tsx`) und Name (`themeName`).
   - **Größe:** Bevölkerungsanteil, den die akuten Probleme des Bereichs berühren (Summe `ProblemZeile.last`, `problemeIn`). Ohne akutes Problem hat der Kreis die Mindestgröße.
     - **Datenlücke/Entscheid:** Democracy 4 skaliert nach Wählerzahl, hier gibt es keine „Betroffenen je Bereich“. Vorschlag: `max(last)` der Probleme, mindestens 0,15 (Anzeigeregel, kein Messwert).
   - **Farbe:** `ampel` aus `bereichKurz(w, theme)` (`ui/politik/bereiche.ts:308`): grün, gelb oder rot.
   - **Ring:** ein roter Ring je akutem Problem (`akut`, höchstens 3 Ringe).
   - **Punkt:** orange, wenn ein Vorhaben des Katalogs drängt (`akuteVorhaben`), blau, wenn etwas läuft (`laufend > 0`).
   - **Porträt** des Leitministeriums (Tabelle 1.2) klein an der Kreiskante, mit Loyalitätsring.
   - Hover: Tooltip mit `ampelGrund` und den drei `signale` (Name, ganze Zahl, Richtung nach R2).
   - Z1: Suchfeld über Maßnahmen-, Größen- und Gesetzesnamen (`GESETZESVORHABEN` → `t("gesetz.v.<id>.titel")`). Ein Treffer öffnet Kreis und Zeile.
   - Kriegsgefahr-Band (Bild 002) wird zu einer Marke am Kreis „Streitkräfte“ (rot pulsierend), wenn ein Konflikt > 65 (`krisenFuerMassnahme`/Konfliktlage). Der Regeltext „Endet, wenn …“ steht im ⓘ.
4. **Zustände:**
   - Alles ruhig: alle Kreise grün, Hinweis „Kein Bereich verlangt Aufmerksamkeit“.
   - Krise: Kreise mit gesperrten Maßnahmen (`blocker.art === "gesperrt"`) tragen ein Schloss.
   - Krieg: Der Kreis Streitkräfte steht in der Mitte.
   - 0 Kapital: keine Änderung am Bild, die Tafel zeigt die Preise grau.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Kreis | Klick | wählt den Bereich, die Tafel öffnet sich rechts, der Kreis wird hervorgehoben | Politik (Tafel) |
| Kreis | Hover | Tooltip | – |
| Ring (akutes Problem) | Klick | Karte mit Problemebene `problemId` (heute „Auf der Karte ansehen“) | Karte |
| Porträt am Kreis | Klick | Ministerakte | Kabinett |
| Suchtreffer | Enter | Kreis und Zeile offen | Politik |
| „Vollnetz“ (Knopf rechts oben) | Klick | `NetView` im Vollbild (`ui/NetView.tsx`) | Netz (Vollbild) |
| Esc | Taste | schließt die Tafel | Politik |

6. **Übernommen / gelöscht:**
   - `ui/politik/Politik.tsx` wird umgebaut: Die Reiter Bereiche, Vorschläge und Wirkungsnetz entfallen. Die Logik `alleBereiche`, `bereichKurz` und `vorschlaegeIn` bleibt.
   - Entfallen: Kachelwand und linke Liste (Bild 002), Vorschläge-Reiter (003; Vorschläge gehen in den Eingang und als Marke an die Zeile), Wirkungsnetz-Reiter (004; wird Wirkungsbild und Vollnetz-Knopf).
   - `ui/politik/VorschlagKarte.tsx` entfällt als Liste. Die Marke steht in `MassnahmenTafel`.
7. **Simulationsbedarf:** keiner (Anzeigeregeln für Größe und Farbe stehen in `ui/politik/bereiche.ts`).
8. **Texte:** Die Zählkacheln „7 angespannt / 4 Achtung / 4 ruhig / 10 akute Probleme“ entfallen. „Kriegsgefahr. …“ steht nur noch als Marke. Die Ampelworte bleiben (ruhig, Achtung, angespannt).
9. **Abnahme:**
   - 15 Kreise auf einem Bildschirm ohne Scrollen.
   - Keine Liste der Bereiche zusätzlich zum Bild.
   - Farbe = `ampel` (Test in `test/politik-bereiche.test.ts`: Kreisgröße monoton in `last`).
   - `test/politik-akten-ui.test.tsx` wird für die neue Ansicht neu geschrieben.
10. **Aufwand und Abhängigkeiten:** M. Vorbedingung für das Porträt ist 1.2 (Ministerien), sonst wird es ausgeblendet.

#### Politik › Maßnahmentafel (Seitenfeld) und Wirkungsbild (in der Zeile)
1. **Frage und Erfolg:** „Was kann ich in diesem Bereich tun, was kostet es, was bewirkt es?“ Erfolg: Alle Maßnahmen des Bereichs stehen als Zeilen mit Regler. Wer zieht, sieht Preis, Mehrheit, Dauer, Haushalt und die Wirkungspfeile an der Zeile und bringt das Gesetz dort ein.
2. **Aufbau (Zonen):** Seitenfeld 500×700 rechts neben dem Kreisfeld.
   - Z1 Kopf (80 px): Bereichsname, `ampelGrund`, Leitminister.
   - Z2 Lage (≤ 120 px): 3–6 Größen aus `lageZeilen(w, theme)` als Balken mit ganzer Zahl und Richtung (R2).
   - Z3 Zeilen (Rest, scrollt im Feld): je Maßnahme 44 px. Die offene Zeile wächst auf ≤ 420 px (Prüfzeile mit Wirkungsbild).
3. **Inhalte je Zone:**
   - Z2: `lageZeilen` (`ui/politik/bereiche.ts:174`), `bewertung` als Farbe, `delta` seit Amtsantritt als ▲▼ mit Zahl.
   - Z3 Zeile, wie `MassnahmenTafel` (`ui/politik/MassnahmenTafel.tsx`, schon umgebaut):
     - Name.
     - Stufe heute (`skala`/`naechsteStufe`, bei Prozentstufen nur „60“ statt „Stufe 60“).
     - Regler −/Schieber/+ (`stufenVon`).
     - Kleiner Strich der Marke „Ministervorschlag“ an der vorgeschlagenen Stufe (G7).
     - Laufend-Marke: im Parlament „Abstimmung in n Tagen“ oder Umsetzungsbalken `umsetzung.stand`/`rest`.
     - Schloss bei `blocker.gesperrt`, „teurer ×1,5“ bei `blocker.teuer`.
     - Rechts klein der Ressort-Kopf (Porträt 20 px) laut Tabelle 1.2.
   - Offene Zeile = **Prüfzeile** (heute `Pruefzeile`):
     - (a) **Fassungsknöpfe** (G2), wenn ein Katalogeintrag existiert.
     - (b) **Wirkungsbild**: links Ursachen (eingehende Kanten `NET.edges.filter(e => e.to === id)`, höchstens 3), Mitte die Maßnahme, rechts Wirkungen (ausgehende Kanten, die vier stärksten wie in `zielKanten` in `sim/berichte.ts:173`). Die Pfeildicke entspricht |weight|, die Farbe gut/schlecht nach R2 und Vorzeichen, ein Uhrsymbol steht für `lag` in Monaten. Die Beschriftung ist ganz (keine Überlappung: SVG mit fester Zeilenhöhe 22 px, Text abgeschnitten mit Tooltip). Das ersetzt den kaputten Block „Was folgt daraus?“ (Bild 004b).
     - (c) **Fakten**: Kapital, Mehrheit („348 erwartet, nötig 301“ bzw. „fehlen 12“), Dauer, Haushalt in Mrd. ₺ **und** % BIP. Quelle ist `gesetzesPrognose` (G3).
     - (d) **Dafür/Dagegen** (G4) als Ikonenreihen.
     - (e) **Wo** (nur wenn `akuteOrte(w, id)` (`sim/handeln.ts:715`) etwas liefert): Umschalter „ganzes Land · nur wo akut (n Provinzen)“. Die Provinzauswahl erfolgt auf der Karte („Provinzen wählen“ öffnet die Karte mit Mehrfachwahl). Die Listen „Region ▾“ und „Provinzen ▾“ (Bild 004) entfallen.
     - (f) Knöpfe: „Einbringen · n Kapital“, „Als Erlass · n Kapital · Gericht p %“ (G5) und „Verwerfen“. „Genauer einstellen“ entfällt (es führte ins Wirkungsnetz).
4. **Zustände:**
   - Maßnahme im Parlament: Regler gesperrt, Prüfzeile zeigt „Abstimmung in 12 Tagen · 348 Ja erwartet“ und „Zurückziehen“ (`zieheGesetzZurueck`, `sim/handeln.ts:634`).
   - Ruhe nach Annahme (G6): Knopf gesperrt mit Grund.
   - 0 Kapital: Einbringen grau, „fehlt n Kapital“.
   - Vor der Wahl: keine Änderung (keine neue Regel).
   - Krise: Schloss und Grund aus `blocker.titel` in einem Satz (heute bis zu 80 Zeichen Rohtext).
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Regler / −/+ | Ziehen / Klick | wählt die Zielstufe, die Prüfzeile öffnet sich | Zeile |
| Fassungsknopf | Klick | setzt die Stufe auf die Fassung | Zeile |
| Vorschlagsmarke | Klick | setzt die Stufe auf den Vorschlag | Zeile |
| Wirkungspfeil | Hover | `e.why` als Satz, Verzögerung | – |
| Wirkungsziel (Größe) | Klick | wechselt zum Bereich dieser Größe, die Zeile der stärksten Maßnahme ist markiert | Politik |
| Einbringen | Klick | `bringeVorhabenEin` (mit Katalog) bzw. `bringeEin` | Zeile zeigt Rückmeldung; Tagesordnung bekommt einen Eintrag |
| Als Erlass | Klick | dito mit `weg:"erlass"` | Zeile |
| Zurückziehen | Klick | Rückfrage mit Kapitalrückgabe | Zeile |
| Porträt (Ressort) | Klick | Ministerakte | Kabinett |
| „Provinzen wählen“ | Klick | Karte mit Mehrfachwahl, „Übernehmen“ führt zurück | Karte → Zeile |
| Verwerfen / Esc | Klick | Prüfzeile zu | Tafel |

6. **Übernommen / gelöscht:**
   - Bleiben: `ui/politik/MassnahmenTafel.tsx` (Kern), `ui/politik/bereiche.ts` (`massnahmenZeilen`, `lageZeilen`).
   - Neu: Wirkungsbild-Komponente `ui/politik/Wirkungsbild.tsx`. Sie nutzt `NET.edges`, nicht `NetGraph`.
   - Entfallen: `ui/NetNavigator.tsx` als Reiter (die Navigation wird zur Suche), die Mentorin-Unterreiter „Erklärt / Weltvergleich / Was tun?“ (der Weltvergleich kommt als ⓘ an die Zeile, `ui/VergleichBalken.tsx` wird wiederverwendet) und `ui/gesetze/Gesetzesvorhaben.tsx` als Ansicht (G1).
7. **Simulationsbedarf:**
   - `gesetzesPrognose` (G3).
   - Fassungszuordnung freier Stufen (G3, Entscheid).
   - `ressortVon(massnahmeId)` (Tabelle 1.2).
   - Keine neuen Spielwerte.
8. **Texte:**
   - „Stufe 80 → Stufe 80“ erscheint nie, die Prüfzeile öffnet sich erst bei einer Änderung (das macht `setze` schon).
   - „Landesdurchschnitt 80,0 (Index 0–100 …)“ wird zu „heute 80 · bei Amtsantritt 50“.
   - „262 Knoten · 1.022 Verbindungen“ entfällt.
   - Gesetzesnamen kommen aus dem Katalog.
9. **Abnahme:**
   - Jede Zeile mit Regler zeigt nach einer Änderung Kapital, Mehrheit und Haushalt (Test).
   - Die Mehrheitszahl in der Prüfzeile ist gleich der Zahl in der Tagesordnung nach dem Einbringen ± Fristveränderung (Test: `gesetzesPrognose` vs. `gesetzPrognose`).
   - Das Wirkungsbild hat keine überlappenden Textrahmen (Test über Bounding-Boxen im DOM-Test oder feste Zeilenhöhen).
   - Höhe der offenen Zeile ≤ 420 px.
   - `test/gesetzgebung.test.ts` erweitern (Fassung aus freier Stufe), `test/politik-akten-ui.test.tsx` neu.
10. **Aufwand und Abhängigkeiten:** L. Vorbedingung ist der Entscheid G3 (Variante A/B).

---

## Teil 4: Parlament

Das Parlament hat drei Ansichten (Halbrund, Tagesordnung, Justiz) und einen seltenen Dialog (Verfassung). Der Aktenkopf zeigt nur noch Titel und **eine** Zeile „Lager 328 von 600 · nötig 301“. Die Kennzahlen „Gesetze im Verfahren“ und „Unabhängige Justiz“ entfallen dort, sie stehen in den Ansichten. Die Reiter Mehrheitslage, Gesetzesvorhaben, Umsetzung, Behörden, Gesetzesbilanz und Politische Akteure entfallen (Bilder 005, 006, 008, 011, 012, 013).

#### Parlament › Halbrund (Start)
1. **Frage und Erfolg:** „Habe ich eine Mehrheit, und wen muss ich gewinnen?“ Erfolg: Halbrund mit 301-Linie. Ein Klick auf einen Parteiblock zeigt, was die Partei will und was Duldung oder Koalition kostet.
2. **Aufbau (Zonen):**
   - Z1 links Halbrund (640×420) mit großer Zahl „328 · Lager“ und Balken Lager/Duldung/Opposition mit 301-Strich (heute in `ParlamentKopf`).
   - Z2 rechts Parteiliste (480×420): Zeile je Fraktion mit Farbe, Name, Sitze, Rolle und Bereitschaft als Ring.
   - Z3 unten Seitenleiste **Parteikarte** (öffnet sich rechts über Z2, 480×700).
   - Z4 unten links (640×280) „Letzte Abstimmungen“ (3 Zeilen) und „Duldung läuft aus“ (wenn ja).
3. **Inhalte je Zone:**
   - Z1: `Sitzplan` aus `ui/parlament/Halbrund.tsx`, Daten `parlamentsLage(w)` (`ui/parlament/lage.ts:45`): `lager`, `duldung`, `opposition`, `gesamt`.
   - Z2: `parlamentsLage(w).fraktionen` (`partei`, `name`, `sitze`, `rolle`, `farbe`). Die Spalte `anteil` (Stimmanteil, `parl.shares`) wird **beschriftet** als „Wahl 2028: 35,7 %“ oder entfällt. Die Bereitschaft kommt aus `fraktionsUebersicht(w)` (`sim/verhandeln.ts:83`): `bereitschaft`, `wort`.
   - Z3 Parteikarte, Daten `FraktionSicht`:
     - `vorsitz` (Porträt, Name, Haltung; bei Opposition **nicht** „Loyalität“, sondern „Bereitschaft“ aus `bereitschaft`, R7)
     - `ausrichtung` als Satz
     - `forderung` als Satz „will: …“
     - `zusagenziel` als Mini-Regler „Mindestlohn 50 → 70“ mit Link zur Maßnahmenzeile
     - `duldungBis` als Fristbalken
     - `aktionen` (`AktionSicht`, Arten `gespraech`, `zugestaendnis`, `duldung`, `koalition`, `abwerben`) als Knöpfe mit Preis. Ausführung über `verhandle(w, partei, aktion, rng)` (`sim/verhandeln.ts:200`)
     - `FraktionsAbkommen` (`ui/parlament/FraktionsAbkommen.tsx`) wird wiederverwendet
   - Z4: Log-Einträge mit `abstimmung` (letzte 3) und `auslaufend` aus `stimmenPrognose` (`sim/handeln.ts:618`).
4. **Zustände:**
   - Mehrheit fehlt: Die 301-Linie ist rot, die Zahl „fehlen 12“ ist groß.
   - Duldung läuft in ≤ 30 Tagen aus: Der Block der duldenden Partei pulsiert, die Zeile steht oben in Z4.
   - Wahl: Nach der Wahl zeigt das Halbrund für eine Woche die Verschiebung (vorher/nachher, `ui/wahl/Wahlabend.tsx` nutzt dasselbe).
   - Krieg: unverändert.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Parteiblock im Halbrund | Klick | Parteikarte | Halbrund (Seitenleiste) |
| Parteizeile | Klick | Parteikarte | dito |
| Parteiblock | Hover | Sitze, Rolle, Bereitschaft | – |
| Vorsitz-Porträt | Klick | Gespräch (`sprichMitFigur`, `sim/gespraeche.ts:808`) als Szene `ui/personen/GespraechSzene.tsx` | Gespräch (Fenster) |
| Aktionsknopf (Duldung …) | Klick | `verhandle`, Rückmeldung in der Karte | Parteikarte |
| Zusagenziel | Klick | Maßnahmenzeile | Politik |
| Letzte Abstimmung | Klick | Verlauf an diesem Datum | Verlauf |
| Reiter Tagesordnung | Klick | – | Tagesordnung |

6. **Übernommen / gelöscht:**
   - Wiederverwendet: `ui/parlament/Halbrund.tsx`, `ParlamentKopf.tsx` (Kopf und Liste), `FraktionsAbkommen.tsx` und die Verhandlungslogik aus `ui/Beschlussbuch.tsx` (Teil „parlament“, Zeilen um 136–176).
   - Aus Bild 007 entfallen: Ministerfälle (Turan, Karaca), „Versorgung auf der Tagesordnung“ (geht in die Tagesordnung), „Monatsbericht“, „Was Ihre Entscheidungen bewirken“, „Ihre Entscheidungen im Vergleich“ und „Warum die Parteien reagieren“ (als ⓘ an der Parteikarte).
   - Die Personenkarten aus 013 gehen in die Parteikarte auf.
7. **Simulationsbedarf:** keiner.
8. **Texte:** „Lager, Mehrheit steht“ wird zu „Lager · 328 von 600“. „Haltung: abtrünnig (24)“ beim Oppositionsführer wird zu „Bereitschaft: gering“.
9. **Abnahme:**
   - Duldung/Koalition erscheinen je Partei genau einmal (heute doppelt).
   - Keine Ministerangelegenheit in dieser Ansicht.
   - Höhe ≤ 1 Bildschirm.
   - `test/parlament.test.ts` und `parlament-prognose.test.tsx` anpassen.
10. **Aufwand und Abhängigkeiten:** M.

#### Parlament › Tagesordnung
1. **Frage und Erfolg:** „Was wird wann abgestimmt, und reicht es?“ Erfolg: Jede Vorlage hat einen Ja-Balken an der 301-Linie (bei der Verfassung 360/400), dazu die Abstimmung in n Tagen und eine Handlung, wenn es knapp ist.
2. **Aufbau (Zonen):**
   - Z1 Zeitstrahl (1150×70): die nächsten 60 Tage mit einer Marke je Abstimmung.
   - Z2 Liste (1150×Rest): eine Zeile je Vorlage, 72 px hoch, sortiert nach Abstimmungstag.
   - Z3 unten „Beim Verfassungsgericht“ (Normenkontrolle, nur wenn vorhanden).
   - Erste Bildschirmhöhe: bis zu 8 Vorlagen.
3. **Inhalte je Zone (Datenquellen je Art):**

| Art | Quelle | Ja-Prognose | Schwelle | Handlungen |
|---|---|---|---|---|
| Gesetz aus Maßnahme | `spiel.gesetze` (`Gesetz`, `sim/spiel-typen.ts:10`), Name `g.name` (Katalog: „Mindestlohngesetz · Kompromiss“) | `gesetzPrognose(w, g)` (`sim/handeln.ts:613`): `heuteJa`, `ja` am Votum, `fristDelta`, `auslaufend` | 301 | `stimmenKaufen(w, g.id, n)` (`handeln.ts:648`), `zieheGesetzZurueck` |
| Haushaltsgesetz | `spiel.wirtschaft.haushalt.gesetz`, `haushaltsGesetzSicht(w)` (`sim/haushalt.ts:545`) | dito (`stimmenPrognose`) | 301 | `haushaltsStimmenKaufen` (`haushalt.ts:584`), Link zum Haushalt |
| Versorgungsvorlage | `spiel.gueter.regierung.vorlagen` mit `status:"offen"`, `versorgungsStimmen(w, v, v.abstimmung)` (`sim/versorgungsmehrheit.ts:48`), Hindernis `versorgungsVorlageHindernis` | Summe `ja` | 301 | Link zur Wirtschaftsakte (Inventar) |
| Verfassungspaket | `spiel.verfassungsvorgang` (`VerfassungsZustand`), `paketStimmen(w, paket, absprachen)` (`sim/verfassung.ts:462`) | `erwartet` (tief–hoch als Spanne) | 360 / 400 | `verfassungStimmenKaufen`, `zieheVerfassungZurueck` |
| Normenkontrolle | `laufendeVerfahren(w).gericht` (`sim/gesetzgebung.ts:465`) | – | – | keine; Wahrscheinlichkeit `p` als Zahl, Urteil in n Tagen |

   - Diese Übersicht führt schon heute `regierungsVorgaenge` (`ui/schreibtisch/arbeitsplatz.ts:91`) für Haushalt, Versorgung und Programme. Die Tagesordnung nutzt eine gemeinsame neue Funktion `tagesordnung(w)` in `sim/tagesordnung.ts`. Sie fasst die fünf Quellen zusammen, und der Kalender des Eingangs liest dieselbe Funktion.
   - Zeile:
     - Titel
     - Art-Ikone
     - Balken 0–600 mit Ja-Anteil (grün bis 301, darüber dunkelgrün), Strich bei 301 (360/400), Spanne tief–hoch schraffiert
     - Text „348 Ja erwartet · Abstimmung 17. März (in 12 Tagen)“
     - Wenn `fristDelta ≠ 0`: „bis dahin −9 (Duldung der YENİ endet am 10. März)“
     - Knöpfe nur bei Bedarf: „Stimmen sichern · n Kapital“ (`mehrheitsSicht.kosten`), „Zurückziehen“
   - Programme ohne Abstimmung (`votum:false` in `regierungsVorgaenge`) gehören **nicht** in die Tagesordnung, sondern in die Wirtschaftsakte.
4. **Zustände:**
   - Leer: „Keine Vorlage im Parlament. Gesetze bringen Sie in der Politik ein.“ mit Link.
   - Knapp: Zeile gelb, Knopf „Stimmen sichern“.
   - Verloren: rot mit „aussichtslos“ (`aussichtslos`) und nur „Zurückziehen“.
   - Am Abstimmungstag: `AbstimmungsKarte` (`ui/parlament/AbstimmungsKarte.tsx`) wie heute als Animation.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Zeile | Klick | klappt auf: Fraktionen mit erwarteter Stimme (Mini-Halbrund) | Tagesordnung |
| Stimmen sichern | Klick | Rückfrage mit Preis, dann kaufen | Zeile |
| Zurückziehen | Klick | Rückfrage (Kapitalrückgabe laut `zieheGesetzZurueck`) | Zeile |
| Titel (Gesetz) | Klick | Maßnahmenzeile | Politik |
| Titel (Haushalt) | Klick | Haushalt | Wirtschaft |
| Titel (Verfassung) | Klick | Verfassungsdialog | Dialog |
| Zeitstrahl-Marke | Klick | scrollt zur Zeile | – |

6. **Übernommen / gelöscht:** Übernommen werden `ui/parlament/GesetzesPrognoseHinweis.tsx` und die Ja-Balken aus `Beschlussbuch.tsx:175–176`. Es entfallen die Gesetzesvorhaben-Kachelwand (006) und der Abschnitt „Beschlüsse“ von 008 (geht in den Verlauf).
7. **Simulationsbedarf:** `tagesordnung(w)` als reine Lesefunktion, mit Test, dass sie dieselben Zahlen liefert wie `gesetzPrognose` und `haushaltsGesetzSicht`. Keine Regeländerung.
8. **Texte:** „Mehrheit steht“ entfällt. Nur „knapp“ und „fehlt“ erscheinen als Wort, sonst die Zahl.
9. **Abnahme:**
   - Jede offene Abstimmung des Spiels erscheint genau einmal (Test: Gesetz + Haushalt + Versorgung + Verfassung).
   - Die Zahl ist gleich der Zahl in der Maßnahmenzeile (G3).
   - Höhe ≤ 1,3 Bildschirme bei 8 Vorlagen.
10. **Aufwand und Abhängigkeiten:** M. Vorbedingung: G3.

#### Parlament › Justiz
1. **Frage und Erfolg:** „Wie unabhängig und leistungsfähig ist die Justiz, und was kann ich ändern?“ Erfolg: Ein Punktebild der Gerichte und darunter 4–6 Zeilen mit Regler und Preis.
2. **Aufbau (Zonen):**
   - Z1 links Punktebild „Besetzung der Gerichte“ (560×260).
   - Z2 rechts vier Tachos bzw. Balken (560×260): Unabhängigkeit, Effizienz der Verfahren, Haftbelegung, Befolgung von Urteilen.
   - Z3 Zeilen der Justizmaßnahmen (1150×300).
   - Z4 Ausklapper „Einrichtungen und Gerichtsapparat“.
3. **Inhalte je Zone:**
   - Z1: `reichZustand(w).sitze` (Felder `loyal`, `reform`, `unabhaengig`; heute `Sitze` in `ui/Reich.tsx:318`). Punktfarben loyal = rot, reformorientiert = braun, unabhängig = gold, mit Legende und Zahl.
   - Z2: Netzgrößen `justiz_unabhaengigkeit`, `justiz_effizienz`, `haftueberfuellung`, `urteilsbefolgung` (Ämterfach Justiz, `sim/personen.ts:74`). Die Werte kommen aus `wertVon(w, id)` (`sim/personen.ts:236`), als ganze Zahl. Darunter je eine echte Messgröße, wo vorhanden. Heute stehen dort „17 Richter je 100.000 Einwohner, Schnitt 22“, „Strafgerichte 228 Tage (2024)“ und „etwa 142 % Belegung“. Quelle sind die `GROESSEN.recht` in `ui/reich/Groessen.tsx` bzw. `data/reich`. Sie behalten ihre Quellenangabe.
   - Z3: `massnahmenZeilen(w, "recht")` mit `MassnahmenTafel` (dieselbe Komponente wie in der Politik, Bereich „recht“) ohne m_notstand (Präsidialamt; erscheint im Bereich „recht“ mit Porträt Präsidialamt).
   - Z4:
     - Einrichtungen (`Institutionen`, `ui/Reich.tsx:~453`) und die Behörde `justiz` mit Instrument (`ui/behoerden/Instrument.tsx`) in Zeilenform „Gerichtsapparat · Personal ●●○○○ · Ausbau · Preis“.
     - Vorteile des Bereichs (`VorteileListe`, `ui/Reich.tsx:399`).
     - **Die Baureihenfolge entfällt hier.** Heute rendert `ui/Reich.tsx:553` die `Baureihenfolge` in **jeder** Lage-Ansicht. Sie gehört in die Verwaltung bzw. die Bauleiste der Land-Akte.
     - Auch die Kopfbalken „Verwaltungskraft / Baukapazität“ entfallen hier.
4. **Zustände:**
   - Straßburg-Druck hoch (`strassburg_druck` ≥ 60): rote Marke an Z2.
   - Ausnahmezustand aktiv (`m_notstand` > 0): Banner „Ausnahmezustand · seit …“ mit Link zum Präsidialamt.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Punkt (Richter) | Hover | Gericht und Ausrichtung | – |
| Gruppe „Verfassungsgericht“ | Klick | Maßnahme m_richterrat bzw. die Verfassungsvariante „Besetzung“ (Dialog) | Zeile / Dialog |
| Tacho | Klick | Bereich „recht“ in der Politik mit Zeile der stärksten Maßnahme | Politik |
| Zeile | wie Maßnahmentafel | – | – |
| Behörde „Ausbau“ | Klick | Behördeninstrument | Ausklapper |
| Justizministerin (Porträt im Kopf) | Klick | Ministerakte | Kabinett |

6. **Übernommen / gelöscht:**
   - Übernommen und umgebaut: `ui/Reich.tsx` (Bereich `recht`), Teile `Sitze`, `Institutionen` und `VorteileListe`.
   - Es entfallen der Unterreiter „Lage / Reformen und Vorhaben“ (Bild 010), der Behördenreiter des Parlaments (011) und „Was den Bau beschleunigt“.
7. **Simulationsbedarf:** keiner.
8. **Texte:** „Ausnahmerecht 10“ wird zu „Ausnahmezustand: keiner“. „Druck aus Straßburg 57“ bekommt ⓘ „EGMR-Urteile, die die Türkei nicht umgesetzt hat (Spielgröße)“.
9. **Abnahme:** Keine Bau- oder Rüstungsprojekte in dieser Ansicht (Test in `test/reich-ui.test.tsx`: `Baureihenfolge` nur im Bereich `haushalt`). Höhe ≤ 1,3 Bildschirme.
10. **Aufwand und Abhängigkeiten:** S–M.

#### Parlament › Verfassungsdialog (selten)
1. **Frage und Erfolg:** „Bekomme ich 360 oder 400 Stimmen für mein Paket?“ Erfolg: Ein Bildschirm. Wer eine Variante wählt, sieht die Zählung im Mini-Halbrund springen.
2. **Aufbau (Zonen):** Fenster 1150×720.
   - Z1 links Tafel (760×640): 6 Zeilen (Artikel), je drei Segmentknöpfe.
   - Z2 rechts fest (360×640): Mini-Halbrund mit erwarteter Zahl, Spanne tief–hoch, Linien 360 und 400. Darunter Kosten, Gericht und Referendum, dann „Einbringen“.
   - Z3 Fuß: Regelsatz in einer Zeile mit ⓘ.
3. **Inhalte je Zone:**
   - Z1: `ARTIKEL` (`sim/verfassung.ts:125`): Je Artikel `name`, `frage` (als Tooltip) und `varianten` als Segmente. Aktiv ist `verfassungAktiv(w, id)`, gesperrt `artikelSperre(w, id)` (Schloss mit Monaten). Je Segment eine kleine Marke „+55“ bzw. „−52“ für die Stimmenänderung gegen den Status quo. Rechenweg: `paketStimmen` mit und ohne die Variante.
   - **Parteien:** Die Variantentexte nennen Parteien aus einer festen Liste (`parteien` je Variante, `sim/verfassung.ts:144ff`: AKP, MHP, YRP, CHP, DEM, İYİ, YENİ, Zafer). Angezeigt werden **nur Parteien mit Sitzen** (`w.parliament.seats[p] > 0`). Heute nennt Bild 009 CHP, İYİ, Yeniden Refah und Zafer, die im Halbrund nicht vorkommen.
   - Z2: `paketStimmen(w, paket)` (`erwartet`, `tief`, `hoch`, `fraktionen[]`). Die Hürden kommen aus der Konstante (`mehrheit: 360`, `direkt: 400`, `sim/verfassung.ts:50–51`). `pruefeVerfassung` liefert Kapital und Gründe, `aymSicht` (`:708`) das Gerichtsrisiko, `ReferendumPrognose` (`:751`) die Volksabstimmung, `paketSalienz` (`:765`) die Wählergruppen, die es spüren.
   - Z3: „Eine Verfassungsfrage je Amtszeit · bis zu fünf Artikel · gescheiterte Artikel 12 Monate gesperrt“.
4. **Zustände:**
   - Schon genutzt in dieser Amtszeit: Dialog nur lesend, „Nächste Möglichkeit: nach der Wahl“.
   - Paket im Parlament: Z2 zeigt die Tagesordnungszeile mit „Stimmen sichern“.
   - Paket beim Gericht bzw. im Referendum: Fortschritt.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Knopf „Verfassungsänderung vorbereiten“ (in Halbrund/Tagesordnung, nur wenn erlaubt) | Klick | öffnet den Dialog | Dialog |
| Segment | Klick | wählt die Variante, Z2 rechnet neu | Dialog |
| Segment | Hover | Variantentext und Parteien mit Sitzen | – |
| Einbringen · n Kapital | Klick | `bringeVerfassungEin` | Tagesordnung |
| Schließen / Esc | Klick | Entwurf bleibt (lokal) | vorherige Ansicht |

6. **Übernommen / gelöscht:** `ui/Verfassung.tsx` (`VerfassungWerkstatt`) wird zur Tafel umgebaut. Es entfällt der Reiter Verfassung (Bild 009, 4.270 px).
7. **Simulationsbedarf:** keiner. **Kommentarfehler:** `sim/verfassung.ts:7–8` und `:451–453` sprechen noch von 301/360. Feldnamen `lueckeMehrheit`/`lueckeDirekt` gegen `VERFASSUNG.mehrheit/direkt` prüfen und Kommentare berichtigen.
8. **Texte:** „Der bisherige Stand.“ steht nur noch als Marke „bisher“ am Segment. Die Variantentexte bleiben kurz (ein Satz).
9. **Abnahme:** Höhe = 1 Bildschirm. Keine Partei ohne Sitze im Text (Test). Die Zählung in Z2 ist gleich `paketStimmen` (Test). `test/verfassung.test.ts` bleibt.
10. **Aufwand und Abhängigkeiten:** M.

---

## Teil 5: Kabinett

Zwei Ansichten: **Kabinettstisch** (Start) und **Verwaltung**. Die Ministerakte ist der Drill-down aus dem Tisch. Es entfallen Handlungsfähigkeit (014), Ministerrat als Vorlagenliste (015), Gespräch als Reiter (016; wird schwebender Berater), Behörden (018; gehen in die Ministerakte), Regierungsbilanz (019) und Verantwortliche (020; das ist der Tisch).

#### Kabinett › Kabinettstisch
1. **Frage und Erfolg:** „Wer in meinem Kabinett macht Ärger, und wer will etwas von mir?“ Erfolg: 17 Porträts um einen Tisch. Rote Ringe, Abzeichen und Blitze zeigen sofort, wo es brennt.
2. **Aufbau (Zonen):**
   - Z1 Tisch (1150×560): Oval mit 17 Ministerplätzen. Am Kopf der Präsident, daneben Präsidialamt (Stabschefin). Gäste am Rand sind Generalstab und Zentralbank (kleiner, mit Etikett „nicht im Kabinett“).
   - Z2 Leiste unter dem Tisch (1150×120): Kabinettssitzung (beschlussfähig/fällig, `sitzungMoeglich`, `tageBisSitzung`), Gesprächstermine „2 von 4 frei in 30 Tagen“ (`termineInfo`), Rücktrittsgefahr (Namen), Kapital aus dem Kabinett (`kapitalSumme`, ganze Zahl) und Disziplin (`disziplin`).
   - Z3 Seitenleiste **Ministerakte** (öffnet sich rechts über dem Tisch, 520×720), siehe unten.
3. **Inhalte je Zone:**
   - Z1 Platz je Minister, Daten aus `kabinettStatus(w).minister` (`MinisterPosten`, `sim/kabinett.ts:19`):
     - Porträt (`PersonPortraet`)
     - **Ring** = `stimmung` (treu/loyal/skeptisch/kritisch/meuternd → 5 Farben)
     - Name
     - Ressort (kurz)
     - **Abzeichen** = Zahl offener Angelegenheiten. Gezählt werden Einträge aus `schreibtischArbeit(...).alle`, deren `sprung` auf dieses `amt` zeigt, plus Mappe-Vorlagen mit `v.minister.id`.
     - **Blitz**, wenn in `ruecktrittGefahr`
     - „kommissarisch“ als graue Schärpe (`kommissarisch`)
     - Auftrag läuft: kleines Uhrsymbol (`auftragStatus`)
   - Sitzordnung: nach Etatgröße des Ressorts (aus dem Ressortrad) im Uhrzeigersinn. Das ist eine Anzeigeregel.
   - Z2: `kabinettStatus(w)`: `schnittLoyalitaet` (ganze Zahl, **kein** zweites Mal „49“ und „49 %“), `kapitalSumme`, `disziplin`/`disziplinText`, `tageBisSitzung`. Das Tableau „Termine 0 von 4 · Ihre Zeit ist knapp“ entfällt (Widerspruch). Neu steht dort „Gesprächstermine: 4 frei“ (`max − belegt`).
4. **Zustände:**
   - Rücktrittswelle: Blitze, und Z2 zeigt „Rücktritt droht: …“ rot.
   - Kommissarische Besetzung: Platz grau.
   - Nach einer Entlassung: leerer Stuhl mit „Nachfolge wählen“ (`ui/personen/NachfolgeAuswahl.tsx`).
   - Vor der Wahl: unverändert.
   - Krieg: Generalstab rückt an den Tisch (neben den Präsidenten).
   - Ohne Spiel (`!w.spiel`): Hinweis.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Porträt / Platz | Klick | Ministerakte | Tisch (Seitenleiste) |
| Porträt | Hover | Ressort, Stimmung, Sorge (`sorge`), Kapitalbeitrag | – |
| Abzeichen | Klick | Eingang, gefiltert auf diesen Minister | Schreibtisch |
| Leerer Stuhl | Klick | Nachfolgewahl | Fenster |
| „Kabinettssitzung einberufen“ (Z2) | Klick | `bereiteKabinettssitzungVor` → `MinisterratSaal` als Szene | Sitzung (Fenster) |
| Generalstab / Zentralbank | Klick | ihre Akte (Generalstab: Befehle und Bereitschaft; Zentralbank: Link zu Wirtschaft › Geld & Lira) | Seitenleiste / Wirtschaft |
| „Machtkreis“ (kleiner Knopf Z2) | Klick | `ui/personen/Machtkreis.tsx` als Fenster | Fenster |

6. **Übernommen / gelöscht:**
   - Übernommen: `ui/Personen.tsx` (Reiterleiste `kabinett|umfeld|machtkreis|zusagen` entfällt), `ui/personen/MinisterratSaal.tsx` (als Sitzungsszene, nicht als Seite), `Machtkreis.tsx` (als Fenster), `NachfolgeAuswahl.tsx`.
   - Gespräche & Umfeld (`ui/personen/Umfeld.tsx`) gehen in die Ministerakte, der Reiter Zusagen (`ZusagenAnsicht.tsx`) in den Eingang (gefährdete) und in die Parteikarte (Zusagen an Parteien).
   - Entfallen: Bilder 014, 015, 019, 020.
   - Der Chat (`ui/Chat.tsx`, Bild 016) wird ein schwebender Knopf „Berater“ (Porträt Präsidialamt) unten rechts in allen Ansichten.
7. **Simulationsbedarf:** 17 Ministerämter (1.2), Gewichtung des Kabinettskapitals (offene Frage 2), Nachnamensvorrat. `kabinettStatus` muss mit 17 Ministern laufen (Leistung prüfen: `berechneMinisterKapital` je Monat).
8. **Texte:** „Haltung: verlässlich (61)“ wird zu Ring und Wort aus `stimmungVon` (R7), die Zahl steht nur im Hover. „Verantwortliche“ entfällt.
9. **Abnahme:**
   - 17 Plätze sichtbar ohne Scrollen bei 1440×900.
   - Keine Vorlage als Karte auf dem Tisch (nur Abzeichen).
   - Kein Wert doppelt (Loyalität einmal).
   - `test/kabinett.test.ts` (17 Minister), `test/personen-ui.test.tsx` und `test/personen.test.ts` anpassen.
10. **Aufwand und Abhängigkeiten:** L. Vorbedingung ist 1.2 (Ämter, Spielstandwanderung).

#### Kabinett › Ministerakte (Seitenleiste, Drill-down vom Tisch, von Porträts überall, vom Haushaltsrad)
1. **Frage und Erfolg:** „Was macht dieses Ministerium, was will der Minister, wo gibt es sein Geld aus, und was kann ich ihm befehlen?“ Erfolg: Kopf mit Person, Ressortrad mit Kürzen/Aufstocken, Leitgrößen, Befehle. Alles in einer Leiste.
2. **Aufbau (Zonen):** Seitenleiste 520×720, scrollt innen.
   - Z1 Kopf (120 px): Porträt, Name, Ressort, Stimmung (Ring und Wort), Fähigkeit und Ehrgeiz als Worte (`leistungWort`, `ehrgeizWort`, `sim/personen.ts:200/215`), Wunsch („will …“, `figur.ziel`).
   - Z2 **Ressortrad** (520×260, Komponente 1.3).
   - Z3 Leitgrößen (≤ 140 px): `lageIm(w, f)` (`sim/personen.ts:245`) als Balken, `schlechtesteGroesse` hervorgehoben.
   - Z4 Offene Angelegenheiten (≤ 3 Zeilen mit Link in den Eingang).
   - Z5 Befehle (Ausklapper).
   - Z6 Behörden (Ausklapper).
   - Z7 Gespräch und Erinnerungen (Ausklapper).
   - Z8 Fuß: Entlassen bzw. Umbilden.
3. **Inhalte je Zone:**
   - Z2: Ressortrad, Stücke = Posten mit `ressortVon(p) === f.amt` (1.2), Behördenring. Je Stück ein Regler (`postenVorschau`), mit Kapital, Mrd. ₺, Defizit und Loyalität ±1. Ohne Posten (Äußeres hat nur `diplomatie`, Jugend und Sport hat **keinen** eigenen Posten) zeigt Z2 „Kein eigener Haushaltsposten im Spiel“. **Datenlücke:** Etat des Ministeriums laut Haushaltsgesetz 2026, Tabelle A. Die Zahl wird nicht erfunden.
   - Z3: Leitgrößen. Ein Klick führt zur Politik mit dem Bereich des Leitthemas.
   - Z4: aus `schreibtischArbeit(...).alle` gefiltert nach Amt, dazu `ressortAnliegen` (`RessortAnliegenKarten`) und Vorfälle. **Hier wird nicht entschieden, nur verlinkt** (eine Entscheidung, ein Ort).
   - Z5: `befehlAngebote(w, figurId)` (`sim/minister-befehle.ts:78`), `befehlVorschau` (`:130`) mit `verweigerungsChance` (`:66`) als %. `laufendeBefehle` (`:356`). Ausführung `erteileBefehl` (`:227`). UI aus `ui/minister/BefehlBlatt.tsx`.
   - Z6: `BEHOERDEN.filter(b => b.ressort === amt)`. Je Behörde eine Zeile mit Punkten für Personal, Technik und Reichweite (`stand(w, id)`), „Etat knapp“ (`sim/behoerden.ts:130`) sowie Ausbau/Kürzen über `ui/behoerden/Instrument.tsx` mit Preis. Was eine Stufe bringt, steht als Wirkung aus `BehoerdeDef.wirkung` (`data/behoerden.ts:30`).
   - Z7: `GespraechSzene` und `planeGespraech`/`ansaetzeFuer` (`sim/gespraeche.ts:346/475`), Termine `termineInfo`. Erinnerungen `erinnerungen(f)` (`sim/personen.ts:148`) als letzte 3 Sätze.
   - Z8: `entlasseFigur` (`sim/eingriffe.ts:106`), `umbildungErsetzen/Behalten/Entlassen` (`sim/amtszeit.ts:314ff`) mit Preis. Bei `entlassbar:false` gibt es keinen Knopf.
4. **Zustände:**
   - Minister kommissarisch: Kopf grau mit „Nachfolge wählen“.
   - Meuternd: Kopf rot, Z8 oben.
   - Haushaltsfenster offen: Regler im Rad wirken auf den Entwurf, mit Marke „Entwurf 2031“.
   - 0 Kapital: Befehle und Nachträge grau.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Radstück | Klick | Zeile mit Regler hervorgehoben | Akte |
| Regler | Ziehen | Vorschau | Akte |
| „Übernehmen · n Kapital“ | Klick | `haushaltsPostenEntscheidung`/`setzeEntwurf` | Akte |
| Behörde im Ring | Klick | Behördenzeile offen | Akte |
| Leitgröße | Klick | Politik, Bereich | Politik |
| Angelegenheit | Klick | Eingang, Zeile offen | Schreibtisch |
| Befehl wählen | Klick | Vorschau mit Verweigerungschance | Akte |
| Befehl erteilen · n Kapital | Klick | `erteileBefehl` | Akte |
| Gespräch | Klick | Szene | Fenster |
| Entlassen | Klick | Rückfrage mit Folgen | Tisch (leerer Stuhl) |
| Zurück / Esc | Klick | schließt die Leiste | Herkunft |

6. **Übernommen / gelöscht:**
   - Übernommen: `ui/minister/MinisterPult.tsx` (falls es den Kopf liefert), `BefehlBlatt.tsx`, `RessortAnliegen.tsx` (nur Anzeige), `RessortVerantwortung.tsx` (Rückblick als Ausklapper), `ui/personen/Umfeld.tsx`, `ui/behoerden/Behoerde.tsx` und `Instrument.tsx`.
   - Wird zur Ministerakte (nicht mehr eigener Reiter): `BehoerdenInstrument` in `ui/akte/Bereiche.tsx` mit `behoerdenOffen`.
   - Entfallen: Behördenreiter in allen Akten (Bilder 011, 018) und die Personenreiter (013, 020).
7. **Simulationsbedarf:**
   - `ressortVon(posten)` (1.2).
   - `RESSORT_POSTEN` (`data/behoerden.ts:213`) auf die neuen Posten umstellen (gesundheit → gesundheit, bildung → bildung bleiben; `praesidialamt` → `stab`).
   - Für Ministerien ohne Posten ist „Behördenausbau ohne Etat“ die heutige Rückfallregel (`AUSBAU.pkOhneEtat`), die gilt weiter.
8. **Texte:** „Groll“ heißt neu „Kränkung“ (`sim/kraenkung.ts` existiert, prüfen, welcher Begriff im Spiel führt) mit ⓘ. „Etat ohne Spielraum“ bleibt.
9. **Abnahme:** Dasselbe `RessortRad` rendert im Haushalt (Ebene 2) und in der Akte mit gleichen Summen (Test). Jede Behörde erscheint in genau einer Ministerakte (Test über `BEHOERDEN`). Höhe der Leiste ohne Ausklapper ≤ 720 px.
10. **Aufwand und Abhängigkeiten:** L. Vorbedingungen sind 1.2, 1.3 und die Haushaltsrecherche (Tabelle A) für die Unterteilung (optional).

#### Kabinett › Verwaltung
1. **Frage und Erfolg:** „Warum geht nichts schneller, und wo ist mein Engpass?“ Erfolg: Zwei Flussbilder (Verwaltungskraft, Politisches Kapital) und eine Bauwarteschlange, die man ziehen kann.
2. **Aufbau (Zonen):**
   - Z1 links Wasserfall Verwaltungskraft (560×260).
   - Z2 rechts Wasserfall Politisches Kapital je Monat (560×260).
   - Z3 Bauwarteschlange als Streifen (1150×260): Zeilen = Vorhaben, Balken = Restdauer, Reihenfolge per Ziehen.
   - Z4 Vorteile (Ausklapper).
3. **Inhalte je Zone:**
   - Z1: `verwaltungBilanz(w)` (`sim/reich.ts:203`): `vorrat` (Zahl oben), `einkommen` (+), `bau` (−), `unterhalt` (−), `netto` (Ergebnis), `personal` als Teil von `einkommen` (beschriftet „davon aus dem Personaletat“; bei 0 entfällt die Zeile, heute „0,0 Punkte …“). Ganze Zahlen.
   - Z2: `kapitalEinkommen(w)` (`sim/spiel.ts:320`): `grund`, `vertrauen`, `mehrheit`, `legitimitaet`, **`kabinett`**, **−`unterhalt`** (inkl. Verfassungs- und EU-Abzug), **−`altlast`** → `summe`. **Heute** zeigt `ui/Reich.tsx:377–381` nur vier Zeilen, aber `k.summe` als Summe, also 3,5 + 2,0 + 1,5 − 0,0 ≠ 9,6. Kabinett, Unterhalt und Altlast fehlen. Alle Zeilen müssen stehen. Eine Nachkommastelle ist hier erlaubt, weil Kapital monatlich in Zehnteln fließt. Besser: ganze Zahlen im Bild und Zehntel im Hover. „Nächster Zufluss am …“ kommt aus `naechste`, die Grenze aus `grenze`.
   - Z3: `reichZustand(w).laufend` mit `vorhabenSicht(w, id)` (`sim/reich.ts:330`), Reihenfolge `bauplan`, `verschiebe(w, id, ±1)` (`:817`, Preis 10 Verwaltungskraft je Position laut Text), `pausiere` (`:797`). Kapazität aus `bauKapazitaet(w)` (`:186`) als Linie „133 je Monat, 99 verplant“.
   - Rüstungsprojekte (F-16, Altay, Stahlkuppel) stehen hier mit Ikone „Sicherheit“. Laut Plan 5.4 gehören sie in die Bauleiste der Sicherheit. Bis zu dieser Entscheidung stehen sie hier einmal, **nicht** in Justiz, Infrastruktur und Kultur.
   - Z4: `VorteileListe` für `haushalt` (vorhanden: „Solide Verwaltung · noch nicht erreicht · Der Preis: …“).
   - Der Block „Haushalt und Märkte“ (Schulden, Leitzins, Lira, Risikoaufschlag; `ui/Reich.tsx:383–392`) entfällt. Das steht in der Wirtschaft.
4. **Zustände:**
   - Verwaltungskraft netto < 0: Z1 rot, „In n Monaten leer“ (`vorrat/−netto`).
   - Baukapazität voll: Streifen mit Warnstrich.
   - Kein Bau: Z3 „Nichts im Bau“ mit Link zur Bauleiste der Land-Akte.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Wasserfall-Stück | Hover | Erklärung und Herkunft (z. B. „Digitale Verwaltung: +0,05 je Stufe“) | – |
| Stück „Digitalisierung“ | Klick | Maßnahme m_verwaltungsdigital | Politik |
| Stück „Kabinett“ | Klick | Kabinettstisch | Kabinett |
| Vorhaben ziehen | Ziehen | `verschiebe` mit Rückfrage (Preis) | Verwaltung |
| Pausieren | Klick | `pausiere` | Verwaltung |
| Vorhaben-Titel | Klick | Ort auf der Karte (Land-Akte) | Karte |

6. **Übernommen / gelöscht:**
   - Übernommen und umgebaut: `ui/Reich.tsx` Bereich `haushalt` (`Haushalt`, `Baureihenfolge` an Zeile 137, `VorteileListe`).
   - Entfallen: der Unterreiter „Lage / Sonderrechte und Vorhaben“ (Bild 017). Die Sonderrechte gehen in eine Zeile „Sonderrechte (5)“, Ausklapper.
7. **Simulationsbedarf:** keiner.
8. **Texte:** „Was knapp ist, ist selten nur Geld“ bleibt als Untertitel. Neu: „Saldo“ statt „Summe“ (bei Kapital).
9. **Abnahme:** Die Wasserfälle summieren sichtbar zum Ergebnis (Test: Summe der Zeilen = `summe` bzw. `netto`). `Baureihenfolge` steht nur in dieser Ansicht (`test/reich-ui.test.tsx`). Kein `−0,0`.
10. **Aufwand und Abhängigkeiten:** M.

---

## Teil 6: Fehlerliste (sofort, unabhängig vom Umbau)

| # | Fehler | Ort | Behebung |
|---|---|---|---|
| F1 | Kapitaltabelle summiert nicht: vier Zeilen, Summe 9,6 | `ui/Reich.tsx:377–381` (`Haushalt`) | Zeilen `k.kabinett`, `−k.unterhalt`, `−k.altlast` ergänzen; Beschriftung „Saldo“ |
| F2 | „−0,0“ bei Legitimität | `ui/Reich.tsx:380` | Werte mit \|x\| < 0,05 als „0“ ohne Vorzeichen |
| F3 | Baureihenfolge mit Kampfjets in Justiz, Verwaltung, Infrastruktur, Kultur | `ui/Reich.tsx:553` (`<Baureihenfolge>` ohne Bedingung) | nur bei `bereich === "haushalt"` rendern |
| F4 | Wirkungsberichte „noch keine“ in Parlament und Kabinett trotz 21 Berichten | `ui/akte/Bereiche.tsx:351` (`BEREICH_THEMEN.recht = ["recht"]`, `regierung = ["haushalt","recht","gesellschaft"]`) | bis die Bilanzreiter entfallen: Leertext „In diesem Bereich noch keine; alle Berichte im Verlauf“ mit Link |
| F5 | Bilanzkurve Achse 50–52 | `VerlaufsDiagramm` in `ui/akte/Bereiche.tsx` | Mindestspanne 20 Punkte oder Achsenbruch |
| F6 | Zwei Konstanten heißen `BEREICH_THEMEN` mit anderer Bedeutung | `ui/politik/bereiche.ts:25` und `ui/akte/Bereiche.tsx:351` | die zweite in `AKTE_THEMEN` umbenennen |
| F7 | Drei Listen „hoch ist schlecht“ | `sim/personen.ts:17`, `ui/politik/bereiche.ts:58`, `sim/berichte.ts:160` | eine Funktion `hochIstSchlecht` (R2), Test, dass alle bisherigen Einträge enthalten sind |
| F8 | Drei Loyalitätsskalen (25/42/58/80, 30/50/70, 40/55) | `sim/kabinett.ts:83`, `ui/akte/Bausteine.tsx:45`, `sim/ministerfluss.ts:488/549` | Worte nur aus `stimmungVon`. Die Schwellen der Empfehlung bleiben, ihr Hinweistext nennt das Wort aus `stimmungVon` |
| F9 | Oppositionsführer „Haltung: abtrünnig (24)“ | `ui/akte/Bausteine.tsx:45` für `amt:"opposition"`/`"partner"` | für Parteifiguren `bereitschaftWort(fraktion(w,p).bereitschaft)` (`sim/fraktionen.ts:147`) statt Loyalität |
| F10 | 373 gegen 362 erwartete Ja-Stimmen | Kachel `ui/gesetze/Gesetzesvorhaben.tsx:118` (`f.ja` mit Bonus) gegen `Beschlussbuch` (ohne) | beide über `gesetzesPrognose` (G3); bis dahin in der Kachel „mit Kompromissfassung“ dazuschreiben |
| F11 | Verfassungstexte nennen Parteien ohne Sitze | `ui/Verfassung.tsx` (Ausgabe von `variante.parteien`) | nach `w.parliament.seats[p] > 0` filtern |
| F12 | Kommentare zu Hürden 301/360 veraltet | `sim/verfassung.ts:7–8`, `:451–453` | auf 360/400 berichtigen, Feldbedeutung prüfen |
| F13 | Quellen kaum lesbar | `ui/quellen/quellen.css:15–74` (Farben für dunklen Grund) | Pergament-Tokens, Kontrast ≥ 4,5:1 |
| F14 | „Weitester Stand“ älter als der aktuelle | `ui/speicher.ts:325` (`fruehereStaende`) | `hoechst` nur als „Weitester Stand“ beschriften, wenn `m.hoechst.datum > m.auto.datum`; sonst als „Frühere Sicherung“ |
| F15 | Stand der Dinge immer ±0 | `ui/standderdinge.ts:107` (`deltas` gegen `vorsitzung`) | ohne Vergleich, wenn `vorsitzung.tag === w.day` |
| F16 | „Frist in 666 Tagen“ | `i18n/katalog/de/buehne.json:203` (`vorlage.frist_in_tagen`) und Aufrufer | über 60 Tage in Monaten (R1), neue Schlüssel `vorlage.frist_in_monaten` |
| F17 | Nachkommastelle im Ministerzitat („87,3“) und „1,0 Kapital“ | Zitattext der Ressortanfrage (ministerfluss) und `ui/minister/VorlageKarte.tsx` (`zahl()`) | Indizes ganzzahlig; Kapital `Math.round` |
| F18 | Vorschlag mit null Wirkung auf Rang 1 (Bild 003) | `sim/ministerfluss.ts` (`empfiehl`, Vorschau `nutzen`) und Reihung | Vorlage nicht erzeugen oder ans Ende, wenn `nutzen[0].mit === nutzen[0].ohne` |
| F19 | Wirkungsnetz: Text überdruckt, ein Wort pro Zeile | Politik › Wirkungsnetz „Was folgt daraus?“ (`ui/NetView.tsx`/`NetNavigator.tsx`, Spalte „Preis und Gegenspieler“) | Mindestbreite der Spalte 240 px; Lag-Text in eigene Zeile; entfällt mit dem Wirkungsbild |
| F20 | Ereignis: dritte Antwort abgeschnitten | `ui/EreignisFenster.tsx:128` (`ev2-optionen`) | Spaltenraster, Fenster ohne inneres Scrollen bis 3 Antworten |
| F21 | Zustimmung 50 (Leiste) gegen 54 (Fenster) unbenannt | `ui/ereignis/kontext.ts:154` | beide Werte benennen (R3) |
| F22 | „Termine 0 von 4 · Ihre Zeit ist knapp“ | Ministerrat-Kopf (`ui/Personen.tsx`/`MinisterratSaal.tsx` mit `termineInfo`) | „4 frei“; „knapp“ nur bei `max − belegt ≤ 1` |
| F23 | „Schnitt Loyalität 49 %“ neben „49“ | Ministerrat-Kopf | ohne %, einmal |
| F24 | „0,44 % BIP …, davon 0,44 % wirksam“ | `ui/politik/UmsetzungAkte.tsx` | „davon“ nur zeigen, wenn verschieden |
| F25 | Bankenaufsicht beim Amt Zentralbank | `sim/personen.ts:63` | an Finanzen (1.2) |
| F26 | Nachnamensvorrat reicht nicht für 17 Ministerien | `sim/figuren.ts:17` (24 Nachnamen) | auf ≥ 60 erweitern (eigener Strom für neue Figuren), Vornamen ebenfalls ohne Dopplung |
| F27 | Behörden-Kennung `praesidialamt` gegen Amt `stab` | `data/behoerden.ts` (`ressort`), `RESSORT_POSTEN` | eine Kennung |

## Teil 7: Offene Fragen (höchstens fünf)

1. **Freie Gesetzesstufen (G3):**
   - **A:** Eine freie Stufe gilt als nächstliegende Fassung, mit Bonus, Verbandsfolgen und Ruhe. Das ist einheitlich, ändert aber die Regel für freie Entwürfe.
   - **B:** Freie Stufen haben keinen Bonus und keine Folgen.

   Ich empfehle A.
2. **Kabinettskapital mit 17 Ministern:** Wird `berechneMinisterKapital` auf 7/n gewichtet (Summe bleibt), nach Etatanteil gewichtet, oder bleibt die Summe von 17 Ministern (mehr Kapital, dann neu kalibrieren)?
3. **Ministerien mit kaum Hebeln** (Jugend und Sport mit 1 Maßnahme und ohne Posten, Äußeres mit 1 Netzmaßnahme): Sollen sie als volle Minister mit Loyalität und Kapitalbeitrag am Tisch sitzen? Oder bleiben sie „leichte“ Plätze, bis Maßnahmen recherchiert sind?
4. **Strittige Zuordnungen:** Internetsperren (Verkehr/BTK oder Präsidialamt), Medienaufsicht (Präsidialamt oder eigener Parlamentsbezug), Mietpreisbremse (Umwelt/Städtebau oder Justiz), Minderheitenrechte (Präsidialamt, Justiz oder Kultur), Rüstungsindustrie (Verteidigung oder Präsidialamt/SSB).
5. **Generalstab am Tisch:** Seit 2018 ist der Generalstab dem Verteidigungsministerium zugeordnet. Bleibt der Generalstabschef eine eigene Figur mit Loyalität und Putschgefahr (heute `generalstab`) neben einem zivilen Verteidigungsminister, oder werden beide zu einer Figur?
