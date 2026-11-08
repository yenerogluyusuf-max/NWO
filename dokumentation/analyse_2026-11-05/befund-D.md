# Befund D: Wirtschaft und Haushalt

Prüfer D, 5. November 2026. Maßstab: `AUFTRAG.md`. Geprüft wurden der Code (`ui/wirtschaft/`, `ui/gueter/`, `sim/haushalt*.ts`, `sim/staatsfinanzen.ts`, `sim/staatsgeld.ts`, `sim/zentralbank.ts`, `sim/eingriffe.ts`, `sim/economy.ts`, `sim/maerkte.ts`, `sim/wirtschaft*.ts`, `data/haushaltsplan.ts`, `data/szenario_tuerkei_2026-09-25.json`), die Kataloge `haushalt`, `staatsfinanzen`, `haushaltsbericht`, `haushaltsmehrheit`, `haushaltshilfe`, `kennzahlen`, `markt` sowie die Wirtschaftsschlüssel in `simtexte*.json` (de, Stichproben en und tr). Dazu kamen die Rundgangbilder 016 bis 021 und eigene Läufe mit kopflosem Playwright: Haushalt ganz gescrollt, Steuer- und Bildungsregler bewegt, ein Nachtrag beschlossen, das Rad überfahren, die vier Teile der Zentralbank, Versorgung mit aufgeklappten Waren, Englisch und Türkisch, und ein Lauf bis zum Haushaltsfenster am 3. Oktober 2028 mit dem Paket „Konsolidieren“.

Eigene Bilder liegen unter `/private/tmp/claude-501/-Users-yusufyeneroglu/904f44f4-7b5f-44c2-9447-c69e44ab880b/scratchpad/analyse-D/`: `hh_0–2.png` (Haushalt), `st_panel.png`, `st_folgen.png` (Steuerregler), `rad_hover.png`, `okt_0–4.png`, `okt_paket.png` (Haushaltsfenster), `zb_*.png`, `zbteil1–3.png`, `wl_*.png`, `vh_*.png`, `vhd_*.png`, `bi_0.png`, `kr_*.png`, `l_en_*.png`, `l_tr_*.png`.

**Was gut ist und bleiben soll:**
- Das Haushaltsrad: außen die Ausgaben, innen die Einnahmen samt schraffierter „Neue Schulden“, und die Mitte zeigt beim Darüberfahren Stück und Betrag (`rad_hover.png`). Es ist das stärkste Bild des Bereichs.
- Die Zinsskala der Zentralbank (Leitzins, Inflation, Erwartung, Pfeil zur nächsten Sitzung). Sie beantwortet „Wo steht der Zins?“ auf einen Blick.
- Preisfeld am Regler mit Kapital, Defizit vorher und nachher, Gewinnern und Verlierern.
- Das Oktoberfenster mit doppeltem Preis für Nachträge ist ein echter Zeitdruck nach Suzerain-Art.
- Das Fortschreiben des Vorjahrshaushalts bei Scheitern entspricht sinngemäß Art. 161 der türkischen Verfassung.
- Die Wirkungskette mit Verzögerungen (Zins nach etwa 6 Monaten, Lira binnen Tagen) passt zu `WIRTSCHAFTSMODELL.md` Z1 bis Z9 und zu `PARAMS.rateLagMonths = 6` (`sim/economy.ts`).
- Die Warenrechnung je Gruppe (Vorrat, Produktion, Einfuhr, Ausfuhr, Lieferländer) hat echte Tiefe.

---

## 1. Ansichten

**Haushalt (Bild 017, eigene `hh_0–2.png`)**
- Frage der Seite: Wohin geht das Geld, woher kommt es, wie groß ist die Lücke, und was kostet es, das zu ändern?
- Antwort: ja für die erste Hälfte (Rad), teilweise für die zweite. Das größte graue Stück „Öffentlicher Dienst und Übriges“ ist ein unerklärter Rest. Steuern haben keinen Satz.
- Länge: 2,82 Bildschirme (Grenze 1,5).
- Noten: Schönheit 2, Verständlichkeit 3, Sinn 3, Spielgefühl 3.
- Urteil: Das Rad ist gelungen. Darunter steht eine lange Liste mit Stufenreglern, die ohne Steuersätze, ohne Ministeriumsebene und mit einem Ministerwunsch ohne Wirkung auskommt.

**Haushalt › Reglerfeld und „Folgen über zwölf Monate“ (`st_panel.png`, `st_folgen.png`)**
- Frage der Seite: Was kostet diese Änderung, und was folgt daraus?
- Antwort: teilweise. Kapital, Defizit, Gewinner und Verlierer stehen richtig da, die Folgenliste aber ist voller interner Kürzel und falsch gerichteter Begründungen.
- Länge: Das aufgeklappte Feld wächst um rund 1,5 Bildschirme.
- Noten: Schönheit 3, Verständlichkeit 3, Sinn 2, Spielgefühl 3.
- Urteil: Preis und Wirkung stehen am Regler, wie verlangt, aber die Texte darunter sind Werkstattsprache.

**Haushalt im Oktoberfenster (`okt_0–4.png`, `okt_paket.png`)**
- Frage der Seite: Was soll im Haushalt des nächsten Jahres stehen, und reicht die Mehrheit?
- Antwort: ja (Entwurfsliste, Pakete, 340/301).
- Länge: über 3 Bildschirme.
- Noten: Schönheit 3, Verständlichkeit 2, Sinn 2, Spielgefühl 2.
- Urteil: Hier fühlt sich der Haushalt am meisten nach Regieren an. Störend sind „Haushaltsgesetz 2.029“ und Pakete, deren Inhalt man erst nach dem Klick sieht.

**Zentralbank und Devisen (Bild 019, `zb_*.png`, `zbteil1–3.png`)**
- Frage der Seite: Was macht die Bank als Nächstes, und was kann ich dagegen tun?
- Antwort: ja (Zinsskala mit Pfeil, Datum der nächsten Sitzung, fünf Wege).
- Länge: 1,99 Bildschirme.
- Noten: Schönheit 2, Verständlichkeit 2, Sinn 2, Spielgefühl 2.
- Urteil: Der beste Teil des Bereichs. Ihn stören deutsche Reste in en/tr, die „Z1“-Kürzel, „Stufe B“ und eine Option, die Kapital kostet und nichts bewirkt.

**Wirtschaftslage (Bild 020, `wl_0–2.png`)**
- Frage der Seite: Was brennt in der Wirtschaft?
- Antwort: nein. Oben steht eine Liste mit 21 flachen Linien statt eines Bildes; ob etwas rot ist, sieht man nicht auf einen Blick.
- Länge: 2,81 Bildschirme.
- Noten: Schönheit 3, Verständlichkeit 3, Sinn 2, Spielgefühl 3.
- Urteil: Gute Einzeldetails (Treiber, Ländervergleich, Handlungen), aber eine Tabellenseite. Der fertige Baustein `ui/bausteine/Tacho.tsx` wird nirgends benutzt.

**Versorgung & Handel (Bild 018, `vh_0–1.png`, `vhd_*.png`)**
- Frage der Seite: Was fehlt dem Land, und woher kommt es?
- Antwort: nein. Der erste Bildschirm zeigt dreimal „—“, die 15 Warengruppen liegen zugeklappt ganz unten.
- Länge: 1,58 Bildschirme zugeklappt, rund 8 aufgeklappt.
- Noten: Schönheit 3, Verständlichkeit 3, Sinn 3, Spielgefühl 3.
- Urteil: Der wertvollste Inhalt (Deckung je Ware, Tage ohne Einfuhr) ist versteckt, das Leere steht oben.

**Bilanz & Entwicklung (Bild 021, `bi_0.png`)**
- Frage der Seite: Wie hat sich die Lage seit Amtsantritt entwickelt?
- Antwort: nein. Sechs Linien, fünf davon flach, mit ISO-Monaten „2027-06“.
- Länge: 1 Bildschirm.
- Noten: Schönheit 3, Verständlichkeit 3, Sinn 4, Spielgefühl 4.
- Urteil: Eine Doppelung der Wirtschaftslage, die laut Plan (`PLAN_OBERFLAECHE_DETAIL`, Wirtschaft › Lage, Punkt 6) entfallen soll.

**Krisenrat (Bild 016, `kr_0–1.png`), nur kurz, weil er im Wirtschaftsreiter steht**
- Frage der Seite: Wie entlaste ich die Haushalte, und wie bekomme ich die Stimmen?
- Antwort: teilweise.
- Länge: 1,68 Bildschirme.
- Noten: Schönheit 3, Verständlichkeit 3, Sinn 3, Spielgefühl 3.
- Urteil: Er duzt den Spieler („Entlaste Haushalte“) und zeigt dieselbe Armutszahl zweimal in zwei Formaten (43 / 100 und 42,7 / 100).

**Aktenkopf Wirtschaft (auf allen Reitern)**
- Frage der Seite: Wie steht die Wirtschaft?
- Antwort: ja, aber doppelt. Inflation 31,5 % und Lira 49,0 stehen genauso in der Kopfleiste.
- Länge: 0,15 Bildschirme.
- Noten: Schönheit 2, Verständlichkeit 2, Sinn 4, Spielgefühl 3.
- Urteil: Verstößt gegen „Nichts doppelt“. Der Plan sieht schon Arbeitslosigkeit, Wachstum und Netto-Reserven vor.

---

## 2. Befunde

Schwere: 1 = bricht Sinn oder Spiel, 2 = deutlich störend, 3 = Feinschliff.

### Schwere 1

**D-1 · Logik · Steuern werden an zwei Orten gesteuert, und beide Stellen wissen nichts voneinander.**
- Ort: Haushalt › Einnahmen. `sim/haushalt.ts:148–153` (Posten `einkommensteuer`, `verbrauchsteuern`, `unternehmensteuer`, je 0,3 % BIP je Stufe) gegenüber Politik › Maßnahmen `m_einkommensteuer`, `m_mwst`, `m_koerperschaftsteuer` (`data/politiknetz.ts:266–268`, Kosten −1,5/−2,0/−0,8, gezeigt als Satz 40 %, 20 % und 25 % laut ENTSCHEIDUNGEN W, Nachtrag „Reglerstufen in Worten“).
- Befund: Beide wirken unabhängig auf das Defizit. Der Posten wirkt über `fiscalImpulse`, die Maßnahme über `policyCost` (`sim/netz.ts:487–494`). Hebt der Spieler die Mehrwertsteuer in der Politik an, bleibt die Haushaltszeile „Mehrwert- und Sonderverbrauchsteuern“ auf „Ausgangsstand“. Das Mehr an Einnahmen erscheint im Rad als *kleineres Ausgabenstück*: `policyCost` wird als Ausgabe „reformen“ gebucht (`sim/staatsfinanzen.ts:31`), und `radStuecke` füllt den Rest „Öffentlicher Dienst und Übriges“ aus der Differenz (`ui/wirtschaft/HaushaltsRad.tsx:48–49`).
- Warum es stört: Der Spieler stellt dieselbe Steuer an zwei Orten und kann sie doppelt erhöhen. Das Rad zeigt eine Steuererhöhung als Kürzung beim öffentlichen Dienst. Das bricht die Lesbarkeit des Haushalts.
- Vorschlag: Eine Steuer, eine Stelle. Die Einnahmenseite des Haushalts zeigt die Steuersätze; die Maßnahme `m_*steuer` ist nur noch das Gesetz zu diesem Satz (wie F1 für die Etats) und verlinkt in den Haushalt. Die Einnahme fließt in das passende Innenstück des Rads.
- Aufwand: groß.

**D-2 · Logik · Die Entscheidung F1 ist im Code nicht umgesetzt: Etat und gleichnamige Maßnahme kosten beide Geld.**
- Ort: `data/politiknetz.ts:838` `m_verteidigung` (Kosten 1,0), `:326` `m_renten` (1,2), `:330` `m_sozialhilfe` (0,6), `:422` `m_forschung` (0,3), `:832` `m_polizei` (0,3), `:648` `m_agrarsubventionen` (0,4), `:512` `m_energiesubventionen` (1,0). `policyCost` summiert alle ohne Ausnahme (`sim/netz.ts:487–494`).
- Befund: ENTSCHEIDUNGEN W, Nachtrag F1, sagt: „Eine gleichnamige Maßnahme (etwa `m_verteidigung` neben dem Posten `verteidigung`) ist das Gesetz und kostet kein eigenes Geld mehr.“ Im Code kostet sie weiter. Renten lassen sich über „Rentenniveau“ (Haushalt) und „Rentenerhöhungen“ (Politik) erhöhen, Frühverrentung über „Renteneintrittsalter“ und `m_fruehrente`.
- Warum es stört: Doppelte Steuerung derselben Größe mit zwei Preisen. Der Spieler weiß nicht, welcher Regler gilt.
- Vorschlag: F1 umsetzen. Für Maßnahmen mit einem Etatposten setzt man `cost` auf 0 oder schließt sie in `policyCost` aus; ihre Zeile zeigt „bezahlt aus: Verteidigung (Haushalt) →“ als Direktlink.
- Aufwand: mittel.

### Schwere 2

**D-3 · Funktion · Die Steuerregler zeigen keinen Satz, nur „Ausgangsstand“ und Milliarden.**
- Ort: Haushalt › Einnahmen. `ui/wirtschaft/Haushalt.tsx:79–82`, `haushalt.ui.wert.steuer_null`, `haushalt.ui.wert.steuer`.
- Befund: Die Zeile zeigt „Lohn- und Einkommensteuer … Ausgangsstand“ und nach einem Klick „+252 Mrd. Lira“. Das Feld dazu sagt „+1 Stufe: mehr Einnahmen sofort“.
- Warum es stört: Der Projektinhaber hat wörtlich verlangt: „Bei steuererhöhungen müssen natürlich zahlen und prozente angegeben werden“. Es fehlen genau die Prozente.
- Vorschlag: Die Zeile zeigt „Spitzensatz 40 % → 42 % · +252 Mrd. ₺ im Jahr“. Für Verbrauchsteuern zwei Zeilen: Mehrwertsteuer (20 %) und Sonderverbrauchsteuer (Index). Zusammen mit D-1 bauen.
- Aufwand: mittel.

**D-4 · Sinn (Schau) · „Ministerium will +2“ hat keine Wirkung.**
- Ort: `ui/wirtschaft/Haushalt.tsx:326–338`, `sim/haushalt.ts:315` (`ministerWunsch`), Schlüssel `haushalt.ui.kurz.wunsch`.
- Befund: `ministerWunsch` wird nur in der Oberfläche gelesen (`grep`: einziger Aufruf `Haushalt.tsx:326`). Die Loyalität ändert sich bei jedem Beschluss um ±1, egal ob der Wunsch erfüllt ist (`sim/haushalt.ts:310`). Die Einheit ist dazu „Stufe“, und der Minister wird nicht genannt.
- Warum es stört: Der Text verspricht eine Abwägung (Minister zufriedenstellen), die es nicht gibt. „Alles was keinen einfluss hat und nur show ist, ist für mich ein no go.“
- Vorschlag: Den Wunsch wirksam machen: Ist er erfüllt, bringt das +5 Loyalität einmalig; wird gekürzt, obwohl er mehr will, kostet das −5 (Spielparameter). Angezeigt wird das so: „Bildungsministerin Ayşe Kaya will 2.856 Mrd. ₺ (+336)“, mit Porträtchip. Ohne Wirkung den Hinweis streichen.
- Aufwand: klein bis mittel.

**D-5 · Sprache · Interne Kürzel und Codenamen stehen in der Oberfläche.**
- Ort: Folgenliste in Haushalt und Zentralbank (`sim2.sim.folgen.*`, 13 Schlüssel), Treiber der Wirtschaftslage (`wk.d5684e9`, `wk.6c080c8`, `wk.7d08ba6`, `wk.2e24491`, `wk.116fb7c`), Zentralbank „STUFE B“ (`zb.stufe`).
- Befund: Zu lesen sind „Z6: Ausgaben und Steuern wirken auf die Nachfrage.“, „Z1 und Z9: …“, „(Z8, Kalibrierung WIR-1)“, „Leere Reserven (WIR-2)“, „Nachhaltigkeitsaufschlag (ZEI-4)“, „Hysterese“, „J-Kurve“, „eine dokumentierte Modellvereinfachung“.
- Warum es stört: Regel 10 nennt „Z1“ ausdrücklich als Beispiel für einen Verstoß. Für den Spieler ist das Werkstattsprache.
- Vorschlag: Das Präfix „Zn:“ und alle Klammercodes streichen, „Stufe B“ durch den Namen ersetzen. Neufassungen stehen in Abschnitt 3.
- Aufwand: klein.

**D-6 · Übersetzung · Deutsche Reste in Englisch und Türkisch und deutsche Zahlenformate.**
- Ort: `sim/zentralbank.ts:29` („Weisungsgebunden“), `:44–48` („gering“, „mäßig“, „solide“, „hoch“), `:351` („Ohne Spielschleife.“), `:371` („Nicht einmischen“, „keine“), `:374` („Vertraulich zur Festigkeit raten“), `:373` (`Risikoaufschlag +…`, `Wiederholte Kritik wirkt …fach`), `:184` und `:195` (`Nach heutigem Stand beschließt …`), `:285` („Die Gouverneurin sieht ihre Bank entmachtet.“). Dazu `sim/haushalt.ts:507–660`: alle Rückmeldungen von `setzeEntwurf`, `paketInEntwurf`, `bringeHaushaltsgesetzEin`, `haushaltsStimmenKaufen` und `haushaltszyklusTag` sowie die Chronik „Mit {ja} zu {nein} Stimmen …“. Außerdem `ui/wirtschaft/Lage.tsx:18` (`toLocaleString("de-DE")`) und `:99` („Mit: … Vorhaben“).
- Befund: Im englischen Lauf steht „Nicht einmischen · keine“, „Bank credibility: mäßig“, „Risikoaufschlag +10“. Die Wirtschaftslage zeigt „31,5%“ und „48,95lira“ mit deutschem Komma, im Türkischen ebenso („Bankanın güvenilirliği: mäßig“).
- Warum es stört: Regel 11. Die englische und die türkische Fassung wirken unfertig.
- Vorschlag: Alle Zeichenketten in die Kataloge (`zb.*`, `haushalt.*`) und `nf` über `zahl()` aus `i18n` laufen lassen.
- Aufwand: mittel.

**D-7 · Funktion · „Haushaltsgesetz 2.029“.**
- Ort: Haushalt › Haushalts-Zyklus › Haushaltsvorlage. `ui/wirtschaft/HaushaltsEntwurf.tsx:11` (`t("eo.jahr",{jahr:Number(...)+1})`).
- Befund: Die Jahreszahl wird als Zahl mit Tausenderpunkt formatiert (`okt_paket.png`).
- Warum es stört: Ein offensichtlicher Fehler genau am wichtigsten Knopf des Jahres.
- Vorschlag: `jahr: String(Number(world.date.slice(0,4))+1)`.
- Aufwand: klein.

**D-8 · Zahl / Konsistenz · Rad und Regler widersprechen sich.**
- Ort: Haushaltsrad gegenüber der Tafel. `ui/wirtschaft/HaushaltsRad.tsx:40–49`.
- Befund: Der Regler sagt „Verwaltung und Personal 5.880 Mrd. Lira · 7,0 % BIP“, das Rad „Öffentlicher Dienst und Übriges 3,9 Bio. ₺“. Die Regler ergeben zusammen rund 19,1 Bio. plus 2,9 Bio. Zinsen, also 22 Bio., während das Rad „20,0 Bio. ₺“ an Ausgaben zeigt. Grund ist die bekannte Überschneidung von Personal und Fachressorts; sie steht nur im Kommentar und in „Rechnung im Einzelnen“.
- Warum es stört: Der Spieler addiert und findet zwei Milliarden zu viel. Das zweitgrößte Stück des Rads ist ein Rest ohne Erklärung.
- Vorschlag: „Verwaltung und Personal“ als Querschnitt zeigen: „davon Personal in allen Ressorts: 5,9 Bio.“, ohne Regler-Lira, oder den Personalposten in Gehaltsanpassung „+x % Beamtengehälter“ umbenennen. Den Rest im Rad ehrlich benennen: „Kommunen, Sozialversicherung, Sonstiges (2,6 Bio.)“.
- Aufwand: mittel.

**D-9 · Zahl · Eine erfundene Vorgeschichte wird als „Verlauf“ gezeigt.**
- Ort: `sim/world.ts:85–105` (`syntheticHistory`), `sim/wirtschaft.ts:71–75` („Ruhelage“), Wirtschaftslage, Bilanz & Entwicklung, Folgendiagramm.
- Befund: Für die zwölf Monate vor Amtsantritt werden Inflation, Wachstum, Zins und Schulden flach fortgeschrieben, die Lira wird aus der Inflation zurückgerechnet (38,8 → 49,0). Die Oberfläche sagt „zum Vorjahr ◆ ±0,0“ und zeigt die Linie als „Verlauf“ von Jul 27 bis Mai 28.
- Warum es stört: Regel 6. Die Aussage „Inflation zum Vorjahr unverändert“ ist eine Behauptung aus erfundenen Zahlen.
- Vorschlag: Die Vorgeschichte im Diagramm grau gestrichelt und als „vor Amtsantritt (angenommen)“ zeichnen; den Chip „zum Vorjahr“ erst nach zwölf echten Monaten zeigen.
- Aufwand: klein.

**D-10 · Möglichkeiten · Die Kreditwürdigkeit wird simuliert, aber nie gezeigt.**
- Ort: `sim/maerkte.ts:106–196` (Stufen CCC+ bis BBB, Start BB−, Ausblick, Anlagegrad), `ratingSicht` (`:135`) ohne Aufrufer.
- Befund: Ein Rating mit Ausblick und Kapitalzufluss bei Anlagegrad existiert. Der Spieler sieht es nur, wenn eine Protokollmeldung kommt.
- Warum es stört: Democracy 4 und jeder echte Finanzminister haben das Rating als Leitzahl. Ein Ziel „Investment Grade“ wäre ein großes Wirtschaftsziel; so ist es unsichtbar.
- Vorschlag: Im Haushalt neben Schulden und Zinsen eine dritte Kennzahl „Bonität BB− · Ausblick stabil“ mit Skala CCC+ … BBB und Marke „Anlagegrad“; Klick führt zu den Treibern (`bonitaetsScore`).
- Aufwand: klein.

**D-11 · Logik · Welche Entscheidung das Parlament braucht, ist uneinheitlich und teils falsch.**
- Ort: Haushalt-Nachtrag („Entscheidungsweg: Regierung“, `eo.regierung`, `sim/haushaltsentscheidung.ts:14–19`, `hh.nachtrag`); Zentralbankgesetz (`sim/zentralbank.ts:305–322` wirkt sofort); Versorgung › „Energieabkommen schließen“ (276/301 Stimmen nötig, `vhd_2.png`).
- Befund: Ein Nachtragshaushalt samt Steuererhöhung läuft ohne Parlament. In der Türkei ist der Nachtragshaushalt (ek bütçe) ein Gesetz der Großen Nationalversammlung; so wurde er etwa 2023 nach dem Erdbeben beschlossen. Das „Gesetz einbringen“ der Zentralbank wirkt sofort, ohne Abstimmung. Ein Gasliefervertrag dagegen braucht 301 Stimmen.
- Warum es stört: Gleiche Dinge laufen verschieden, und der Spieler lernt falsche Zuständigkeiten. „Ein Weg zum Gesetz“ (W 2) ist hier nicht durchgezogen.
- Vorschlag: Ein Nachtrag wird ein kurzes Gesetz (Abstimmung nach 10 Tagen, Preis wie heute). Das Zentralbankgesetz geht über `gesetzesPrognose` mit Termin. Energieverträge sind Regierungshandeln ohne Votum, dafür mit Kapital. Ein einheitliches Siegel „Gesetz · Erlass · Vertrag“ am Preisfeld.
- Aufwand: mittel.

**D-12 · Logik · Wer die Bank zu Festigkeit ermuntert, wird bestraft.**
- Ort: Zentralbank › „Vertraulich zur Festigkeit raten“. `sim/zentralbank.ts:181` (Glaubwürdigkeit −0,005 auch bei Richtung +1), `:128–131` (−2 Loyalität, wenn Druck nichts ändert), `druckWirkung`.
- Befund: Bei strenger Führung ändert der Rat den Beschluss nicht („Bank: 36,0 %“ wie ohne Einmischung). Er kostet trotzdem 1 Kapital, Glaubwürdigkeit und nach der Sitzung 2 Loyalität der Gouverneurin.
- Warum es stört: Eine Antwort ohne Nutzen, aber mit Preis. Und die Unterstützung einer strengen Gouverneurin verärgert ausgerechnet sie.
- Vorschlag: Bei Richtung +1 keine Glaubwürdigkeitsstrafe und keine Loyalitätsstrafe, stattdessen +2 Loyalität. Ändert der Rat nichts am Zins, dann „Stärkt die Erwartungen: Glaubwürdigkeit +“ oder die Option ausgrauen mit „Die Bank ist schon so streng.“
- Aufwand: klein.

**D-13 · Logik · Ein zweiter Haushaltsweg über Ereignisse überschreibt die Regler.**
- Ort: `sim/ereignisse.ts:331` (Sparpaket −1,5 % BIP), `:887` (Sparkurs −1), `:896` (Wachstumshaushalt +1,5), `sim/ereignisse-aussen.ts:207` (`setFiscalImpulse(w, Math.min(fiscalImpulse, 0))`).
- Befund: Ereignisse verschieben `fiscalImpulse` direkt, ohne Posten, Parlament oder Verlierer im Ressort. Die Rating-Antwort „Fahrplan“ setzt jeden positiven Impuls auf 0 und löscht damit alle zuvor beschlossenen Mehrausgaben, während die Regler sie weiter zeigen. Das Rad bucht die Differenz still in „Weitere Beschlüsse“ (`sim/staatsfinanzen.ts:30`). Zum Preis: 1,5 % BIP Sparpaket kosten 6 Kapital, derselbe Betrag über die Regler kostet außerhalb des Oktobers deutlich mehr (rund 4 Stufen Personal à 4 Kapital = 16 Kapital).
- Warum es stört: Zwei Wege zur selben Sache mit verschiedenen Preisen. Und die Regler lügen nach dem Ereignis.
- Vorschlag: Ereignisantworten setzen konkrete Posten (`setzePosten(..., ohneKosten)` wie bei `wendePaketAn`), etwa „Sparpaket: Personal −2, Subventionen −2“. Dann zeigt das Rad, wer verliert.
- Aufwand: mittel.

**D-14 · Logik · Subventionen sind die beste Inflationspolitik.**
- Ort: `INFLATION_INDUSTRIE_BALANCE_2026-11-02.md`, Tabelle „Vergleich der Inflationsmaßnahmen“; Handlung „Preise drücken: Subventionen“ (`wk.75714cf`).
- Befund: Bei gleichen Seeds schlagen „Breite Subventionen“ die „Geldpolitische Stabilisierung“ in allen drei Größen. Seed 5: Inflation −18,7 statt −16,3 Punkte, Wachstum 3,4 statt 1,5 %, Zustimmung 32,3 statt 30,8 %. Seed 17: −22,7 statt −19,5, Wachstum 2,6 gleich, Zustimmung 26,4 statt 27,8. Die Wirtschaftslage empfiehlt Subventionen als Mittel gegen Inflation.
- Warum es stört: Eine richtige Antwort ohne Preis. In der Wirklichkeit senken Preisstützen den gemessenen Index nur kurz, belasten Defizit und Lira und kehren beim Auslaufen zurück (das sagt der eigene Text `haushalt.posten.subventionen.kehrseite`).
- Vorschlag: Subventionen dämpfen den Preisindex nur, solange sie wachsen. Sie erhöhen `fiscalImpulse` und damit den Risikoaufschlag, und beim Kürzen kommt ein Nachholschub (Spielparameter). Die Handlung umbenennen: „Preise kurzfristig deckeln: Subventionen (teuer)“.
- Aufwand: mittel (Kalibrierung).

**D-15 · Konsistenz · Indizes stehen mit Kommastelle.**
- Ort: Wirtschaftslage (Reallöhne 44,2; Investitionen 45,0; Kreditvergabe 40,0; Exportstärke 58,3; Vertrauen der Märkte 45,0; Gefühlte Teuerung 74,3; Armut 42,7), Krisenrat („74,3 / 100“ neben „43 / 100“ für dieselbe Armutsgröße), Zentralbank („Glaubwürdigkeit −3,0 Punkte“), Reglerfeld („Ministerloyalität 1,00“).
- Befund: Regel 10, „Indizes ohne Kommastelle“. Eine Lesehilfe „0–100, 50 = Ausgangslage“ fehlt in der Liste.
- Warum es stört: Es sieht aus wie eine Messgröße mit Einheit und ist keine.
- Vorschlag: `stellen: 0` für alle Indexkennzahlen und ein ⓘ „Index 0–100“ am Gruppentitel.
- Aufwand: klein.

**D-16 · Design · Die Längen überschreiten die Grenze.**
- Ort: Rundgang `seiten.json`.
- Befund: Haushalt 2,82, Wirtschaftslage 2,81, Zentralbank 1,99, Krisenrat 1,68, Versorgung 1,58 Bildschirme. Im Oktober wächst der Haushalt auf über 3 Bildschirme.
- Warum es stört: Regel 2; „extrem lang gezogen“.
- Vorschlag: Haushalt siehe Verbesserung 2 (Tafel in zwei Spalten mit gleich hohen Zeilen, Verfahren als Seitenfenster). Wirtschaftslage siehe Verbesserung 3.
- Aufwand: mittel.

**D-17 · Design / Sinn · Bei Versorgung & Handel steht das Leere oben und das Volle unten.**
- Ort: `ui/gueter/Inventar.tsx`, `VersorgungsLage.tsx`.
- Befund: Oben steht „Ungedeckte Warengruppen: —“, dreimal „—“ und „Mrd. $“ ohne Zahl. Unten zugeklappt „Waren und Einzelinstrumente · Details“ mit 15 Warengruppen, Deckung in Prozent und „Tage ohne Einfuhr“. Das Vorranggitter „Streitkräfte zuerst … Front“ steht auch im Frieden ganz oben.
- Warum es stört: Die eine Frage („Was fehlt uns?“) beantwortet das Bild darunter, das niemand aufklappt.
- Vorschlag: Oben ein Warenraster mit 15 Kacheln (Ikone, Deckungsring, Tage), rot, was knapp ist. Klick öffnet die Ware. Den Vorrang erst bei Engpass oder Krieg zeigen; die drei Striche ersetzen durch „erst nach dem ersten Monatsabschluss (1. Juli)“.
- Aufwand: mittel.

**D-18 · Konsistenz · Dasselbe steht an mehreren Stellen.**
- Ort: Aktenkopf (`ui/wirtschaft/Akte.tsx:52–60`) gegenüber der Kopfleiste; Bilanz & Entwicklung gegenüber der Wirtschaftslage; Krisenrat zeigt Armutsbelastung und Zustimmung doppelt.
- Befund: Inflation und Lira stehen dreimal auf dem Bildschirm (Leiste, Aktenkopf, Liste), mit verschiedener Genauigkeit (49,0 gegenüber 48,95).
- Warum es stört: Regel 8.
- Vorschlag: Den Plan umsetzen: Kopf zeigt Arbeitslosigkeit, Wachstum und Netto-Reserven; „Bilanz & Entwicklung“ entfällt; der Krisenrat verweist auf die Lage.
- Aufwand: klein.

**D-19 · Sprache · Der Spieler wird geduzt, und die Anrede auf Türkisch schwankt.**
- Ort: `kp.lead` („Entlaste Haushalte, benenne die Finanzierung und organisiere die Stimmen.“), `hm.bruch` („stabilisiere den Partner rechtzeitig“), `hm.anzahl` („Vereinbare eine gültige Anzahl …“). Im Türkischen steht „kaydırın“ neben „değiştirebilirsin“ und „Bütçeyi şekillendir“.
- Warum es stört: Regel 10 verlangt „Sie“.
- Vorschlag: Neufassungen stehen in Abschnitt 3.
- Aufwand: klein.

**D-20 · Erklärung · „Die Inflation läuft mit 22 % pro Monat auf den Wert 26,5 % zu.“**
- Ort: `wk.t.inflationKopf`, `sim/wirtschaft-kennzahlen.ts:140`; ebenso `wk.t.erwartungKopf`, `wk.t.lbKopf`, `wk.t.risikoKopf` („mit 2 % pro Tag“).
- Befund: Gemeint ist die Anpassungsgeschwindigkeit (22 % des Abstands je Monat). Ein Spieler liest 22 % Monatsinflation.
- Warum es stört: Es ist die erste Erklärung der wichtigsten Zahl, und sie ist missverständlich.
- Vorschlag: „Ohne neue Anstöße sinkt die Inflation auf etwa 26,5 %; jeden Monat legt sie gut ein Fünftel des Weges zurück.“
- Aufwand: klein.

**D-21 · Logik / Sprache · Die Folgesätze sind falsch gerichtet.**
- Ort: Folgenliste aus `sim/folgen.ts` (`impulsKette`, `zinsKette`), Schlüssel `sim2.sim.folgen.*`.
- Befund: Bei einer Steuererhöhung steht „Die Nachfrage sinkt: Der Staat kauft und zahlt weniger“; der Staat zahlt aber nicht weniger, die Haushalte haben weniger. Bei einer Zinssenkung steht „▲ Kreditvergabe … Hohe Zinsen verteuern Kredite.“ Bei sinkender Inflation steht „Läuft die Wirtschaft heißer, steigen Preise“.
- Warum es stört: Regel 7. Der Text zur Wirkung muss stimmen; hier widerspricht die Begründung dem Pfeil.
- Vorschlag: Je Kettenglied zwei Begründungen (steigt/sinkt) und eine je Auslöser (Ausgabe/Steuer), siehe Abschnitt 3.
- Aufwand: mittel.

**D-22 · Design · Der Nullpunkt der Regler liegt in jeder Zeile woanders.**
- Ort: Haushalt-Tafel; Spannen aus `data/haushaltsplan.ts:83–100` (zum Beispiel Bildung −4…+10, Rentenniveau −5…+5, Subventionen −2…+4).
- Befund: Alle Zeilen stehen auf „Haushaltsgesetz“, der Knopf sitzt aber einmal mittig, einmal links vom Drittel (`hh_1.png`).
- Warum es stört: „Gleiches muss gleich aussehen.“ Das Bild suggeriert, Bildung sei schon gekürzt.
- Vorschlag: Eine Mittelmarke „heute“ in jeder Zeile an derselben Stelle; die Spanne nach links und rechts verschieden lang zeichnen, nicht den Knopf verschieben.
- Aufwand: klein.

**D-23 · Zahl · Die Startanteile mehrerer Ressorts weichen deutlich von der eigenen Recherche ab.**
- Ort: `data/haushaltsplan.ts:83–100` gegenüber `RECHERCHE_HAUSHALT_MINISTERIEN_2026.md` §2–3 und `RECHERCHE_GLM_1_HAUSHALT_RENTEN.md` (BIP-Bezug 78,3 Bio. aus `mrdProProzentBip`).
- Befund:

  | Posten | Spiel | Recherche 2026 | Abweichung |
  |---|---|---|---|
  | Gesundheit | 1,0 % | 1.594 Mrd. funktional ≈ 2,0 % | halb so viel |
  | Verteidigung | 1,9 % | 1.202 Mrd. ≈ 1,5 % | ein Viertel zu viel |
  | Diplomatie | 0,15 % | 46,8 Mrd. ≈ 0,06 % | 2,5-fach |
  | Kultur | 0,2 % | 70 Mrd. ≈ 0,09 % | doppelt |
  | Justiz | 0,35 % | 389,6 Mrd. ≈ 0,5 % | zu wenig |
  | Renten-Zuschuss | 2.329 Mrd. | „über 1,4 Bio.“ (Ekonomi Gazetesi) | Quellen widersprechen sich |

  `data/haushalt_ministerien_2026.ts` ist angelegt, wird aber nirgends gelesen.
- Warum es stört: Das Rad zeigt dem Spieler falsche Gewichte (Gesundheit kleiner als Verteidigung), obwohl belegte Zahlen im Projekt liegen.
- Vorschlag: Die Startanteile mit den funktionalen Beträgen der Recherche neu setzen (als „abgeleitet“ markiert), die Abweichung Renten 2,33 gegen 1,4 Bio. als Lücke in ENTSCHEIDUNGEN klären.
- Aufwand: mittel.

**D-24 · Möglichkeiten · Das Rad führt nicht ins Ministerium, und zwei Stücke tun nichts.**
- Ort: `ui/wirtschaft/HaushaltsRad.tsx:44`, `:66` (Zinsen und Kredit ohne `ziel`), `Haushalt.tsx:442`.
- Befund: Ein Klick scrollt nur zur Reglergruppe. Die zweite Ebene „Rad → Ministerium → Behörde“ aus dem Plan (Haushalt, Ebene 2, `RessortRad`) gibt es nicht. „Zinsen“ und „Neue Schulden“ reagieren nicht, obwohl die Unterschrift sagt: „Ein Klick führt zu den Reglern.“ Die Stücke sind nur mit der Maus erreichbar, mit der Tastatur nur über die Legende.
- Warum es stört: Kein Drill-down (Regel 3); ein Hinweis, der nicht stimmt.
- Vorschlag: Ein Klick auf ein Stück zoomt in ein Ressortrad mit Minister, Posten und Behörden. Zinsen führen zur Zentralbank, Neue Schulden zu „Rechnung im Einzelnen“.
- Aufwand: groß (Plan AP 11).

**D-25 · Sprache · „Rechnung im Einzelnen“ spricht Entwicklersprache.**
- Ort: `sf.schuldenHeute`, `sf.schuldenNochOffen`, `sf.anteileHinweis`, `sf.rechnungHinweis`, `sf.jahresrate`, `sf.betrag` mit Nachkommastelle.
- Befund: Zu lesen sind „Ein Bestand wird nicht durch zwölf geteilt.“, „Für ältere Spielstände wird kein zurückliegender Beleg erfunden.“, „der Preisindex ist eine vereinfachte Spielrechnung“ und Beträge wie „17.396,5 Mrd. ₺“, „0,00 Mrd. ₺“.
- Warum es stört: Das sind Notizen an Prüfer, keine Spielertexte. Der eigene Plan verlangt Beträge über 1 Bio. in „Bio. ₺“ mit einer Stelle.
- Vorschlag: Neufassungen stehen in Abschnitt 3.
- Aufwand: klein.

**D-26 · Design · Die Ansichten des Bereichs sehen verschieden aus.**
- Ort: Krisenrat und Versorgung (dunkelbrauner Kopfblock, „01 02 03“-Nummern), Haushalt und Zentralbank (helle Karten), Bilanz („WIRKUNGSBERICHTE“ groß in Rot gesperrt), zwei Reiterstile (dunkle Reiter links, helle Pillen rechts).
- Befund: Bilder 016 bis 021 im Vergleich.
- Warum es stört: „Sieht wieder alles verschieden aus.“
- Vorschlag: Ein Kopfmuster für alle Instrumente (helle Karte, Überschrift, ein Bild); eine Reiterreihe; die Nummernkarten nur dort, wo es eine Reihenfolge gibt.
- Aufwand: mittel.

**D-27 · Design · Die Wirtschaftslage hat oben kein Bild.**
- Ort: `ui/wirtschaft/Lage.tsx:104–132`; `ui/bausteine/Tacho.tsx` ist ungenutzt (`grep "<Tacho"`: kein Treffer).
- Befund: Oben steht eine Liste mit 21 Zeilen, deren Funkenlinien alle flach sind (siehe D-9).
- Warum es stört: Regel 1, eine Frage, ein Bild.
- Vorschlag: Sechs Tachos laut Plan (Inflation, Arbeitslosigkeit, Wachstum, Lira real, Defizit, Netto-Reserven); die Liste als Reiter „Alle Kennzahlen“.
- Aufwand: mittel.

**D-28 · Übersetzung · Kapital und Wortstellung uneinheitlich.**
- Ort: `sf.politikText` en „Political points“ und tr „Siyasi puanlar“ gegenüber „capital“ und „sermaye“ überall sonst. Folgen tr „yaklaşık 6 sonra ay“, „yaklaşık 2 sonra ay“. Im Rad tr „13 %“ statt „%13“; „GSYH'nin“ steht allein unter der Zahl.
- Warum es stört: Regel 11; im Türkischen ist die Wortstellung falsch.
- Vorschlag: „Political capital“, „Siyasi sermaye“; „yaklaşık 6 ay sonra“; Prozent im Türkischen vorangestellt (`%13`); Unterschrift „GSYH'ye oranı“.
- Aufwand: klein.

### Schwere 3

**D-29 · Zahl · Zwei BIP-Grundlagen für dasselbe Jahr.**
- Ort: `data/haushaltsplan.ts:48` (`mrdProProzentBip: 783`, also 78,3 Bio.) gegenüber `szenario_tuerkei_2026-09-25.json` `bipTryTn: 84`.
- Befund: Die Startanteile werden mit 78,3 Bio. in Prozent umgerechnet und mit 84 Bio. zurück in Lira. Darum zeigt das Spiel „Personal 5.880 Mrd.“ statt der belegten 5.507 und „Einnahmen 17,4 Bio.“ statt 16,2 (+7 %).
- Vorschlag: Eine BIP-Zahl, abgeleitet an einer Stelle; die Plan-Beträge dann exakt durchreichen.
- Aufwand: klein.

**D-30 · Zahl · Daten von 2026 tragen das Etikett 2028.**
- Ort: `szenario_tuerkei_2026-09-25.json` (`published.inflation.period: "2028-05"` mit dem Augustwert 2026), Diagramm „Zwischenziel der Zentralbank 24“, „Ausgangslage: Haushaltsgesetz 2026“, Ländervergleich „Türkei 34,9 (2025)“ neben „31,5“.
- Befund: Gedeckt durch ENTSCHEIDUNGEN (Spielbeginn mit Daten vom Stichtag). Die eigene Notiz nennt aber den Zwischenzielpfad 24/15/9 für 2026–2028; 2028 wäre das Zwischenziel 9 %.
- Vorschlag: Einmal im Almanach und in der Lage-Fußzeile: „Ausgangslage: Daten vom September 2026“. Das Zwischenziel beim Start auf den Pfadwert des Spieljahres setzen oder „Zwischenziel (Stand 2026)“ beschriften.
- Aufwand: klein.

**D-31 · Logik · Der Kapitalpreis je Stufe hängt nicht vom Betrag ab.**
- Ort: `sim/haushalt.ts:236` (`kapitalKosten`).
- Befund: Kultur +1 Stufe = 42 Mrd., Infrastruktur +1 Stufe = 336 Mrd.; beides kostet 2 Kapital.
- Vorschlag: Preis je angefangene 100 Mrd. (oder je 0,1 % BIP), unbeliebte Richtung doppelt.
- Aufwand: klein.

**D-32 · Design · Kleinigkeiten in der Haushaltstafel.**
- Ort: Einnahmenspalte (`hh_1.png`).
- Befund: Die Einnahmenspalte ist zu zwei Dritteln leer. Ein Trennstrich bricht falsch: „Sonderverbrauchsteu-ern“. Die Spalte „live“ ist toter Code und bleibt immer leer (`Haushalt.tsx:246` `const live = 0`).
- Vorschlag: Mit D-3 füllt sich die Spalte (sechs Steuerzeilen); `hyphens: manual` mit `&shy;` an „Sonder&shy;verbrauch&shy;steuern“; die tote Spalte entfernen.
- Aufwand: klein.

**D-33 · Möglichkeiten · Pakete zeigen ihren Inhalt erst nach dem Klick.**
- Ort: `Haushalt.tsx:204–210`, `sim/haushalt.ts:382–387`.
- Befund: Bei „Paket: Konsolidieren“ sieht man erst nach dem Klick, dass es Personal −1, Subventionen −1 und Einkommensteuer +1 heißt (Defizit 3,73 → 2,63 %).
- Vorschlag: Beim Darüberfahren die Schritte und die Defizitwirkung zeigen.
- Aufwand: klein.

**D-34 · Zahl / Erklärung · Selbstversorgung und Tage ohne Einfuhr widersprechen sich.**
- Ort: Waren.
- Befund: „Stahl 100 % · 101 Tage ohne Einfuhr“, „Erze 100 % · 73 Tage“, „Getreide 100 %“ bei 4 Mio. t Einfuhr. Für den Spieler heißt 100 % „brauche nichts von außen“.
- Vorschlag: „Erzeugung deckt 100 % des Bedarfs, braucht aber Schrott und Koks aus dem Ausland“, oder die Deckung ohne Vorprodukte zeigen.
- Aufwand: klein.

**D-35 · Logik · 301 Stimmen für den Haushalt (Vermutung, gilt spielweit).**
- Ort: `REGELN.mehrheit`.
- Befund: Nach Art. 96 der türkischen Verfassung entscheidet das Parlament mit der Mehrheit der Anwesenden, mindestens aber mit 151 Stimmen. 301 gilt für Gesetze nicht allgemein.
- Vorschlag: Im Bereich Parlament klären. Für den Haushalt ist 301 eine strenge Vereinfachung, die gekennzeichnet sein sollte.
- Aufwand: klein (Entscheidung).

**D-36 · Konsistenz · Einheiten wechseln.**
- Befund: „Mrd. Lira“ in den Reglern, „Bio. ₺“ im Rad, „TRY“ in der Bilanz, „Lira“ in der Wirtschaftslage. „Defizit 3,10 → 2,80 %“ steht mit zwei Stellen, sonst mit einer. Das Minuszeichen ist ein Bindestrich („Legitimität -0,40“, „-1.013,5 Mrd. ₺“, „Leistungsbilanz -2,3 %“).
- Vorschlag: Überall „₺“ mit „Mrd. ₺“ und „Bio. ₺“, eine Nachkommastelle beim Defizit, echtes Minus „−“ über `zahl()`.
- Aufwand: klein.

**D-37 · Design · Das Folgendiagramm ist schwer zu lesen.**
- Ort: `st_folgen.png`, `ui/wirtschaft/Diagramm.tsx`.
- Befund: Die y-Achse zeigt „3,1 · 3,1 · 3,1 · 3,0“ (gleiche Beschriftung, weil zu fein gerundet). Die Wartezeile heißt „Die Kanzlei rechnet die nächsten zwölf Monate durch …“; die Kanzlei ist im Spiel aber der Amtssitz. Nach 3,5 Sekunden ist die Rechnung noch nicht fertig.
- Vorschlag: Die Achse mit zwei Stellen beschriften, wenn die Spanne unter 1 liegt; „Das Finanzministerium rechnet …“.
- Aufwand: klein.

**D-38 · Sprache · Kleine Fehler.**
- Befund: „über etwa 1 Monate“ (`eo.nachtragFolge` ohne Plural); „jetzt 358 von 301 Stimmen“ (`zb.gesetzText`); „Gewinner: Haushalt“ bei Steuern (keine Gruppe); „Die Gouverneurin bleibt bei ihrer Linie“ (`zb.aendertNichts`) ist fest weiblich, auch wenn ein Mann ernannt wird (Vermutung, `zufallsName` kann männlich sein).
- Vorschlag: Abschnitt 3.
- Aufwand: klein.

---

## 3. Wortprüfung (Schlüssel: alt → neu)

**Haushalt**
- `haushalt.ui.ressorts.hinweis_nachtrag`: „Schieben Sie einen Regler, um die Folgen zu sehen. Außerhalb des Oktober-Fensters kostet jede Änderung das {faktor}-fache an Kapital (in die unbeliebte Richtung nochmals doppelt) und etwas Legitimität.“ → „Schieben Sie einen Regler, um Preis und Folgen zu sehen. Bis Oktober ist jede Änderung ein Nachtragshaushalt: Sie kostet doppelt so viel Kapital, eine Kürzung beliebter Posten oder eine Steuererhöhung nochmals doppelt, dazu etwas Legitimität.“
- `haushalt.ui.zyklus.geschlossen_text`: „… {faktor}-fache Kapitalkosten und ein kleiner Legitimitäts-Abzug.“ → „… doppelte Kapitalkosten und etwas Legitimität.“
- `haushalt.ui.zyklus.kicker`: „Der Haushalts-Zyklus“ → „Das Haushaltsjahr“
- `haushalt.zyklus.hinweis.nachtrag`: „… ein kleiner Legitimitäts-Abzug …“ → „… etwas Legitimität …“
- `haushalt.ui.kurz.wunsch`: „Ministerium will {stufe}“ → „{name} will {betrag} ({delta})“, etwa „Kaya will 2.856 Mrd. ₺ (+336)“
- `haushalt.posten.*.wirkung`: „+1 Stufe: …“ → „Mehr Geld: …“ (bei Steuern „Höherer Satz: …“, beim Rentenalter „Ein Jahr später: …“)
- `haushalt.entwurf.gestellt`: „Entwurf: {posten} auf Stufe {stufe} gestellt.“ → „Entwurf: {posten} auf {betrag} gesetzt.“
- `haushalt.gruppe.staat` „Staat und Preise“ gegenüber `hd.rad.staat` „Justiz, Äußeres, Kultur, Preisstützung“ → ein Name für beide: „Staat, Justiz, Kultur, Preisstützen“
- `hd.rad.uebrig`: „Öffentlicher Dienst und Übriges“ → „Kommunen, Sozialkassen und Übriges“ (siehe D-8)
- `hd.rad.lesart`: „… Ein Klick führt zu den Reglern.“ → „… Ein Klick auf ein Ressort öffnet seine Regler.“ (solange Zinsen und Kredit nicht klickbar sind)
- `haushalt.posten.einkommensteuer.gewinner`: „Haushalt“ → „Staatskasse (weniger neue Schulden)“; ebenso bei `verbrauchsteuern`, `forschung`, `gesundheit`, `kultur` und anderen als Verlierer „Haushalt“ → „Staatskasse“
- `eo.nachtragFolge`: „Unmittelbare Änderung: Legitimität {leg}; Ministerloyalität {loy}. Dauerwirkungen entfalten sich über etwa {monate} Monate.“ → „Sofort: Legitimität {leg}, Loyalität des Ministers {loy}. Die volle Wirkung kommt nach {monate, plural, one {# Monat} other {# Monaten}}.“ (Werte ganzzahlig und mit „−“)
- `sf.titel`: „Was können wir finanzieren?“ → „Woher das Geld kommt, wohin es geht“
- `sf.jahresrate`: „Hochrechnung bei heutigem Kurs – keine bereits angesparte Staatskasse.“ → „Hochgerechnet auf ein Jahr bei heutigem Kurs.“
- `sf.schuldenHeute`: „Heutiger Bestand: {betrag} Mrd. ₺ ({quote} % des BIP). Ein Bestand wird nicht durch zwölf geteilt.“ → „Schulden heute: {betrag} ({quote} % des BIP).“
- `sf.schuldenNochOffen`: „Der erste Monatsabschluss steht noch aus. Für ältere Spielstände wird kein zurückliegender Beleg erfunden.“ → „Der erste Monatsabschluss kommt am 1. des nächsten Monats.“
- `sf.anteileHinweis`: letzter Satz „Die Größenordnung basiert auf dem Szenario; der Preisindex ist eine vereinfachte Spielrechnung.“ → streichen
- `sf.politikText`: „Kapital stehen für politischen Aufwand …“ → „Politisches Kapital steht für Ihren Spielraum bei Reformen und Verhandlungen. Es bezahlt keine Schulen, Gehälter oder Lieferungen.“
- `sf.betrag` bei Beträgen ab 1.000 Mrd.: „17.396,5 Mrd. ₺“ → „17,4 Bio. ₺“
- `hh.nachtrag`: „Nachtrag ohne zusätzliche Abstimmung nach den geltenden Spielregeln.“ → „Nachtragshaushalt: Das Parlament stimmt in {tage} Tagen ab.“ (nach D-11), sonst „Nachtragshaushalt per Regierungsbeschluss.“
- `hm.bruch`: „… stabilisiere den Partner rechtzeitig.“ → „… Sprechen Sie rechtzeitig mit dem Partner.“
- `hm.anzahl`: „Vereinbare eine gültige Anzahl zwischen 1 und 600 Stimmen.“ → „Bitte wählen Sie zwischen 1 und 600 Stimmen.“
- `kp.lead`: „Entlaste Haushalte, benenne die Finanzierung und organisiere die Stimmen. …“ → „Sie entlasten die Haushalte, nennen die Finanzierung und sichern die Stimmen. Hilfe für die Menschen und eine Mehrheit im Parlament sind zwei verschiedene Aufgaben.“
- `sim/haushalt.ts:522` „… ${geaendert} ${geaendert === 1 ? "Posten" : "Posten"}“ → Katalog mit Plural „{n, plural, one {# Posten} other {# Posten}}“ (Deutsch bleibt gleich, en/tr nicht)
- `sim/haushalt.ts:652` „Das Haushaltsfenster schließt ungenutzt: Der Haushalt {jahr} läuft weiter.“ → in den Katalog (`haushalt.protokoll.fortgeschrieben`), Text bleibt

**Zentralbank**
- `zb.stufe`: „Stufe {s}“ → entfällt; es bleibt der Name „Formell unabhängig“ (mit ⓘ: „Drei Stufen: geschützt, formell unabhängig, weisungsgebunden“)
- `sim/zentralbank.ts:371` „Nicht einmischen“, Kosten „keine“ → Katalog `zb.opt.keiner` und `zb.kostenlos` („Kostet nichts“)
- `sim/zentralbank.ts:374` „Vertraulich zur Festigkeit raten“ → Katalog, Text „Vertraulich den strengen Kurs stützen“
- `sim/zentralbank.ts:44–48` „gering / mäßig / solide / hoch“ → Katalog `zb.glaub.*`
- `zb.gesetzText`: „… (jetzt {lager} von {mehrheit} Stimmen) …“ → „… (Ihr Lager hat {lager} Stimmen, nötig sind {mehrheit}) …“
- `zb.aendertNichts`: „… Die Gouverneurin bleibt bei ihrer Linie.“ → „… Die Bankführung bleibt bei ihrer Linie.“
- `zb.bild.zeile`: „Risikoaufschlag {risiko} Basispunkte“ → „Risikoaufschlag {risiko} Basispunkte (2,5 Prozentpunkte über US-Anleihen)“, oder ein ⓘ mit diesem Satz
- „Glaubwürdigkeit −3,0 Punkte“ (`sim2.sim.zentralbank.f16a017`) → „Glaubwürdigkeit −3“
- `zb.neubesetzung`: „Eine Neubesetzung ist ein Präsidialdekret: …“ → „Sie ernennen die Führung per Präsidialerlass: …“ (Erlass statt Dekret, wie sonst im Spiel)

**Folgen (`sim2.sim.folgen.*`)**
- `.2144138`: „Z6: Ausgaben und Steuern wirken auf die Nachfrage.“ → „Höhere Steuern lassen den Haushalten weniger zum Ausgeben.“ (Steuer hoch) beziehungsweise „Der Staat kauft und zahlt mehr.“ (Ausgaben hoch)
- `.24bc0c3`: „Z7: Defizite werden zu Schulden.“ → „Jedes Defizit wird zu neuen Schulden.“
- `.0bfc994`: „Z1 und Z9: Höhere Auslastung heißt mehr Produktion und Arbeit.“ → „Weniger Nachfrage heißt weniger Produktion und Arbeit.“ (richtungsabhängig)
- `.84b9b64`: „Z2: Läuft die Wirtschaft heißer, steigen Preise und Löhne schneller.“ → „Kühlt die Wirtschaft ab, steigen Preise langsamer.“ (richtungsabhängig)
- `.95daa75`: „Z8: Hohe Defizite machen Anleger nervös.“ → „Ein kleineres Defizit beruhigt die Anleger.“ (richtungsabhängig)
- `.8f9be37`: „Z4: Der Realzins zieht Kapital an oder weg, binnen Tagen.“ → „Ein niedrigerer Zins macht die Lira für Anleger weniger attraktiv, binnen Tagen.“
- `.2d910c5`: „Z1: Der Zins wirkt auf Kredite und Nachfrage, nach etwa {p0} Monaten.“ → „Der Zins wirkt nach etwa {p0} Monaten auf Kredite und Nachfrage.“
- Glied „Kreditvergabe ▲“ mit „Hohe Zinsen verteuern Kredite.“ → „Billigere Kredite: Banken verleihen mehr.“
- alle übrigen „Zn:“-Präfixe streichen

**Wirtschaftslage (`wk.*`)**
- `wk.t.inflationKopf`: „Die Inflation läuft mit {tempo} % pro Monat auf den Wert {anker} % zu, den diese Kräfte zusammen ergeben.“ → „Ohne neue Anstöße steuert die Inflation auf etwa {anker} % zu; jeden Monat legt sie gut ein Fünftel des Weges zurück.“
- `wk.t.risikoKopf`: „Der Risikoaufschlag zieht mit 2 % pro Tag zu seinem Grundwert …“ → „Der Risikoaufschlag nähert sich Tag für Tag seinem Grundwert von {grund} Punkten (jetzt {jetzt}).“
- `wk.d5684e9`: „… (Z4, Erwartungskanal).“ → Klammer streichen
- `wk.6c080c8`: „Die Märkte bepreisen die erwartete Teuerung, nicht den Rückblick (Z8, Kalibrierung WIR-1).“ → „Anleger rechnen mit der Teuerung von morgen, nicht der von gestern.“
- `wk.7d08ba6`: „Leere Reserven (WIR-2)“ → „Knappe Reserven“
- `wk.5f3e1ec`: „Ohne Pulver wird die Zentralbank getestet (Druck mit Hysterese).“ → „Hat die Bank kaum Devisen, wetten Anleger gegen die Lira.“
- `wk.2e24491`: „Laufende Intervention (WIR-2)“ → „Laufende Stützung der Lira“
- `wk.116fb7c`: „… Nachhaltigkeitsaufschlag (ZEI-4).“ → Klammer streichen
- `wk.438af1b` und `wk.47e6d22`: „(Hysterese bis 30 Mrd.)“ → „(der Zuschlag fällt erst über 30 Mrd. wieder weg)“
- `wk.7d738a2`: „… — eine dokumentierte Modellvereinfachung.“ → streichen
- `wk.ac5a079`: „… der Abstand bleibt im Modell konstant.“ → streichen
- `wk.dv.jkurve`: „Abwertung (J-Kurve)“ → „Abwertung (wirkt erst nach Monaten)“
- `wk.181a88e`: „Nach dem Haushaltsgesetz 2026 waren es rund 3,5 % des BIP, etwa jeder fünfte Lira der Steuereinnahmen.“ → „Beim Amtsantritt rund 3,5 % des BIP, etwa jede fünfte Lira der Steuereinnahmen.“ („Lira“ ist feminin: „jede fünfte Lira“; der Fehler steht auch in `data/haushaltsplan.ts:18`)
- „Gefühlte Teuerung“ und „Lebenshaltungskosten“ (Krisenrat) → ein Begriff: „Lebenshaltung“ (wie im Plan)
- `ui2.ui.wirtschaft.Lage.*` und `Lage.tsx:99` „Mit: … Vorhaben“ → Katalog `zb.mit` nutzen

**Versorgung**
- „Kurswechsel: 3 politisches Kapital · 30 Tage Bindung. Fraktionen reagieren entsprechend ihrer Linie; parlamentarische Garantien können länger binden.“ → „Kurswechsel: 3 Kapital, danach 30 Tage fest. Die Fraktionen reagieren je nach Linie.“
- „Ungedeckte Warengruppen: —“ → „Noch keine Monatsbilanz (erste am 1. Juli 2028).“
- „0 KNAPP“ → „Keine Ware knapp“

**Englisch und Türkisch (Stichprobe)**
- en `sf.politikText`: „Political points …“ → „Political capital …“
- tr `sf.politikText`: „Siyasi puanlar …“ → „Siyasi sermaye …“
- tr Folgen: „yaklaşık 6 sonra ay“ → „yaklaşık 6 ay sonra“ (Wortstellung im Platzhaltersatz)
- tr Rad: „13 %“ → „%13“; „GSYH'nin“ → „GSYH'ye oranı“
- tr `eo.paketHinweis`: „… değiştirebilirsin.“ → „… değiştirebilirsiniz.“
- tr `kp.lead`: „Haneleri destekle, …“ → „Haneleri destekleyin, finansmanı belirleyin ve oyları toplayın. …“
- en und tr: alle unter D-6 genannten deutschen Zeichenketten fehlen in den Katalogen.

---

## 4. Die fünf wichtigsten Verbesserungen

**1. Steuern als echte Sätze, an einer Stelle (D-1, D-3, D-2)**

Die Einnahmenseite der Tafel wird die Steuertafel des Landes. Jede Zeile zeigt den Satz, den Betrag und die Verlierer. Die Maßnahmen `m_einkommensteuer`, `m_mwst` und die anderen in der Politik zeigen dieselbe Zeile und führen hierher. Für Etats gilt F1: Die Maßnahme ist das Gesetz und kostet kein eigenes Geld.

```
Einnahmen                          heute → Entwurf     im Jahr
Einkommensteuer (Spitzensatz)  [−]  40 % ──●── 42 %  [+]  +252 Mrd. ₺   Beschäftigte ▼
Mehrwertsteuer (Regelsatz)     [−]  20 % ─●─── 20 %  [+]     0
Sonderverbrauchsteuer          [−]  heute ──●── +10 %[+]  +255 Mrd. ₺   Autofahrer ▼
Körperschaftsteuer             [−]  25 % ──●── 25 %  [+]     0
Kraftstoff · Immobilien · Zölle  (je eine Zeile)
```

Klick auf eine Zeile: Preisfeld wie heute (Kapital, Defizit 3,1 → 2,8 %, Verlierer). Das Innenstück des Rads wächst sichtbar mit.

**2. Haushalt in drei Ebenen und auf 1,5 Bildschirme (D-4, D-8, D-16, D-22, D-24, D-31)**

Bild: das heutige Rad. Ein Klick auf „Gesundheit, Bildung, Forschung“ zoomt (300 ms) in ein Ressortrad mit drei Stücken. Daneben stehen Porträt und Name der Ministerin mit ihrem Wunsch in Lira, und der Wunsch wirkt auf die Loyalität. Jeder Regler zeigt Lira und % BIP, die Mitte „heute“ steht in jeder Zeile gleich. Verfahren, Ausgangslage und Verlauf öffnen ein Seitenfenster statt eine Liste darunter.

```
[ Rad (Gesamthaushalt) ]   →   [ Ressortrad Bildung ]        Ministerin Ayşe Kaya  ●○○ Loyalität 54
                                 Schulen   1,9 Bio.  [−]──|──●──[+] +336 Mrd.  „Sie will +336“
                                 Hochschulen 0,7 Bio. [−]──|●───[+]
                                 Preis: 2 Kapital · Defizit 3,1 → 3,3 % · Fachkräfte ▲ in 3 Jahren
```

**3. Wirtschaftslage als Tachoband, die Bonität sichtbar (D-10, D-18, D-27, D-9, D-15)**

Oben sechs Halbkreise (der vorhandene `Tacho`-Baustein): Inflation mit Zielmarke, Arbeitslosigkeit, Wachstum, Lira real, Defizit mit 3-%-Marke, Netto-Reserven mit Gefahrenband. Im Haushalt kommt eine dritte Kopfzahl dazu: „Bonität BB− · Ausblick stabil“ auf einer kleinen Treppe CCC+ … BBB mit Marke „Anlagegrad“. Ein Klick auf einen Tacho öffnet darunter die Kurve, deren Vorgeschichte grau als Annahme gezeichnet ist, mit den drei stärksten Treibern und drei Handlungsknöpfen. „Bilanz & Entwicklung“ und die doppelten Kopfzahlen entfallen.

```
 ◜Inflation◝   ◜Arbeitslos◝  ◜Wachstum◝   ◜Lira real◝  ◜Defizit◝   ◜Reserven◝
  31,5 % ▲      8,1 %         2,3 %        +3 %         3,1 % |3   29 Mrd. $
 ───────────────────────────── Klick ─────────────────────────────
 Kurve (Verlauf │ heute │ Prognose)   │  Treiber: Erwartung +28 · Lira −1   │  [Zinssitzung →]
```

**4. Versorgung & Handel: Waren oben, Leere weg (D-17, D-34, D-11)**

Bild: ein Raster mit 15 Warenkacheln (Ikone, Deckungsring, „48 Tage ohne Einfuhr“), rot umrandet, was knapp ist. Ein Klick auf „Erdgas“ öffnet rechts Mengenrechnung, Lieferländer und die vier Knöpfe. Der Vorrang „Zivil, anteilig, Streitkräfte“ erscheint erst bei einem Engpass oder im Krieg. Das Energieabkommen wird Regierungshandeln mit Kapitalpreis und ohne 301-Stimmen-Hürde.

**5. Ein Sprachdurchgang für den ganzen Bereich (D-5, D-6, D-19, D-20, D-21, D-25, D-28, D-7)**

- Alle „Zn:“, „WIR-“, „ZEI-“, „Stufe B“ und Entwicklersätze raus.
- Alle Rückmeldungen aus `sim/haushalt.ts` und `sim/zentralbank.ts` in die Kataloge; Zahlen über `zahl()`, nie `de-DE`.
- Jede Folgezeile mit richtungsrichtiger Begründung und durchgehend „Sie“. Die fertigen Sätze stehen in Abschnitt 3.
- Dazu der Einzeiler für „Haushaltsgesetz 2.029“.

Wirkung: Englisch und Türkisch werden spielbar, und die Erklärungen stimmen mit den Pfeilen überein.

---

## Was nicht geprüft werden konnte

- **Abstimmung über das Haushaltsgesetz mit Haushaltsbericht und Mehrheitssicherung:** Der Lauf endete am 3. Oktober vor dem Votum am 24. Oktober. Geprüft ist nur der Code.
- **IWF-Verhandlung und Zahlungsbilanzkrise** (Reserven unter 10 Mrd.): nicht erreicht.
- **Zentralbank:** Stufe C mit eigener Zinsvorgabe und Stufenwechsel per Gesetz wurden nicht ausgelöst.
- **Ausgeführte Aktionen:** Devisenverkauf und Warenaktionen (Reserve, Ausfuhrstopp) wurden nicht geklickt.
- **Ursache der Defizitdrift:** Der Anstieg von 3,1 auf 3,7 % in vier Monaten ohne eigene Handlung ist nicht aufgeklärt.
- **Weitere Sprachen und Geräte:** Determinismus, Mobilansicht und ein vollständiger Abgleich aller en- und tr-Schlüssel (nur Stichproben) fehlen.
- **Amtliche Tabellen:** Die Zahlen aus den Ministeriumshaushalten habe ich nur gegen die Recherchedateien geprüft, nicht gegen die amtlichen Tabellen (sbb.gov.tr).
