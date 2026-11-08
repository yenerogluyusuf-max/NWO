# Befund G: Außenpolitik, Sicherheit und Militär, Krieg

Prüfer G, 5. November 2026. Grundlage: Rundgangbilder 035 bis 039, eigene Bilder (kopfloser Browser, 1440×900, `?schnellstart`) unter
`/private/tmp/claude-501/-Users-yusufyeneroglu/904f44f4-7b5f-44c2-9447-c69e44ab880b/scratchpad/analyse-G/` (Skripte `g1.cjs` Rundgang, `g2.cjs`/`g3.cjs` Krieg, `g4.cjs` Englisch/Türkisch), Code unter `game/src/ui/Welt.tsx`, `ui/welt/*`, `ui/militaer/*`, `ui/krieg/*`, `ui/akte/Bereiche.tsx`, `ui/akte/Konfliktlage.tsx`, `sim/laender.ts`, `sim/diplomatie.ts`, `sim/krieg.ts`, `sim/kriegsschauplatz.ts`, `sim/streitkraefte.ts`, `sim/welt-bloecke.ts`, `data/streitkraefte.ts`, `data/kraefte.ts`, `data/reich/militaer.ts`, `data/schauplaetze.ts` sowie die Kataloge `aussen`, `krieg`, `militaer`, `laendernamen`, `daten_abkommen`, `ereignisse_aussen`, `oberflaeche*`, `simtexte3`.

**Krieg im Testbrowser ausgelöst (zweimal, reproduzierbar):** Sicherheit › Sicherheitslage › Zypern › „Konfliktdossier öffnen“ › „Krise eröffnen“ (4) › „Kriegsziel deklarieren: Schutz von Minderheiten“ (8) › „Truppen in Bereitschaft“ (6) › einen Tag laufen lassen (Drohkulisse) › „Teilmobilmachung“ (8) › „Einsatz per Erlass“ (20) › Krieg am 6. Juni 2028, einen Tag nach Beginn der Krise. Danach 4 bzw. 8 Wochen laufen lassen, „Waffenruhe anbieten“ (angenommen), Friedenspakete gesehen, „Siegerfrieden“ (5 %) abgelehnt. Bilder `kr*.png` und `k3_*` bis `k9_*`. Die Besatzung habe ich nicht erreicht.

Gutes, das bleiben soll (kurz): Der **Verhandlungstisch** (Klauseln mit Heimwirkung, Wert für die Gegenseite als Punkte, Laufzeit, „Prüfen ist frei“) ist das stärkste Stück des Bereichs. Die **Vermittlung** mit Kernforderungen und roten Linien beider Seiten ist echte türkische Außenpolitik. Die **Rahmung** eines Krieges mit Preisschild (Civ 6), die **Erschöpfungsuhr**, das **Lagebild mit Unsicherheit** und die **Friedenspakete mit Annahme-Aussicht** sind gute Ideen. Die Kataloge `aussen`, `krieg`, `militaer` sind in Englisch und Türkisch vollständig (0 fehlende Schlüssel). Die Rüstungstexte (F-35/S-400-Sperre, KAAN mit GE-Triebwerk, Altay mit koreanischem Antrieb) sind belegt und realistisch.

---

## 1. Ansichten

**A1 · Außen › Länder und Diplomatie (035, eigene `au_laender*`)**
- Frage: „Wer ist mir gut, wer feind, wo muss ich jetzt handeln?“
- Antwort: teilweise. Links eine Liste mit Haltungswort („nüchtern“, „kühl“); keine Karte, kein Brennpunkt, keine Dringlichkeit.
- Länge: 1,75 Bildschirme (EU-Akte); mit Vergleichstabelle und Europawahl-Kasten deutlich mehr.
- Noten: Schönheit 3 · Verständlichkeit 3 · Sinn 3 · Spielgefühl 3
- Urteil: Ordentliche Kartei, aber ein Formular statt einer Weltbühne; die Karte im Hintergrund wird nicht benutzt.

**A2 · Länderakte › Verhandlungstisch (`au_tisch*`)**
- Frage: „Was kann ich anbieten, was will das Land, was kostet es mich daheim?“
- Antwort: ja (Stimmungszeiger, Wir bieten / Wir verlangen, Heimwirkung je Klausel).
- Länge: rund 3 Bildschirme (lange Klausellisten).
- Noten: 2 · 2 · 1 · 2
- Urteil: Das Herzstück der Außenpolitik; nur zu lang und mit veralteten Texten („laufen Ende 2026 aus“, „Erdoğans Draht“).

**A3 · Länderakte › Gesten (`au_gesten0`)**
- Frage: „Welche schnelle Geste bewegt dieses Verhältnis?“
- Antwort: ja (Knopf, Preis, Satz).
- Länge: 1 Bildschirm.
- Noten: 3 · 2 · 3 · 3
- Urteil: Klar, aber doppelt zu den „Instrumenten“ der Weltlage und mit Hinweisen, die eine Wirkung versprechen, die es nicht gibt (G-16).

**A4 · Außen › Blöcke (`au_nato0`, `au_bloecke0`)**
- Frage: „Wo ist die Türkei Mitglied, was beschließen diese Blöcke?“
- Antwort: ja.
- Länge: rund 1,3 Bildschirme (EU mit Rat).
- Noten: 2 · 3 · 3 · 3
- Urteil: Sauber; der EU-Rat ist eine gute Idee, rechnet aber Einstimmigkeit falsch (G-24).

**A5 · Außen › Dienst (`au_dienst*`)**
- Frage: „Was kann der MİT verdeckt tun, mit welcher Aussicht?“
- Antwort: ja (Zielstaat, Karten mit Kapital, Kapazität, Monaten, Aussicht, Risiko).
- Länge: rund 2,5 Bildschirme.
- Noten: 3 · 3 · 2 · 3
- Urteil: Reich an echten Abwägungen; links eine fast leere Spalte, der Einleitungssatz nennt sich selbst „Spielmechanik“.

**A6 · Außen › Vermittlung (`au_vermittlung0`)**
- Frage: „Wo kann Ankara zwischen Dritten vermitteln?“
- Antwort: ja (vier Konflikte als Karten, Forderungen, rote Linien).
- Länge: rund 2,5 Bildschirme.
- Noten: 2 · 3 · 2 · 2
- Urteil: Inhaltlich stark; Jargon („Reif 58 · ZOPA breit“, „TRIPP“) und rote Linien in Großbuchstaben-Kästen stören.

**A7 · Außen › Weltlage › Lage (036, `au_weltlage*`)**
- Frage: „Wie steht die Türkei in der Welt, was droht?“
- Antwort: teilweise. „Lage: gemischt“ plus Kacheln, die die Kopfzahlen wiederholen.
- Länge: 2,51 Bildschirme.
- Noten: 3 · 3 · 3 · 4
- Urteil: Ein Sammelbecken (Ansehen, Terror, Friedensprozess, Flucht, Energie, Sanktionen, anonyme Gesichter), das zur Hälfte in die Sicherheit gehört und dreimal dieselben Zahlen zeigt.

**A8 · Außen › Weltlage › Instrumente (`au_instr0`)**
- Frage: „Welche großen Hebel habe ich (Staatsbesuch, Botschafter, Sanktion, Rückführung, Grenze, Friedensschritt)?“
- Antwort: ja, mit Vorschau der Folgen.
- Länge: rund 2 Bildschirme.
- Noten: 3 · 3 · 3 · 3
- Urteil: Gute Vorschau, aber eine dritte Ebene und ein zweites Gestensystem neben „Gesten“.

**A9 · Sicherheit › Streitkräfte (037, `si_streit*`)**
- Frage: „Wie stark bin ich, wo bin ich schwach, was wird geliefert?“
- Antwort: nein. Sechs von acht Kacheln, die drei Teilstreitkräfte und die Kampfkraft zeigen „100“.
- Länge: 1,34 Bildschirme.
- Noten: 3 · 4 · 3 · 4
- Urteil: Ordentlich gebaut, aber ohne Aussage; die Generation als Punkteleiste bei „Personal“ ist sinnlos.

**A10 · Sicherheit › Rüstung und Beschaffung (038, `si_ruestung*`, `si_beschaffung*`)**
- Frage: „Was wird gebaut, was kann ich neu beginnen, was kostet es?“
- Antwort: teilweise (farbiger Kapazitätsbalken oben, dann Liste mit zivilen Vorhaben).
- Länge: 2,18 Bildschirme; mit Unterreitern mehr.
- Noten: 3 · 3 · 3 · 3
- Urteil: Bauliste und Pflege sind gut lesbar, aber dasselbe Gerät steht in drei Modellen mit drei Daten und wird nochmals zum Kauf angeboten (G-4).

**A11 · Sicherheit › Sicherheitslage (039, `si_lage*`)**
- Frage: „Droht Krieg, mit wem?“
- Antwort: teilweise (Liste „Konfliktlage“ mit Spannung, sieben gleiche Knöpfe).
- Länge: 2,11 Bildschirme.
- Noten: 3 · 3 · 3 · 3
- Urteil: Gute Liste, aber ohne Karte, ohne innere Sicherheit und mit einer zweiten Kopie der Rüstungskarten.

**A12 · Konfliktdossier, Phase Spannung/Drohkulisse (`kr1_krise*`)**
- Frage: „Wie gefährlich ist es, was kann ich tun?“
- Antwort: teilweise (Eskalationsbalken, Lagebild, zehn Knöpfe untereinander).
- Länge: rund 2,3 Bildschirme.
- Noten: 3 · 3 · 2 · 3
- Urteil: Die Handlungen sind gut begründet, aber eine Knopfwand ohne Phasenleiter; der Weg in den Krieg dauert einen Tag.

**A13 · Konfliktdossier, Phase Krieg und Waffenruhe (`kr3_*`, `k3_*`, `k6_*`, `k7_pakete`)**
- Frage: „Wo steht die Front, was befehle ich, wie komme ich heraus?“
- Antwort: nein. Drei gleich gefärbte Balken, danach ein Versorgungsblock von über einem Bildschirm; Front und Befehle erst ganz unten.
- Länge: 2.198 px zu Kriegsbeginn, 3.177 px nach vier Wochen (rund 3 bis 4 Bildschirme).
- Noten: 4 · 3 · 3 · 4
- Urteil: Der Krieg ist ein Dokument zum Herunterscrollen, keine Bühne; Klicks bleiben ohne Antwort.

**A14 · Kriegskarte 2D (`kr4_karte`, `kr5_karte_spaeter`, `k8_karte`)**
- Frage: „Wo wird gekämpft, wer gewinnt?“
- Antwort: nein. Ein gestrichelter Pfeil von Mersin nach Zypern und drei gepunktete Kreise; nach acht Kriegswochen ist das Bild unverändert.
- Länge: 1 Bildschirm.
- Noten: 4 · 4 · 4 · 5
- Urteil: Gegenüber der Vorgabe „Krieg wie Hearts of Iron 4, Karte als Bühne“ ist das der größte Abstand im ganzen Bereich (die 3D-Karte konnte ich nicht prüfen, siehe Schluss).

---

## 2. Befunde

**G-1 · Krieg: Die Karte ist keine Bühne**
- Ort: Kriegskarte (kr4/kr5); `ui/linsen/linsen.ts:6-17` (keine Linse „Front“), `sim/krieg.ts:4-6`, `ENTSCHEIDUNGEN.md:265`
- Art: Sinn
- Befund: Auf der Karte stehen im Krieg ein Pfeil und drei Kreise; keine Front, keine Verbände, keine Regionenfarben, keine Bewegung über acht Wochen. Eine Linse „Front und Besatzung“ ist nur als Kommentar angekündigt („Spätere Linsen … bekommen hier ihre Regel“). Der Kopf von `sim/krieg.ts` sagt noch: „Es gibt keine Taktik … abstrakte Frontlage (0–100) … kein Schlachtfeld“, obwohl ENTSCHEIDUNGEN 265 das ersetzt hat („operative Führungsebene mit Regionen, Verbänden, Fronten, Befehlen, Nachschub, Luft und See, Generälen, Besatzung, Annexion und Friedenskonferenz“).
- Warum es stört: Der Spieler führt einen Krieg, den er nicht sieht. Der Fortschritt steckt in einer Zahl „Frontlage 74“, der Satz „Genommen: 0 von 1 Zielregionen“ widerspricht dem Gefühl, zu gewinnen.
- Vorschlag: Linse „Lage“ (Plan D, Ansicht 4) umsetzen: Zielregionen als Flächen (eigen, umkämpft, Gegner), Frontlinie als Kante zwischen ihnen, Vorstöße als animierte Pfeile pro Woche, Verbände als Plaketten aus den Gattungen (Heer, Luft, See mit Stärke in Prozent), bedrohte Provinzen blinkend; die Kriegsleiste unten (Einsatzart, Tempo, Stärkevergleich). Den veralteten Kopfkommentar in `sim/krieg.ts` an ENTSCHEIDUNGEN 265 anpassen.
- Schwere: 1 · Aufwand: groß

**G-2 · Vom Frieden zum Krieg in einem Tag**
- Ort: Konfliktdossier; `sim/krieg.ts:613-630` (Kriegsziel +10 Eskalation), `KRIEG.drohkulisseAb = 78`, `sim/krieg.ts:684-692` (Erlass beginnt den Krieg sofort)
- Art: Logik
- Befund: Im Test: 5. Juni Krise eröffnet (Eskalation 77), Kriegsziel (87), Bereitschaft (91), am 6. Juni Drohkulisse, Teilmobilmachung, Erlass, Krieg. Es gibt keine Mindestdauer je Phase; eine Teilmobilmachung wirkt sofort.
- Warum es stört: Kein echter Präsident kann binnen 24 Stunden einen Angriff auf ein EU-Mitglied anordnen. Die Eskalationsphase, laut Code „die Hauptspielfläche“, wird übersprungen; Spannung und Gegenspiel der anderen Staaten haben keine Zeit zu wirken.
- Vorschlag: Mindestdauern als Spielparameter: Drohkulisse frühestens 21 Tage nach Krisenbeginn, Mobilmachung braucht 14 bzw. 30 Tage bis zur vollen Stärke (Fortschrittsbalken), Kriegsbeginn erst danach. In dieser Zeit reagieren Partner, Märkte und Vermittler (Ereignisse).
- Schwere: 1 · Aufwand: mittel

**G-3 · Angriffskrieg per Erlass ist zu billig**
- Ort: `krieg.k.h.erlass.hinweis`; `sim/krieg.ts:684-692`
- Art: Logik
- Befund: „Einsatz per Erlass anordnen“ kostet 20 Kapital, Vertrauen −3 und Legitimität −2,5 und geht auch bei einem selbst eröffneten Krieg mit der Rahmung „Schutz von Minderheiten“.
- Warum es stört: Nach Art. 92 der türkischen Verfassung braucht der Einsatz der Streitkräfte im Ausland die Zustimmung der Großen Nationalversammlung; ohne sie darf der Präsident nur bei einem plötzlichen Angriff handeln. Ein Umgehen ohne Angriff müsste ein Verfassungsbruch mit schweren Folgen sein (Gericht, Opposition, Putschgefahr).
- Vorschlag: Erlass nur, wenn der Gegner zuerst angegriffen hat oder die Eskalation über 95 liegt (`KRIEG.angriffAb`). Sonst Knopf gesperrt mit Grund „Nur bei einem Angriff auf die Türkei; sonst entscheidet das Parlament (Art. 92)“ und Sprung zum Beschluss.
- Schwere: 2 · Aufwand: klein

**G-4 · Rüstung: ein Gerät, drei Modelle, drei Fertigdaten, doppelt bestellbar**
- Ort: Streitkräfte (037), Rüstung (038), Sicherheitslage (`si_lage1`), Beschaffung (`si_beschaffung2`); `data/streitkraefte.ts:69-75` (`START_BESCHAFFUNGEN`) gegen `data/reich/militaer.ts:59-160`
- Art: Logik
- Befund: KAAN Block 10 und Eurofighter laufen in den Streitkräften schon („noch 36 Monate … Eurofighter, F-16 Block 70, KAAN Block 10“), stehen aber in der Sicherheitslage und der Beschaffung als „MÖGLICH · Prüfen und beginnen“ (KAAN 8 Kapital, 2.000 Bau, 48 Mon.). F-16 Block 70, Stahlkuppel und Altay haben zwei Daten: Streitkräfte „noch 36 / 36 / 30 Monate“, Bauliste „fertig in etwa 24 / 51 / 45 Monaten“.
- Warum es stört: Der Spieler kann bezahlen, was längst bestellt ist, und weiß nicht, wann etwas kommt. Das zerstört das Vertrauen in jede Zahl der Akte.
- Vorschlag: Ein Modell: das Reich-Vorhaben führt, `Beschaffung` bekommt `vorhaben?: string` und übernimmt `fertig` aus `bauplan` (wie Plan D, Ansicht 5). KAAN und Eurofighter beim Start als `im_bau` mit Fortschritt anlegen, damit sie nicht erneut angeboten werden. Abnahmetest: „Jedes Gerät hat in allen Ansichten ein Datum“.
- Schwere: 1 · Aufwand: mittel

**G-5 · Das Kriegsdossier wird vom Versorgungsblock erdrückt**
- Ort: Konfliktdossier im Krieg; `ui/welt/KriegDossier.tsx:112` (`<VersorgungsLage>` mitten im Dossier)
- Art: Design
- Befund: Unter den drei Balken folgt „KABINETT · VERSORGUNG & SICHERHEIT · Das Land versorgen“ mit Vorrangwahl, drei nummerierten Handlungen, Monatsbericht „Was Ihre Entscheidungen bewirken“, „Ihre Entscheidungen im Vergleich“, „Warum die Parteien reagieren“, „Opposition & öffentliche Kontrolle“, in eigener Schrift und Bildsprache (dunkles Banner, große Überschriften). Das Dossier wächst auf 3.177 px; Schauplatz, Einsatzart und Handlungen stehen erst danach.
- Warum es stört: Im Krieg sucht der Spieler die Front und seine Befehle und findet einen Wirtschaftsbericht. Regel 2 (1,5 Bildschirme) und Regel 8 (nichts doppelt, die Versorgung hat eine eigene Akte) sind verletzt.
- Vorschlag: Im Dossier nur eine Zeile „Versorgung: zivil 100 % · Treibstoff Front 100 % · Vorrang anteilig ›“, die in die Versorgungsakte springt. Reihenfolge im Dossier: Phasenleiter, Front mit Karte, Einsatzart/Tempo, drei Haupthandlungen, Friedenspakete.
- Schwere: 1 · Aufwand: klein

**G-6 · Kriegshandlungen bleiben ohne Antwort**
- Ort: `ui/welt/KriegDossier.tsx:164` (Ergebnis von `fuehreKriegHandlungAus` verworfen), `:151-152` (`onTat={() => refresh()}` verwirft den Text von Einsatzart, Tempo, Besatzung)
- Art: Funktion
- Befund: Nach „Bodenoffensive“ erschien im Test keine Meldung (Prüfung `einsatzAntwort` leer). Auch Ultimatum, Vermittlung, Waffenruhe und Friedenspakete liefern einen Satz („Zypern gibt nach“, „lehnt ab, Aussicht 5 %“), der nur im Protokoll landet.
- Warum es stört: Der Spieler weiß nicht, ob das Ultimatum gelang, warum die Vermittlung scheiterte oder dass der Siegerfrieden abgelehnt wurde; er sieht nur, dass Kapital fehlt. „Hinter jeder Entscheidung muss etwas stecken“ ist erfüllt, aber unsichtbar.
- Vorschlag: Wie bei den Gesten (`Welt.tsx:249-254`) einen Antwortstreifen oben im Dossier: `const [antwort, setAntwort] = useState<Ergebnis|null>()`, gefüllt aus allen Handlungen, mit `text` und `why`.
- Schwere: 1 · Aufwand: klein

**G-7 · Englisch und Türkisch: die Außenpolitik bleibt halb deutsch**
- Ort: `s_en_gesten.png`, `s_tr_aussen.png`; `ui/Welt.tsx:34-46,102,236,353,373`, `sim/laender.ts:76 ff.,277-282,391-397,413,519`, `sim/welt-sicht.ts:21-30,67-75`, `data/welt-institutionen.ts:62,84,124-131`, `sim/welt-modell.ts:463,1050-1059`, `data/welt-daten.ts:52-58`, `ui/welt/WeltLage.tsx:65-77`, `ui/welt/Block.tsx:14,40,53`
- Art: Übersetzung
- Befund: In der englischen Fassung stehen „nüchtern“, „kühl“, „Alle“, „Nachbarn“, „EU-Staaten“, „Golf“, „Turkstaaten“, „Brasilien“, „Indien“, „Vereinigtes Königreich“, „Handel / Sicherheit / Vertrauen / Konflikt“, „Gipfeltreffen“, „Handelsabkommen“. In der türkischen zusätzlich „brüchig“, „Autokratie · Präsidentenwahl am 17.03.2030“, „17 Mart 2030 tarihinde Präsidentenwahl“, „neutral“, „% BIP“ (statt GSYH) und „SOZ“ (statt ŞİÖ). Die Zahlen formatieren `Welt.tsx:50` und `Streitkraefte.tsx:29` fest mit `"de-DE"`.
- Warum es stört: Regel 11 („keine fest verdrahteten deutschen Wörter außerhalb der Kataloge“) ist im meistbesuchten Bildschirm des Bereichs gebrochen; ein englischer oder türkischer Spieler sieht ein Sprachgemisch.
- Vorschlag: Alle genannten Stellen auf Schlüssel umstellen (Liste in Abschnitt 3), Einheiten über `t("einheit.bip")`, Zahlen über `zahl()` aus `i18n`. Einen Test ergänzen, der die Außenakte in `en` rendert und nach deutschen Wörtern sucht.
- Schwere: 1 · Aufwand: mittel

**G-8 · Drei Ebenen und zwei Gestensysteme**
- Ort: Außen; `ui/Welt.tsx:60-61,52-57`, `ui/welt/Aussenlage.tsx:52-58`; `sim/laender.ts:276-283` gegen `sim/diplomatie.ts:574-595`
- Art: Konsistenz
- Befund: Aktenreiter (Länder und Diplomatie / Weltlage) › Modus (Staaten, Blöcke, Dienst, Vermittlung) › Land › Reiter (Überblick, Verhandlungstisch, Verträge, Gesten, Konflikt, Beitritt); in der Weltlage nochmals Lage / Instrumente / Verlauf. „Gipfeltreffen“ (Gesten, 3 Kapital, 120 Tage, Vertrauen +8) und „Staatsbesuch“ (Instrumente, 6 Kapital, 180 Tage, Vertrauen +4 plus Tagesordnung) sind dieselbe Sache mit zwei Preisen und zwei Abkühlungen.
- Warum es stört: Regel 3 (zwei Ebenen) und „Gleiches muss gleich aussehen“. Der Spieler fragt sich, warum ein Staatsbesuch mehr kostet und weniger bringt als ein Gipfel, und findet die Sanktion nicht beim Land, sondern in einer anderen Akte.
- Vorschlag: Eine Geste „Staatsbesuch“ mit Tagesordnung (Handel, Sicherheit, Energie, Migration, Diaspora) in der Länderakte; Botschafter abberufen und Sanktion als Gesten des Landes; Rückführung, Grenze, Friedensschritt in die Sicherheit (G-10). Den Unterreiter der Weltlage auflösen.
- Schwere: 2 · Aufwand: mittel

**G-9 · Weltlage zeigt dieselben Zahlen dreimal**
- Ort: 036; `ui/akte/Bereiche.tsx:122-131` (Kopf), `lageUrteil` (Bereiche.tsx, „Auffällig“), `sim/diplomatie.ts:805-810` (Kacheln), `ui/welt/Aussenlage.tsx:171-177` (Diaspora zweimal)
- Art: Konsistenz
- Befund: „Ansehen 45“ und „Vertrauen der EU 40“ stehen im Kopf, im Urteil („Auffällig: Ansehen: 45 · Vertrauen der EU: 40“) und als Kacheln; „Diaspora 50“ als Kachel und als Balken unter den Sanktionen. Die Diaspora-Kachel steht allein in einer zweiten Reihe.
- Warum es stört: Regel 8. Drei Wiederholungen füllen die erste Bildschirmhöhe, die eigentliche Lage (Vorwarnung Hormus) geht unter.
- Vorschlag: Kopf behalten, Urteil durch eine Zeile Vorwarnungen ersetzen, Kacheln streichen; Diaspora nur einmal.
- Schwere: 2 · Aufwand: klein

**G-10 · Innere Sicherheit steht in der Außenpolitik**
- Ort: Weltlage (Terror, Friedensprozess, Kachel „Sicherheitslage“), Instrumente (Rückführung, Grenzsicherung, Friedensschritt); Sicherheitslage (039) ohne diese Themen
- Art: Sinn
- Befund: IS, „PKK-Splitter“ und Linksextreme, der kurdische Friedensprozess und die Grenzsicherung stehen unter Außen. Die Akte Sicherheit zeigt dazu nichts außer einem Link „Behörden des Bereichs (4)“. Die Außen-Kachel heißt „Sicherheitslage 58 · 100 minus Terrorgefahr“, derselbe Name wie der Reiter der Sicherheit.
- Warum es stört: „Wo finde ich diese Akten“: Wer Terror oder den Friedensprozess sucht, geht in die Sicherheit und findet ihn nicht. Polizei, Gendarmerie und MİT im Inland fehlen als Stellgrößen.
- Vorschlag: In der Sicherheit ein Abschnitt „Innere Sicherheit“: Terror (drei Balken), Friedensprozess als Phasenleiter mit dem Instrument „Friedensschritt“, Grenzsicherung, Maßnahmen `m_polizei` und `m_friedensprozess` als Regler (Plan D, S4). In Außen nur Flucht und Energie.
- Schwere: 2 · Aufwand: mittel

**G-11 · Der Krieg ist über drei Akten verstreut**
- Ort: `ui/Welt.tsx:229-233` (Reiter „Konflikt“ nur mit laufendem Vorgang), `ui/Stage.tsx:949` (Sicherheit springt in die Akte Außen), `ui/militaer/Streitkraefte.tsx:79-112` (Zielräume nur hier)
- Art: Funktion
- Befund: „Krise eröffnen“ erreicht man nur über Sicherheit › Sicherheitslage › „Konfliktdossier öffnen“, das dann die Akte Außen öffnet. In der Länderakte Zypern gibt es vor der Krise keinen Reiter dazu. Den Zielraum („Schutzzone Nordzypern“, „Ganz Zypern“) wählt man nur in den Streitkräften; dort steht der Schauplatz ein zweites Mal.
- Warum es stört: Der Spieler springt zwischen Sicherheit und Außen, ohne zu wissen, wo der Krieg „wohnt“; der Zielraum, die wichtigste Entscheidung, ist versteckt.
- Vorschlag: Konflikt und Krieg leben in der Sicherheit (Lagekarte, Plan D Ansicht 4): Konfliktliste, gewählter Konflikt mit Phasenleiter, Zielraum als anklickbare Fläche, Einsatzart, Tempo. Die Länderakte Außen zeigt nur eine Zeile „Konflikt: Krieg · Front 65 › Zur Lagekarte“.
- Schwere: 2 · Aufwand: groß

**G-12 · „100 %“ als Bestand: ehrlich, aber ohne Aussage**
- Ort: 037; `ui/militaer/Streitkraefte.tsx:31-36`, `militaer.ui.einheit.index`, `data/streitkraefte.ts:9-12`
- Art: Sinn
- Befund: Kampfpanzer, Drohnen, Luftabwehr, Marine, Raketen zeigen „100 %“, dazu „Kampfkraft 100“, „Heer 100 · Luftwaffe 100 · Marine und Raketen 100“. Der Hinweis „Bestand Juni 2026 = 100 %; eine offene Quelle für Stückzahlen gibt es nicht“ steht nur im Detail.
- Warum es stört (Bewertung der Frage „Index-Gattungen als Anteil am Bestand 2026“): Die Entscheidung, keine Stückzahl zu erfinden, ist richtig und regelkonform. Als Anzeige taugt sie nicht: „100 %“ liest sich wie „voll einsatzbereit“; sieben gleiche Zahlen zeigen keine Schwäche; ein Vergleich mit dem Gegner (Griechenland, Iran) ist nicht möglich; und der Kopf sagt gleichzeitig „Bereitschaft Heer 60“. Die Anzeige beantwortet die Frage der Seite („wo bin ich schwach?“) nicht.
- Vorschlag: Benannte Zustände statt Prozent (Regel 5): „wie 2026“, „gewachsen (+12 %)“, „geschrumpft (−8 %)“, und nur Abweichungen hervorheben. Die Stärke zeigt die Generation („Gen. 3, Altbestand“) und die Herkunft. Als Bild oben ein Radar mit drei Achsen (Heer, Luft, See), Fläche Kampfkraft gegen Fläche Bereitschaft (Plan D, T2). Mittelfristig belegte Stückzahlen aus offenen Listen prüfen (Wikipedia-Inventarlisten zitieren IISS); bis dahin „Lücke“.
- Schwere: 2 · Aufwand: mittel

**G-13 · Zwei Zahlen für das aktive Personal**
- Ort: `data/streitkraefte.ts:42` (481.000 Aktive) gegen `data/kraefte.ts` `KRAFT_BELEG.TUR.aktiveTsd: 355` („IISS-Auswertung, untere Bandgrenze 355.000“)
- Art: Zahl
- Befund: Die Streitkräfte zeigen „Personal 481.000“, die Kräfteskala des Krieges rechnet mit 355.000. Nach dem Krieg steht „479.617“.
- Warum es stört: Regel 6 (eine belegte Zahl). Vermutung: 481.000 enthält Gendarmerie und Küstenwache, die dem Innenministerium unterstehen. Die Angabe auf den Soldaten genau täuscht eine Genauigkeit vor, die es nicht gibt.
- Vorschlag: Eine Zahl mit Quelle und Abgrenzung festlegen (etwa „355.000 Streitkräfte, dazu rund 150.000 Gendarmerie“ nur, wenn belegt) und auf Tausend runden („rund 480.000“).
- Schwere: 2 · Aufwand: klein

**G-14 · Wehrdienst: kostenlos, ohne Gesetz, mit Moral-Pumpe**
- Ort: Streitkräfte › Wehrdienst; `sim/streitkraefte.ts:381-393`
- Art: Logik
- Befund: Ein Klick stellt Berufsarmee, 6, 12 oder 18 Monate ein, ohne Kapital, ohne Gesetz, ohne Abkühlung. Berufsarmee senkt das Personal nur um 7,2 % (`1 + 0,012·d` bei d = −6) und kostet keine Lira. Wechsel 6 → 0 bringt Truppenmoral +2, zurück 0 → 6 nur −1: Hin- und Herklicken hebt die Moral beliebig. Daneben gibt es die Maßnahme `m_wehrdienst` (zwei Hebel, Plan D offene Frage 2).
- Warum es stört: Keine echte Abwägung, und eine ausnutzbare Lücke. In der Türkei ist der Wehrdienst gesetzlich geregelt; eine Berufsarmee verdoppelt die Personalkosten je Soldat.
- Vorschlag: Nur den Maßnahmen-Regler behalten (benannte Zustände „Berufsarmee · 6 Monate · 12 Monate · 18 Monate“), Weg über Gesetz, Preis am Regler (Etat in % des BIP, Personal, Junge), Moralwirkung symmetrisch.
- Schwere: 2 · Aufwand: mittel

**G-15 · Rüstungsgeschäft kostet die Türkei immer Geld, auch wenn sie verkauft**
- Ort: Gesten › „Rüstungsgeschäft“; `sim/laender.ts:513-520`, `sim2.sim.laender.0e162e9` „Kostet {p0} Kapital und etwa 0,1 % des BIP.“; Vorteil „Rüstungsexporteur · Noch nicht erreicht (2025: Exporte von 10,05 Mrd. USD …)“
- Art: Logik
- Befund: Mit Aserbaidschan, der Ukraine, Libyen oder Saudi-Arabien ist die Türkei Verkäufer (Bayraktar, Akıncı), trotzdem bucht die Geste 0,1 % des BIP als Ausgabe. Gleichzeitig nennt die Rüstungsakte die Türkei mit 10 Mrd. Dollar Export einen Exporteur „noch nicht erreicht“.
- Warum es stört: Der Spieler bezahlt für seine eigenen Exporte; das widerspricht der Wirklichkeit und dem eigenen Text.
- Vorschlag: Zwei Gesten: „Waffen liefern“ (Einnahme, Export +, Gegenspieler verärgert) und „Waffen kaufen“ (Ausgabe, Bereitschaft +). Den Vorteil „Rüstungsexporteur“ beim Start als erreicht führen oder umbenennen („Exportweltmeister: über 15 Mrd. Dollar“).
- Schwere: 2 · Aufwand: klein

**G-16 · Gesten versprechen Bedingungen, die es nicht gibt**
- Ort: Gesten; `sim2.sim.laender.4cf8cec` gegen `sim/laender.ts:527-532`; `sim2.sim.laender.2310288` gegen `sim/laender.ts:491-495`
- Art: Logik
- Befund: „Konflikt entschärfen: … das Land will dafür ein Zeichen des Entgegenkommens“; im Code gibt es keine Forderung. „Gipfeltreffen: … Fotos und Zusagen kosten nichts, gehalten werden müssen sie trotzdem“; der Gipfel legt keine Zusage an.
- Warum es stört: Regel 7: Ein Text, der eine Wirkung verspricht, muss stimmen.
- Vorschlag: Entweder die Forderung bauen (Entschärfen legt eine Zusage an, z. B. „Grenzübergang öffnen in 120 Tagen“) oder die Texte ehrlich machen: „Gespräche über Streitpunkte: Konflikt −12, Vertrauen +4; Nationalisten sehen Schwäche.“
- Schwere: 2 · Aufwand: klein

**G-17 · Fluchtkosten in Prozent des BIP, die nicht im Haushalt stehen**
- Ort: Weltlage › Flucht und Rückkehr; `sim/diplomatie.ts:306-308`, `aussen.ui.flucht_kosten`
- Art: Zahl
- Befund: „Kosten 0,00 % des BIP im Jahr“ am Spielstart (erst nach dem ersten Monat berechnet), danach rund 0,48 %. Gebucht wird nur ein Stoß auf den Knoten „sozialkassen“ (−0,08 × Kosten im Monat), kein Haushaltsposten.
- Warum es stört: Der Spieler liest eine Ausgabe, die im Haushalt nicht auftaucht. Vermutung: die indirekte Wirkung über das Netz ist viel kleiner als der Text sagt.
- Vorschlag: Entweder als Posten im Haushalt führen (dann stimmt die Zahl) oder die Zeile in „Belastung der Sozialkassen: spürbar“ (benannter Zustand) ändern; die Startzahl beim Anlegen berechnen.
- Schwere: 2 · Aufwand: mittel

**G-18 · Friedenspakete: „Der Innenpreis steht schon jetzt fest“, aber er steht nirgends**
- Ort: Waffenruhe (`k7_pakete`); `krieg.k.h.paket.hinweis`; vorhanden wäre `poVerlustFuer` (`sim/krieg.ts:345`)
- Art: Funktion
- Befund: Jeder Paketknopf sagt „Annahme-Aussicht etwa 46 %. Der Innenpreis steht schon jetzt fest (freie Presse verteuert ihn).“ Der Preis selbst fehlt.
- Warum es stört: Regel 4 (Preis und Wirkung am Knopf). Die wichtigste Entscheidung des Krieges fällt ohne Preis.
- Vorschlag: „Ausgewogener Frieden · Annahme 46 % · daheim Zustimmung −3,1 · Nationalisten −2“ aus `poVerlustFuer` und den Paketfolgen.
- Schwere: 2 · Aufwand: klein

**G-19 · Das Lagebild verrät, was es angeblich nicht weiß**
- Ort: Streitkräfte › Zielräume („Eigene Stärke 54, Gegenwehr 30“, `k9_streit`) gegen Dossier („Gegnerische Stärke: 22–42 (vermutet)“); `ui/militaer/Streitkraefte.tsx:85` gegen `ui/welt/KriegDossier.tsx:126-140`
- Art: Konsistenz
- Befund: Bei Abschreckung 55 zeigt das Dossier eine Spanne „±10“, die Streitkräfte zeigen die genaue Zahl.
- Warum es stört: Die Idee „ehrlich über Unsicherheit“ wird durch die zweite Ansicht ausgehebelt.
- Vorschlag: In den Zielräumen dieselbe Darstellung wie im Dossier (Spanne oder Wort), aus einer Funktion `gegnerSicht(w, k)`.
- Schwere: 2 · Aufwand: klein

**G-20 · „Rückhalt im Land 107“ und zwei Verlustgrößen**
- Ort: Dossier im Krieg; `ui/welt/KriegDossier.tsx:96-109`, `krieg.d.woche`
- Art: Zahl
- Befund: Der Rückhalt steht bei 103 bzw. 107 (Uhr bis 110). Daneben „Verluste 1“ (eine abstrakte Größe ohne Einheit) und „Gefallene 53“.
- Warum es stört: Ein Wert über 100 auf einer Skala bis 100 wirkt wie ein Fehler; „Verluste 1“ neben 53 Gefallenen versteht niemand.
- Vorschlag: Anzeige auf 100 kappen (oder „über dem Ausgangsstand“ als Wort), „Verluste“ streichen oder als „Kampfkraft −4 %“ beschriften; Gefallene und Verwundete als einzige Menschenzahl.
- Schwere: 2 · Aufwand: klein

**G-21 · Einsatzart: vier Knöpfe ohne Unterschied, die Seeblockade versagt auf einer Insel**
- Ort: Schauplatz Zypern (`k3_schauplatz`); `ui/krieg/Schauplatz.tsx:84-96`, `krieg.einsatz.see.text`
- Art: Logik
- Befund: Alle vier Einsatzarten zeigen „eigene Kräfte 100“; drei davon „schwer im Gelände“, die Seeblockade „kaum möglich im Gelände“. Der Text der Seeblockade verspricht „Inseln fallen“, gegen die Insel Zypern ist sie die schlechteste Wahl (Zielregion „Nikosia (Süden)“, Gelände Stadt).
- Warum es stört: Die Entscheidung hat keine sichtbare Grundlage; der Widerspruch zum eigenen Text macht sie unglaubwürdig.
- Vorschlag: Je Einsatzart die erwartete Wirkung auf diese Region als drei Pfeile (Front, eigene Verluste, Heimatfront) statt „eigene Kräfte 100“; die Seeblockade gegen Inselstaaten auf die Erschöpfung des Gegners wirken lassen (Häfen Larnaka, Limassol).
- Schwere: 2 · Aufwand: mittel

**G-22 · „Schutzzone Nordzypern“ zielt auf Süd-Nikosia**
- Ort: `data/schauplaetze.ts:126` (`cyp_schutz: ["cyp_nikosia"]`), `militaer.zielraum.cyp_schutz`, Region „Nikosia (Süden)“
- Art: Logik
- Befund: Der Zielraum heißt „Schutzzone Nordzypern“, die einzige Region ist der Süden Nikosias. Die Länderakte selbst sagt: „Im Norden besteht die nur von der Türkei anerkannte Türkische Republik Nordzypern“, dort stehen türkische Truppen seit 1974.
- Warum es stört: Der Name verspricht Schutz im Norden, das Spiel erobert den Süden der Hauptstadt.
- Vorschlag: Umbenennen in „Pufferzone und Süd-Nikosia“ oder den Zielraum als Sicherung der Waffenstillstandslinie (Grüne Linie) bauen.
- Schwere: 2 · Aufwand: klein

**G-23 · Die eigene Stärke springt ohne Erklärung (Vermutung)**
- Ort: Dossier, Test: nach „Kriegsziel deklarieren“ sinkt „Eigene Stärke“ von 39 auf 28, die Gegnerspanne steigt von 4–24 auf 21–41
- Art: Logik
- Befund: Die Rahmung ändert die Stärke deutlich, ohne dass der Hinweis am Knopf es sagt (er nennt Stimmen und Ansehen). Vermutung: Koalitionen und Zielraum werden mit der Rahmung neu berechnet (`koalitionsFaktoren`, `zielraumVon`).
- Warum es stört: Der Spieler verliert ein Viertel seiner Stärke durch einen Satz und weiß nicht warum.
- Vorschlag: Im Hinweis der Rahmung die Folge nennen („Griechenland tritt an die Seite Zyperns: Gegenwehr +17“) und im Dossier eine Zeile „Wer kämpft mit“.
- Schwere: 2 · Aufwand: klein

**G-24 · EU-Rat: „dagegen 5 · Einstimmigkeit: nicht verweigert“**
- Ort: Blöcke › EU (`au_bloecke0`); `sim/welt-bloecke.ts:98,126`, `ui2.ui.welt.Block.578b67d`
- Art: Logik
- Befund: Einstimmigkeit gilt als erreicht, solange niemand ein Veto (Wert unter −55) einlegt; fünf Gegenstimmen zählen nicht.
- Warum es stört: Im echten Rat blockiert jede Gegenstimme einen einstimmigen Beschluss. Der Satz widerspricht der Zahl daneben.
- Vorschlag: Bei Einstimmigkeit jede Gegenstimme als Veto zählen, Enthaltung nicht. Wortwahl „kein Veto“ / „blockiert durch Griechenland, Zypern“.
- Schwere: 2 · Aufwand: klein

**G-25 · Vergleichstabelle doppelt und widersprüchlich**
- Ort: Länderakte › Überblick; `ui/Welt.tsx:471-493`, `data/vergleich.json`
- Art: Konsistenz
- Befund: Bei der EU steht „Inflation 2,2 %“ oben in der Kachel und unten in „Zum Vergleich (letzter Wert)“ nochmals, daneben „Türkei 34,9 (2025)“, während die Kopfleiste 31,5 % zeigt. „Als Maßstab dient Deutschland“ steht erst ganz unten; die Kacheln oben (Wachstum 0,2, Rüstung 1,9) sind ebenfalls deutsche Werte, ohne Hinweis.
- Warum es stört: Regel 8 und ein Widerspruch zum laufenden Spiel.
- Vorschlag: Tabelle streichen (Plan D sieht das vor); bei der EU „Werte: Deutschland“ als Etikett an den Kacheln.
- Schwere: 2 · Aufwand: klein

**G-26 · Anliegen in „Stufen“**
- Ort: „Was Europäische Union von der Türkei will“ (`au_laender1`): „Justizreform mindestens auf Stufe 55 (jetzt 35)“, „ausweiten: Justizreform“
- Art: Sprache
- Befund: Regel 5 verbietet „Stufe 55“, wo es benannte Zustände gibt; der Link beginnt klein und mit Doppelpunkt.
- Warum es stört: Der Spieler weiß nicht, was Stufe 55 bei einer Justizreform bedeutet.
- Vorschlag: „Justizreform: mindestens ‚spürbar‘ (jetzt ‚zaghaft‘) · Regler öffnen ›“, die Stufennamen aus der Maßnahme; nach Plan D direkt der Regler mit Soll-Marke.
- Schwere: 2 · Aufwand: mittel

**G-27 · Erdoğan als Werkzeug des Spielers**
- Ort: Verhandlungstisch › „Ankara vermittelt im Streit“; `daten.abkommen.klausel.vermittlung_zusage.text`
- Art: Logik
- Befund: „Istanbul als Ort, Erdoğans Draht zu beiden Seiten als Werkzeug.“ Präsident ist 2028 der Spieler (im Test Deniz Aydın).
- Warum es stört: Bricht die Fiktion an der Stelle, wo der Spieler selbst handelt.
- Vorschlag: „Die Türkei bietet sich als Vermittler an: Istanbul als Ort, der Draht des Präsidenten zu beiden Seiten als Werkzeug.“
- Schwere: 2 · Aufwand: klein

**G-28 · Artwork der Rüstung: ein Jet für alles, „Wunder“, Ausschreibung in Großbuchstaben**
- Ort: 038, `si_lage1`; `data/reich/militaer.ts` (`bild: "jet"` bei F-16, KAAN, TF35000, Eurofighter, F-35, Hürjet), Klasse `wunder`, Etikett „TRANSPARENTE AUSSCHREIBUNG“
- Art: Design
- Befund: Sechs Vorhaben teilen dieselbe Jet-Silhouette, auch das Triebwerk TF35000. KAAN trägt das Etikett „WUNDER“. In der Bauliste steht fünfmal „TRANSPARENTE AUSSCHREIBUNG“ in gelben Großbuchstaben, auch beim Kauf der F-16 von der US-Regierung, der keine Ausschreibung ist.
- Warum es stört: Die Bilder unterscheiden nichts; „Wunder“ ist ein Civ-Begriff ohne Sinn in einer Rüstungsakte; das gelbe Etikett schreit, ohne etwas zu sagen.
- Vorschlag: Eigene Motive je Typ (Kampfjet, Trainer, Triebwerk als Schnittzeichnung, Zerstörer, Panzer, Kuppel); Klasse „Großvorhaben“; Vergabe als kleines graues Etikett einmal je Zeile, beim Kauf im Ausland „Regierungsvertrag“.
- Schwere: 2 · Aufwand: mittel

**G-29 · Staatsführungen ohne Namen**
- Ort: Weltlage › „Die Staatsführungen“ (`au_weltlage2`); `ui/welt/Aussenlage.tsx:222-243`
- Art: Design
- Befund: Acht Porträts mit Ländernamen statt Personen („Europäische Union“ als bärtiger Mann mit Brille), dazu zwei Balken ohne Zahl. In der Länderakte selbst gibt es kein Porträt.
- Warum es stört: Suzerain lebt von Personen. Ein Gesicht ohne Namen ist Dekoration.
- Vorschlag: Porträt mit Namen und Amt in den Kopf der Länderakte (Plan D, L1); das Raster in der Weltlage streichen.
- Schwere: 2 · Aufwand: mittel (Namen sind fiktiv zu wählen oder als Amt zu nennen, „der Präsident Russlands“)

**G-30 · Konfliktdossier: Knopfwand und gleich gefärbte Balken**
- Ort: `kr1_krise2`, `kr7_wr0`; `ui/welt/KriegDossier.tsx:79-110,155-171`
- Art: Design
- Befund: In der Spannung stehen zehn Knöpfe untereinander, jeder mit zwei Zeilen Text; die Phase steht nur als Wort im Kopf. Eskalation, Frontlage und Rückhalt haben denselben Verlauf von Ocker nach Braun, egal ob gut oder schlecht.
- Warum es stört: Der Spieler sieht nicht, wo er auf dem Weg zum Krieg steht; die Balken sagen nichts über gut und schlecht.
- Vorschlag: Phasenleiter (Spannung → Drohkulisse → Beschluss → Krieg → Waffenruhe → Frieden) als sechs Punkte oben; je Phase höchstens vier Hauptknöpfe, der Rest unter „Weitere“; Frontbalken zweifarbig (eigene Farbe gegen Gegnerfarbe) mit Mitte 50.
- Schwere: 2 · Aufwand: mittel

**G-31 · Zivile Bauten in der Rüstungsliste ohne Kennzeichnung**
- Ort: 038 „Im Bau“: „Kernkraftwerk Akkuyu INFRASTRUKTUR“, „Wiederaufbau im Erdbebengebiet INFRASTRUKTUR“
- Art: Konsistenz
- Befund: Die gemeinsame Bauliste zeigt zivile Vorhaben gleichrangig an Platz 1 und 2 der Rüstung; nur ein winziges Wort (11 px, Rundgang-Messung) unterscheidet.
- Warum es stört: Der Spieler hält Akkuyu für ein Rüstungsprojekt oder versteht nicht, warum er es hier verschieben kann.
- Vorschlag: Zivile Zeilen ausgegraut mit Etikett „zivil“ (Plan D, T4) und Kapazitätsbalken militärisch dunkel, zivil hell.
- Schwere: 2 · Aufwand: klein

**G-32 · Was ein türkischer Präsident hätte, fehlt als Hebel**
- Ort: Außen und Sicherheit insgesamt
- Art: Sinn
- Befund: Die großen Dauerthemen stehen nur als Text oder Ereignis, nicht als stellbare Position: Ägäis (Hoheitsgewässer 6 oder 12 Seemeilen, Inselmilitarisierung, Luftraum), „Blaue Heimat“ und die Seegrenze mit Libyen, die Zypernfrage (Föderation oder zwei Staaten, Varosha), Syrien (Integration der SDF, Rückkehr, Pufferzone), Energiekorridore (TANAP, TurkStream, Entwicklungsstraße Irak, Gasdrehscheibe Thrakien), die Basen Incirlik und Kürecik als Hebel gegenüber den USA, Diaspora-Politik (Doppelpass, Wahlrecht, Moscheeverbände). Gegenüber HOI4 fehlen Verbände, Fronten, Nachschubwege, Generäle, Friedenskonferenz auf der Karte.
- Warum es stört: „Hinter jeder Entscheidung muss etwas stecken“: Die Themen, über die türkische Außenpolitik wirklich entschieden wird, kann man nicht entscheiden.
- Vorschlag: Je Nachbar eine „Kernfrage“ als Regler mit benannten Zuständen und Preis, etwa Ägäis: „6 Seemeilen (Stand) · Ausdehnung angekündigt · 12 Seemeilen beansprucht“, mit Folgen (Griechenland Konflikt, EU, Nationalisten). Zypern: „Föderation · Status quo · Zwei Staaten“. Energie: Korridore als Bauvorhaben auf der Karte. Quellen: AUSSENPOLITIK.md, RECHERCHE_GLM_7_GEOSTRATEGIE.md.
- Schwere: 2 · Aufwand: groß

**G-33 · Botschafter zurückschicken: Vorschau ohne Land**
- Ort: Instrumente (`au_instr0`); `sim/diplomatie.ts:613-614` (Vorschau) mit `landId` undefiniert
- Art: Sprache
- Befund: „Vertrauen +4“, „Konflikt mit −3“, obwohl kein Botschafter abberufen ist.
- Warum es stört: Ein Satzrest; die Karte steht da, obwohl sie nichts tun kann.
- Vorschlag: Karte erst zeigen, wenn ein Botschafter abberufen ist; sonst eine Zeile „Kein Botschafter abberufen“.
- Schwere: 3 · Aufwand: klein

**G-34 · Gegenwart 2026 in einem Spiel, das 2028 beginnt**
- Ort: `daten.abkommen.texte.RUS.gas_kauf.text` („laufen Ende 2026 aus“), `netz.knoten.gasabhaengigkeit.text`, Vermittlung Armenien („seit August 2025 paraphiert“), Zypern („Das UN-Verhandlungsfenster um 2026“)
- Art: Sprache
- Befund: Die Texte sprechen von 2026 als Zukunft oder Gegenwart.
- Warum es stört: Der Spieler steht im Juni 2028; die Welt wirkt eingefroren.
- Vorschlag: In die Vergangenheit setzen: „Die großen Gasverträge mit Russland liefen Ende 2026 aus; jetzt geht es um rund 22 Milliarden Kubikmeter im Jahr.“
- Schwere: 3 · Aufwand: klein

**G-35 · Dasselbe Vorhaben in zwei Formaten**
- Ort: Eurofighter in der Sicherheitslage „6 Kapital · 1.000 Bau · 36 Mon. · +0,5 Pp. Schulden · 1,5 Verwaltung“ gegen Beschaffung „6 Kapital · 3 Jahre · 0,5 % BIP“
- Art: Konsistenz
- Befund: Monate gegen Jahre, „Pp. Schulden“ gegen „% BIP“, einmal mit Bau und Verwaltung, einmal ohne.
- Warum es stört: „Gleiches muss gleich aussehen.“ Ob 0,5 einmalig oder jährlich ist, bleibt offen.
- Vorschlag: Ein Preisband für alle Vorhaben: „6 Kapital · 36 Monate · Schulden +0,5 % des BIP (einmalig) · Unterhalt 0,9 im Jahr“.
- Schwere: 3 · Aufwand: klein

**G-36 · Lageurteil nennt null Konflikte „auffällig“; das Knopfziel ist zufällig**
- Ort: 039 „Lage: gemischt · Auffällig: Abschreckung: 55 · Laufende Konflikte: 0“; `ui/akte/Bereiche.tsx:113-119` (Ton „mittel“ schon bei angespannten Ländern), `Bereiche.tsx:330` mit `:446` (Knopf nennt den zuletzt offenen Reiter: „Rüstung und Beschaffung öffnen“)
- Art: Logik
- Befund: Null laufende Konflikte stehen als Grund für „gemischt“. Der große Knopf führt in die zuletzt besuchte Ansicht, nicht in die zur Lage passende.
- Warum es stört: Der Satz klingt wie ein Fehler; der Knopf führt mal hierhin, mal dorthin.
- Vorschlag: „Auffällig: 5 Länder angespannt“ statt „Laufende Konflikte: 0“; Knopf fest „Zur Konfliktlage“.
- Schwere: 3 · Aufwand: klein

**G-37 · „Laufende Vorhaben 5 · 0 von 4“**
- Ort: 037; `ui/militaer/Streitkraefte.tsx:115,154-160`
- Art: Zahl
- Befund: Fünf laufen, die Kapazität zeigt „0 von 4“, weil die Startbeschaffungen nicht zählen.
- Warum es stört: Unverständlich ohne Kenntnis des Codes.
- Vorschlag: „5 laufen · 4 freie Plätze für neue Aufträge“.
- Schwere: 3 · Aufwand: klein

**G-38 · G20 als Bündnis der Türkei**
- Ort: 039 „Bündnisse der Türkei: Nordatlantikpakt · Organisation der Turkstaaten · G20 · Beistandspakt von Mekka“
- Art: Sprache
- Befund: Die G20 ist ein Gesprächsforum, kein Bündnis; die Turkstaaten-Organisation hat keine Beistandspflicht.
- Warum es stört: Ein Spieler könnte Beistand erwarten.
- Vorschlag: Überschrift „Mitgliedschaften“, Bündnisse mit Beistandspflicht (NATO, Mekka-Pakt) mit Schild-Symbol.
- Schwere: 3 · Aufwand: klein

**G-39 · Krieg mit Russland oder Griechenland wie mit jedem Nachbarn (Vermutung)**
- Ort: `sim/krieg.ts:1337-1350` (Russland „see“, also kriegsfähig), Konfliktlage zeigt Russland mit „Konfliktdossier öffnen“
- Art: Logik
- Befund: Ein Krieg gegen eine Atommacht oder ein NATO-Mitglied durchläuft dieselben Phasen; eine eigene Schwelle (nukleare Abschreckung, NATO-Spaltung, Artikel 4) habe ich im Code nicht gefunden.
- Warum es stört: Unglaubwürdig; ein Krieg gegen Russland wäre eine andere Kategorie.
- Vorschlag: Für Atommächte keine Bodenoffensive, Eskalationsdeckel und Ereignis „Atomare Drohung“; für NATO-Mitglieder Ereignis „Krisensitzung des Nordatlantikrats“ mit Folgen für die Mitgliedschaft.
- Schwere: 3 · Aufwand: mittel

**G-40 · Widerstand mit Kommastellen**
- Ort: Besetzte Regionen; `ui/krieg/Besatzung.tsx:39` (`zahl(b.widerstand)` ohne Stellenangabe, bis zu zwei Nachkommastellen)
- Art: Zahl
- Befund: Regel 10 (Indizes ohne Kommastelle).
- Warum es stört: „Widerstand 47,35“ wirkt pseudogenau.
- Vorschlag: `zahl(b.widerstand, 0)`.
- Schwere: 3 · Aufwand: klein

**G-41 · „noch kein Verlauf“ unter jeder Zahl**
- Ort: Länderakte › Überblick, Kacheln Wachstum und Inflation; `ui/welt/WeltLage.tsx:11`
- Art: Design
- Befund: Am Spielstart steht unter jeder Kachel kursiv „noch kein Verlauf“.
- Warum es stört: Leerer Platzhalter, der wie ein Fehler aussieht.
- Vorschlag: Ohne Verlauf nichts anzeigen.
- Schwere: 3 · Aufwand: klein

**G-42 · Dienst und Vermittlung: Jargon und leere Spalte**
- Ort: `ui.welt.Dienst.3515c0b` („Verdeckte Operationen sind Spielmechanik: …“), `ui2.ui.welt.Vermittlung.63606da` („Reif {p0} · Konflikt {p1} · ZOPA {p2}“), „TRIPP“ ohne Erklärung; `ui/Welt.tsx:166-167` (linke Spalte nur ein Satz)
- Art: Sprache
- Befund: „ZOPA“ ist ein englisches Fachkürzel, „Reif“ ein Adjektiv ohne Nomen, „Spielmechanik“ spricht über das Spiel statt in ihm. Links bleibt eine 270 px breite Spalte fast leer.
- Warum es stört: Regel 10 (kein Fachjargon, keine englischen Reste).
- Vorschlag: Neufassungen in Abschnitt 3; die linke Spalte bei Dienst und Vermittlung für die Liste der Zielstaaten bzw. Konflikte nutzen.
- Schwere: 3 · Aufwand: klein

**G-43 · Kaputter Satz unter der Bauliste**
- Ort: 038; `ui/Reich.tsx:215`, `ui2.ui.Reich.90f1a97` + `ui.Reich.119c095`
- Art: Sprache
- Befund: „öffentlich: Position 1 baut zuerst; vorziehen kostet 10 Verwaltungskraft je Position Die Schätzungen gelten, …“: klein begonnen, Rest eines alten Etiketts, fehlender Punkt, „verdrängt ehrlich“.
- Warum es stört: Sieht unfertig aus.
- Vorschlag: Siehe Abschnitt 3.
- Schwere: 3 · Aufwand: klein

**G-44 · Doktrinen ohne Wirkungszeile**
- Ort: Beschaffung und Doktrinen (`si_beschaffung2`): „Doktrin: Drohnenverbund · 5 Kapital · 6 Monate“ ohne Wirkung
- Art: Funktion
- Befund: Andere Karten nennen ihre Wirkung, Doktrinen nicht, obwohl sie im Krieg multiplikativ wirken (`sim/krieg.ts` `eigenStaerke`, `doktrinPassung`).
- Warum es stört: Der Spieler wählt eine sich ausschließende Doktrin blind.
- Vorschlag: „Im Krieg ×1,15, wenn Drohnen Generation 4 und Luftabwehr ausgebaut; schließt die anderen aus.“
- Schwere: 3 · Aufwand: klein

**G-45 · Länge über der Grenze**
- Ort: 035 (1,75), 036 (2,51), 038 (2,18), 039 (2,11), Kriegsdossier (rund 4), Verhandlungstisch, Dienst, Vermittlung (je rund 2,5 bis 3)
- Art: Design
- Befund: Regel 2 (höchstens 1,5 Bildschirme) ist in sieben von neun Ansichten des Bereichs verletzt.
- Warum es stört: „Extrem lang gezogen“.
- Vorschlag: Mit G-5, G-8, G-9 und G-11 fällt die Hälfte weg; Klausellisten des Verhandlungstisches als Chips (Plan D, L3).
- Schwere: 2 · Aufwand: mittel

---

## 3. Wortprüfung

Neufassungen, Schlüssel: alt → neu.

- `daten.abkommen.klausel.vermittlung_zusage.text`: „… Erdoğans Draht zu beiden Seiten als Werkzeug.“ → „… der Draht des Präsidenten zu beiden Seiten als Werkzeug.“
- `daten.abkommen.texte.RUS.gas_kauf.text`: „Die Gasverträge mit Russland laufen Ende 2026 aus; …“ → „Die großen Gasverträge mit Russland liefen Ende 2026 aus; jetzt geht es um rund 22 Milliarden Kubikmeter im Jahr.“
- `sim2.sim.laender.6925a44`: „… Seit 2026 läuft die Kooperation im Two-Track weiter: …“ → „… Seit 2026 arbeiten beide in einzelnen Feldern zusammen: Sicherheit, Energie und Migration ja, Visafreiheit und eine modernisierte Zollunion nur gegen Reformen.“
- `sim2.sim.laender.4be68dc`: „… die sektorale Kooperation (Two-Track seit 06/2026) ersetzt das nicht.“ → „… die Zusammenarbeit in einzelnen Feldern seit Juni 2026 ersetzt das nicht.“
- `sim2.sim.eu.d96bd17`: „… Der Two-Track — Sicherheit, Energie, Migration — ersetzt keine Perspektive.“ → „… Die Zusammenarbeit bei Sicherheit, Energie und Migration ersetzt keine Beitrittsperspektive.“
- `sim2.sim.laender.0e162e9`: „Kostet {p0} Kapital und etwa 0,1 % des BIP.{p1}“ → bei Lieferung an Partner „Bringt Aufträge und Einnahmen (etwa 0,1 % des BIP); kostet {p0} Kapital.{p1}“
- `sim2.sim.laender.4cf8cec`: „Gespräche über Streitpunkte; das Land will dafür ein Zeichen des Entgegenkommens.“ → „Gespräche über Streitpunkte: Der Streit kühlt ab, Nationalisten sehen Schwäche.“
- `sim2.sim.laender.2310288`: „Kostet {p0} Kapital. Fotos und Zusagen kosten nichts, gehalten werden müssen sie trotzdem.“ → „Kostet {p0} Kapital. Je besser das Verhältnis, desto weniger bringt der nächste Gipfel.“
- `ui.welt.Dienst.3515c0b`: „Verdeckte Operationen sind Spielmechanik: Sie kosten …“ → „Verdeckte Operationen kosten Kapital und einen Teil der knappen Kapazität, gelingen selten sauber und können auffliegen. Die Welt erfährt nur, was auffliegt.“
- `ui2.ui.welt.Vermittlung.63606da`: „Reif {p0} · Konflikt {p1} · ZOPA {p2}“ → „Reife {p0} · Konflikt {p1} · Spielraum für eine Einigung: {p2}“
- `daten.abkommen.texte.AZE.w_transit.text`: „… die Verbindung über TRIPP …“ → „… die von den USA betriebene Transitstrecke durch Sangesur (TRIPP) …“ (Kürzel nur nach der Erklärung)
- `ui2.ui.Reich.90f1a97`: „öffentlich: Position 1 baut zuerst; vorziehen kostet {p0} Verwaltungskraft je Position“ → „Platz 1 wird zuerst gebaut. Einen Platz vorziehen kostet {p0} Verwaltungskraft.“
- `ui.Reich.119c095`: „… Vorziehen ist eine Entscheidung mit Preis: Es kostet Verwaltungskraft und verdrängt ehrlich das überholte Vorhaben.“ → „Die Schätzungen gelten, solange Kapazität und Reihenfolge bleiben. Wer vorzieht, zahlt Verwaltungskraft, und das überholte Vorhaben wird später fertig.“
- `krieg.d.kopf`: „Konfliktvorgang: {phase}“ → „{phase} mit {land}“ (kein Amtsdeutsch)
- `krieg.d.front.titel`: „Abstrakte Frontlage (100 = Sieg, 0 = Zusammenbruch), Woche {woche}“ → „Frontlage in Woche {woche}: 100 heißt Sieg, 0 Zusammenbruch.“
- `krieg.d.woche`: „Woche {woche} · Verluste {verluste} · {mobil}“ → „Woche {woche} · {mobil}“ (Gefallene eigene Zeile, abstrakte „Verluste“ streichen)
- `krieg.k.h.weiter.hinweis`: „Zurück an die Front: die Uhr verliert 5 Punkte, die Heimatfront ist irritiert.“ → „Zurück an die Front: Der Rückhalt im Land sinkt um 5.“
- `krieg.k.h.waffenruhe.hinweis`: „… gilt das Angebot zu Hause als Schwäche (Uhr −3).“ → „… gilt das Angebot zu Hause als Schwäche (Rückhalt −3).“
- `krieg.k.h.mobil_voll.hinweis`: „… städtische Säkulare −2, die Uhr trägt die Last.“ → „… städtische Säkulare −2, Rückhalt im Land −5.“
- `krieg.k.h.paket.hinweis`: „{text} Annahme-Aussicht etwa {aussicht} %. Der Innenpreis steht schon jetzt fest (freie Presse verteuert ihn).“ → „{text} Annahme etwa {aussicht} %. Preis daheim: Zustimmung −{po}.“
- `krieg.k.h.rueckzug`: „Still zurückziehen“ → „Krise still beenden“
- `krieg.ui.kraft`: „eigene Kräfte {p}“ → streichen oder „Kampfkraft {p} % des Stands 2026“
- `ui.welt.KriegDossier.66712ad`: „Die Aufmerksamkeit des Staates ist ausgeschöpft: Zwei Konfliktvorgänge laufen bereits.“ → „Zwei Konflikte laufen schon; mehr verkraften Armee und Verwaltung nicht.“
- `ui.welt.KriegDossier.c605cdb`: „In dieser Phase gibt es keine Handlung; der Vorgang folgt seiner eigenen Logik.“ → „Das Parlament stimmt in {tage} Tagen ab. Bis dahin können Sie nur warten.“
- `militaer.ui.einheit.index`: „{n} %“ → benannter Zustand „wie 2026“ / „+{n} % gegenüber 2026“ / „−{n} % gegenüber 2026“
- `militaer.ui.innovation`: „Wissensbasis“ → „Forschungsstand“; `militaer.ui.innovation_wert`: „{p} von 100“ → „{p}“
- `militaer.ui.etat_wert`: „{p} % von 2026“ → „{p} % des Etats 2026“
- `militaer.ui.kapazitaet_wert`: „{belegt} von {kap}“ → „{frei} freie Plätze für neue Aufträge“
- `militaer.ui.ziel_gegenwehr`: „Gegenwehr ×{f}“ → „Gegenwehr leicht / mittel / schwer“
- `militaer.zielraum.cyp_schutz`: „Schutzzone Nordzypern“ → „Pufferzone und Süd-Nikosia“
- `ui2.ui.welt.Block.578b67d`: „nicht verweigert“ → „kein Veto“; `ui/welt/Block.tsx:40` „blockiert (…)“ → Schlüssel „blockiert durch {namen}“; „erreicht“/„verfehlt“ → Schlüssel
- `ui2.ui.Welt.e92d8d2`: „Zum Vergleich (letzter Wert)“ → entfällt (Tabelle streichen)
- `ui2.ui.welt.WeltLage.55a2100`: „Verdeckte Optionen im Wahlkampf ansehen →“ → „Verdeckt auf die Wahl einwirken →“
- `aussen.ui.kz.sicherheit`: „Sicherheitslage“ (Text „100 minus Terrorgefahr“) → in die Sicherheit verlegen als „Schutz vor Terror“; nicht denselben Namen wie der Reiter verwenden
- Überschrift Sicherheitslage „Bündnisse der Türkei“ → „Mitgliedschaften“
- Fest verdrahtet, in Kataloge verschieben (jeweils mit en/tr):
  - `ui/Welt.tsx:34-39` Dimensionen „Handel, Sicherheit, Vertrauen, Konflikt“ und ihre Erklärsätze
  - `ui/Welt.tsx:41-46` „Inflation, Arbeitslosigkeit, Wirtschaftswachstum, Verteidigungsausgaben, % des BIP“
  - `ui/Welt.tsx:102` „ · Streit“; `:236` „★ Beitritt“; `:353` „{name}: Ansicht“; `:373` „dafür / Enthaltung / dagegen“
  - `sim/laender.ts:277-278` „Gipfeltreffen“, „Handelsabkommen“ (auch die Erinnerungsnotizen `:492` und `Handelsabkommen ${Jahr}`)
  - `sim/laender.ts:391-397` und `sim/welt-sicht.ts:67-75` „enger Partner, Partner, angespannt, nüchtern, kühl, feindselig“
  - `sim/laender.ts:413` „Handel, Sicherheit, …“, dazu „mindestens“/„höchstens“; `:519` „ und “, „ sieht das mit Sorge.“
  - Anliegen-Titel `sim/laender.ts:76` ff.: „Freie Medien“, „Akkuyu vollenden“, „Kontrollierte Migration“, „Handel trotz Sanktionen“, „Gasabnahme“, „Partnerschaft statt Konkurrenz“, „Der Mittlere Korridor“, „Die Meerengen geschlossen halten“, „Ein ehrlicher Vermittler“, „Das Seegrenz-Memorandum halten“, Text „Abstimmung statt Stellvertreterkonkurrenz.“
  - Zusagen-Absender „EU-Kommission“, „US-Regierung“ (`sim/laender.ts:505,508`)
  - `sim/welt-sicht.ts:21-30` „Nachbarn“, „EU-Staaten“; `data/welt-institutionen.ts:124-131` „Alle, Nachbarn, EU-Staaten, Golf, Turkstaaten“; Kürzel `:62` „SOZ“ (en „SCO“, tr „ŞİÖ“), `:84` Name „Golfstaaten (Golf-Kooperationsrat)“
  - `sim/welt-modell.ts:463` „türkeifeindlich, neutral, türkeifreundlich“; `:1050-1059` Regierungsformen und „stabil, gefestigt, brüchig“
  - `data/welt-daten.ts:52-58` Wahlarten „Präsidentenwahl“, „Zwischenwahlen“, „Dumawahl“
  - `ui/welt/WeltLage.tsx:65-77` Einheit „% BIP“ (tr „% GSYH“, en „% of GDP“) und „Punkte“
  - Namen weiterer Staaten in der Liste („Brasilien“, „Indien“, „Vereinigtes Königreich“) über `laendernamen`
  - `ui/Welt.tsx:50`, `ui/militaer/Streitkraefte.tsx:29`: `toLocaleString("de-DE")` → `zahl()`
- Uneinheitliche Begriffe: „Uhr“, „Erschöpfungsuhr“, „Heimatfront“ und „Rückhalt im Land“ für dieselbe Größe → überall „Rückhalt im Land“. „Spannung“ (Konfliktlage), „Konflikt“ (Länderakte) und „Eskalation“ (Dossier) für verwandte Werte → je einmal erklären oder auf zwei Begriffe zurückführen. „angespannt“ ist zugleich Haltungswort, Lagestufe und Ampelwort → für die Haltung „gespannt“ oder „gereizt“.

---

## 4. Die fünf wichtigsten Verbesserungen

**1. Den Krieg auf die Karte holen (G-1, G-11, G-21, G-30)**
Bild: Klick auf Sicherheit öffnet die Lagekarte; die Akte rückt als Seitenleiste nach rechts, die Karte bleibt links frei (Plan D, Seitenakte).

```
+---------------------------------------------+-------------------------+
| ZYPERN  [Nikosia: umkämpft] [Larnaka] ...   | Krieg mit Zypern        |
|   ====>  Front (rot/blau Kante)  ~~~>       | o-o-o-●-o-o  Phase      |
|   [Korps 1 · Heer 92 %] [Luft 100 %]        | Front 65 ▲  Rückhalt 87 |
|   (Pfeile bewegen sich jede Woche)          | Zielraum: Pufferzone ▼  |
|---------------------------------------------| 3 Handlungen + Preis    |
| Einsatz: [Luft][Boden][See][Verbündete]     | Pakete mit Innenpreis   |
| Tempo:   [vorsichtig][normal][hart]  46:30  |                         |
+---------------------------------------------+-------------------------+
```
Wirkung: Jede Woche wandern Pfeile, Regionen färben sich um, Verbände verlieren Prozente. Klick auf eine Zielfläche wählt den Zielraum (mit Bestätigung „4 Kapital, Moral −2“). Der Spieler sieht den Krieg statt ihn zu lesen.

**2. Das Kriegsdossier ehrlich und kurz machen (G-2, G-3, G-5, G-6, G-18, G-20)**
Eine Seite: Phasenleiter oben, darunter Front, Rückhalt, Gefallene, ein Antwortstreifen nach jeder Handlung („Zypern lehnt den Siegerfrieden ab: Aussicht 5 %“), höchstens vier Handlungen je Phase, Friedenspakete mit Innenpreis. Versorgung als eine Zeile mit Sprung. Mindestdauern je Phase (Drohkulisse ab Tag 21, Mobilmachung mit Anlaufbalken), Erlass nur nach einem Angriff. Wirkung: Die Krise wird zur Spielfläche mit Zeit für Gegenzüge; jeder Klick hat ein sichtbares Ergebnis.

**3. Ein Rüstungsmodell mit einem Datum je Gerät (G-4, G-12, G-13, G-28, G-31, G-35)**
Oben ein Radar (Heer, Luft, See; Fläche Kampfkraft gegen Bereitschaft), Abweichungen als „+12 % gegenüber 2026“ statt „100 %“. Darunter eine Bauliste, in der KAAN, Eurofighter, F-16, Stahlkuppel und Altay je einmal mit einem Fertigdatum stehen; Laufendes wird nicht erneut angeboten; zivile Zeilen grau. Jedes Vorhaben mit eigenem Bild und einem einheitlichen Preisband. Wirkung: Die Akte beantwortet in fünf Sekunden „wo bin ich schwach, was kommt wann“.

**4. Außen auf zwei Ebenen und eine Geste je Sache (G-8, G-9, G-10, G-25, G-26, G-29, G-32)**
Ebene 1 „Welt“: die Karte mit Beziehungsfarben, Konflikt- und Vertragslinien, rechts „Brennpunkte“ (höchstens fünf Zeilen) und vier Regler (EU-Annäherung, Grenzschutz, Rückkehr, Diplomatischer Dienst). Ebene 2 „Länderkarte“: Porträt mit Name, „Was sie wollen“ mit Regler und Soll-Marke in benannten Stufen, „Was wir anbieten“ (Verhandlungstisch), eine Gestenzeile (Staatsbesuch mit Tagesordnung, Handel, Waffen liefern/kaufen, Druck, Entschärfen, Hilfe, Botschafter, Sanktion), dazu die Kernfrage des Nachbarn als Regler (Ägäis: 6 sm · Ausdehnung angekündigt · 12 sm). Terror, Friedensprozess und Grenze wandern in die Sicherheit. Wirkung: halb so lang, nichts doppelt, und die Themen echter türkischer Außenpolitik werden entscheidbar.

**5. Sprache und Übersetzung des Bereichs bereinigen (G-7, G-27, G-34, G-42, G-43, Abschnitt 3)**
Alle fest verdrahteten Wörter (rund 60 Stellen, Liste oben) in die Kataloge, türkische und englische Abkürzungen (GSYH, ŞİÖ, SCO), Zahlen über `zahl()`; Erdoğan, „Two-Track“, „ZOPA“, „Spielmechanik“, „Uhr“ ersetzen; 2026-Texte in die Vergangenheit setzen. Ein Test rendert die Außenakte in `en` und `tr` und schlägt bei deutschen Wörtern an. Wirkung: Der Bereich wirkt in allen drei Sprachen fertig.

---

## Nicht geprüft

- **3D-Karte und Kriegseffekte:** Der kopflose Browser zeigt nur die 2D-Ersatzkarte („Dieses Gerät zeigt keine 3D-Grafik“). Ob `kriegsfx.ts` auf der 3D-Karte mehr zeigt (Regionen, Pfeile), konnte ich nicht sehen; das Urteil G-1 gilt für die 2D-Karte und für das Fehlen von Verbänden und Fronten im Code.
- **Besatzung und Annexion:** Der Siegerfrieden wurde abgelehnt; die Ansicht „Besetzte Regionen“ habe ich nur aus dem Code beurteilt.
- **Verlauf der Weltlage, EU-Beitrittsdossier, Verträge mit laufendem Vertrag, Initiativen der Länder** nur kurz im Code, nicht im Spiel über Monate.
- **Determinismus:** Der Außenminister hieß im Rundgang „Taner Özgür“, in meinem Lauf „Murat Arıkan“; vermutlich ein zufälliger Samen bei `?schnellstart`. Nicht weiter verfolgt (Bereich des Kabinetts).
- Belegprüfung der Recherchedateien (RECHERCHE_GLM_4/7/10) Zeile für Zeile: nur Stichproben (Personal, KAAN, Eurofighter, F-16, S-400, TF-2000); die Quelle beim TF-2000 verweist auf die Wikipedia-Seite der TCG Anadolu und sollte ersetzt werden.
