# RECHERCHE: Die vollständige Rumburg-Kriegs-Matrix (Suzerain)

**Zweck:** MIL-1 („Krieg als Vorgang") — Rekonstruktion der Kriegsmechanik der Sordland-Kampagne aus allen erreichbaren Sekundärquellen, als Kalibrierungs- und Strukturreferenz für das Staatsräson-Vorgangsobjekt.
**Erstellt:** 2026-09-30 · **Abgrenzung:** Ergänzt RECHERCHE_VERTIEFUNG_KRIEG.md §5 (dort: grobe Muster; hier: vollständige Matrix mit Flag-Ebene). Der Rizia-DLC (Pales-Krieg) bleibt in §5.2 der Vertiefung dokumentiert und wird hier nicht wiederholt.
**Spielstand der Quellen:** Die strukturierten Walkthroughs (Neoseeker, Stand 2026) beschreiben die **aktuelle Version (3.x / post-2.0 „Amendment")**. Ältere Community-Guides (2021–2022) beschreiben **1.x**. Unterschiede sind in §8 gesammelt.

## Vertrauens-Level (Legende)

| Kürzel | Bedeutung |
|---|---|
| **B** | *belegt* — offizielle Wiki (wiki.gg/Fandom, dokumentiert teils interne Variablennamen) oder strukturierter Walkthrough mit exakten Flag-Namen und Schwellen |
| **MC** | *mehrfach-community-belegt* — mindestens zwei unabhängige Community-Quellen (Reddit/Steam/Neoseeker/YouTube) deckungsgleich |
| **EQ** | *einzelquelle* — nur eine Community-Quelle, plausibel, aber nicht gegengeprüft |
| **UV** | *unverifiziert / Fanon* — Community-Spekulation oder Fan-Fiction; explizit nicht Kanon |

---

## 1. Gesamtübersicht: Der Krieg als Zustandskette über 11 Turns

Suzerain teilt die Kampagne in 11 Turns (4 Kapitel). Der Rumburg-Krieg ist eine **Kette von ~25 vorbereitenden Flags (Turn 1–9), einem Auslöser-Dreieck (Turn 9–10), einem einzigen Kriegsraum-Event mit 4 Entscheidungspunkten (Turn 10) und einem Auflösungs-Event (Turn 11)**. Es gibt keinerlei taktische Ebene; der gesamte „Kriegverlauf" ist eine Auswertung akkumulierter Flags an zwei Phasen-Checks plus einem End-Check. [B — Q2, Q3]

| Phase | Turn | Kern-Events |
|---|---|---|
| Latente Rivalität | 1–2 | Infrastruktur-Weichen (H-3/L-1), Konsulats-Zwischenfall Rumburg |
| Aufrüstung & Wirtschaft | 3–6 | Militärbudget, Doktrin-Wahl (Modernisierung vs. Expansion), Wehrpflicht, Wirtschaftsaufbau, erste Bündnisse (Agnolia/Wehlen) |
| Eskalation | 7–8 | Whistleblower, Spionageskandal (Livia Suno), Gendarmerie-Streit, Militärindustrie, Supermacht-Annäherung |
| Drohkulisse | 9 | Reparationsforderung, Flugzeug-Abschuss, „Emergency Call" (Kriegsoption), TV-Interview (OMEC) |
| Beschluss & Kriegsraum | 10 | AN-Rede (Isolation), Anruf der Königin (Frieden oder Ultimatum), Kriegsplanung (2 Phasen + Verbündeten-Zuweisungen), Kriegserklärungs-Rede |
| Auflösung | 11 | Weltkrieg / Niederlage (Battle of Holsord) / Sieg (Capitulation of Rumburg) → Wahl (Sieg = automatische Wiederwahl) |

**Wichtigste strukturelle Erkenntnis vorab:** Es gibt **vier disjunkte Ausgänge der Rumburg-Frage**, und drei davon verhindern den Krieg: (a) gekaufter Frieden (Reparations-Route), (b) Abschreckung durch Bündnisbeitritt (ATO/CSP), (c) diplomatische Isolation Rumburgs (OMEC-Rauswurf + AN-Sanktionen — verhindert die Invasion), (d) Krieg (offensiv selbst erklärt oder defensiv nach Ultimatum). Der Krieg ist also der **Residualpfad**, der nur eintritt, wenn die drei Deeskalationspfade verpasst oder verworfen wurden. [B — Q1, Q2]

---

## 2. Vorbereitungsphase: Die vollständige Entscheidungsmatrix (Turn 1–9)

### 2.1 Militärbudget (Turn 3, Haushaltsgespräch)

| Wahl | Kosten/Effekt | Kriegsrelevanz | Quelle/Level |
|---|---|---|---|
| **Erhöhen** | Budget −4, Wirtschaft −1, Sollist +3 | Voraussetzung für Turn-5-Programm (Modernisierung *oder* Expansion) und Turn-6-Waffengattungs-Investition; senkt Preis der Militärindustrie (Turn 8: −2 statt −3); macht Militär „happy" (Putsch-Schutz); vermeidet „weak against Rumburg" | Q4, Q6 — **B** |
| **Halten** | keine Änderung | Turn 5: Wahl zwischen „unverändert lassen" (Valken-kompatibel) oder „kleinere, besser ausgerüstete Truppe" (Iosef-kompatibel, aber *kein* benanntes Modernisierungsprogramm, keine Turn-6-Waffengattung); „weak"-Check nur wenn zusätzlich Wehrpflicht abgeschafft **und** Livia-Leak | Q4, Q5 — **B** |
| **Kürzen** | Budget +3, Wirtschaft −2 | Erzeugt Flag **„decaying combat readiness"** + unzufriedenes Militär; triggert Turn-5-Entscheidung Grenzbefestigung; Zutat für Putsch-Route; macht Sordland „weak against Rumburg" (Beatrices Drohverhalten) | Q4, Q6 — **B** (Version-Drift: wiki.gg nennt noch Budget +2 → 1.x-Wert, §8) |

### 2.2 Doktrin-Weiche (Turn 5, „Budget Allocation of Sordish Armed Forces")

| Ausgangslage | Option | Ergebnis-Flag | Doktrin-Passung | Quelle/Level |
|---|---|---|---|---|
| Budget erhöht | **Modernisierungsprogramm** | „Modernisation Programme", „reformed, adequately equipped military", entfernt „Outdated Military Equipment" | Iosef-Pfad; Turn 6: Wahl modernisierte Armee/Luftwaffe/Marine | Q5 — **B** |
| Budget erhöht | **Expansionsprogramm** | „Expansion Programme", größere Truppe, **erzeugt „Lack of Equipment"** | Valken-Pfad; Turn 6: Wahl erweiterte Armee/Luftwaffe/Marine | Q5 — **B** |
| Budget gehalten | Truppe unverändert | „Outdated Military Equipment" bleibt | Valken-kompatibel (Massenheer) | Q5 — **B** |
| Budget gehalten | Verkleinern + bessere Ausrüstung | „reformed, adequately equipped military" | Iosef-kompatibel, aber schwächer als Programm (keine Waffengattungs-Modernisierung) | Q5 — **B** |
| Budget gekürzt | — | keine Strukturwahl | nur Grenzbefestigung (−1 Budget) als Teilkompensation | Q5 — **B** |

### 2.3 Wehrpflicht (Turn 6, Iosef-Meeting)

| Wahl | Effekt | Kriegsrelevanz | Quelle/Level |
|---|---|---|---|
| **Abschaffen** (Berufsarmee) | entfernt „Large Reservist Pool", erzeugt „Lack of Reservists"; Presseecho beidseitig | **Iosef-Pflicht**; bei gekürztem Budget + verweigerter Befestigung zusätzlich „Unruly General"; Old Guard verlangt ggf. Wiedereinführung per Dekret (Bergungsoption) | Q6 — **B** |
| **Beibehalten** | „Large Reservist Pool" bleibt | **Valken-Pflicht**; Solo-Dig-down und Dome-Plan verlangen Wehrpflicht | Q6, Q2 — **B** |

### 2.4 Waffengattungs-Investition (Turn 6, nur bei erhöhtem Budget)

Nur wer Turn 3 erhöht **und** Turn 5 ein Programm gewählt hat, darf **eine** Waffengattung ausbauen: erweiterte/modernisierte **Armee, Luftwaffe oder Marine** (kein Zusatzkostenpunkt). Diese Flags („Expanded/Modernised Army/Air Force/Navy") sind die häufigsten Schlüsselvariablen der Gewinn-Matrix (§5). Marine-Ausbau ist die Nebenbedingung für Valgslands volle Kriegsbeteiligung (Heljiland-Schutz) und für Agnolias volle Armee (Insel-Deckung). [B — Q6, Q1]

### 2.5 Grenzbefestigung Rumburg (Turn 5, nur bei gekürztem Budget)

„Build Rumburg Border Fortifications": Budget −1. Effekte: (a) verhindert negativen Generalstabs-Bericht Turn 7, (b) Turn 9 Wirtschaft +1, (c) **ersetzt in einer Kriegsraum-Teilbedingung „gehaltenes/erhöhtes Budget"** (Dig-down-Plan), (d) verhindert „Unruly General" bei Wehrpflicht-Abschaffung, (e) Zutat gegen die 7-Bedingungen-Putsch-Route. [B — Q5, Q4] Interner Variablenname im Wiki dokumentiert (`Turn05_RumburgBorderReinforcement_DontReinforce`). [B — Q4]

### 2.6 Gendarmerie (Turn 8, „Mediation of the Gendarmerie Dispute")

| Wahl | Effekt | Quelle/Level |
|---|---|---|
| **Beim Verteidigungsministerium belassen** | beendet Streit, **löscht „Unruly Generals"**; Flag „Gendarmerie under military control" — Schlüsselvariable fast aller Sieg-Pläne | Q7 — **B** |
| An Innenministerium (Lileas) übergeben, gegen Iosefs Einspruch durchgesetzt | **Iosef wird Feind**, erzeugt „Unruly Generals", **Late-Game Crisis +1**; stärkt Innenministerium; Zutat zur 7-Bedingungen-Putsch-Route | Q7 — **B** |

### 2.7 Militärindustrie (Turn 8, „Industrial Expansion")

„Expand Military Industry": Budget −3, **oder −2 bei erhöhtem Militärbudget**; Public Opinion +1. Erzeugt die Flags **„increased production" / „Sordish military-industrial complex"** — Pflichtbestandteil der Solo-Sieg-Matrix und einer der beiden Wirtschaftsblöcke der Verbündeten-Matrix. Konkurriert mit Agrar-/Auto-/Elektronik-Expansion (je −2 Budget) um denselben Entscheidungsslot — **Opportunitätszwang per Design**. [B — Q4]

### 2.8 Whistleblower (Turn 7)

Agent **Chelston Hailstone** (Rumburg Security Bureau) beantragt Asyl in Estord.
- **Asyl gewähren:** PO −1, Sollist −1, Democratic +1 → enthüllt **Rumburgs Atomprogramm** (Silos); Voraussetzung für die AN-Enthüllung (Isolation) und Schutz vor Rumburgs Atomdrohung im Krieg; **sperrt die Friedensroute**.
- **Zurückschicken:** Friedensroute bleibt offen ( dokumentierte Entscheidungsvariable). [B — Q4, Q9]

### 2.9 Spionageskandal (Turn 8, Livia Suno)

Zwei kriegsrelevante Flags: (a) **Livia bleibt nach dem Skandal in der Administration** → „Rumburg knows Sordland's military secrets" (verschärft die Schwäche-Formel Turn 9); (b) **Skandal öffentlich Rumburg zuschreiben** → Community-Konsens: notwendig für den OMEC-Rauswurf; außerdem: Sieg nach entlarvtem Spionageprogramm aktiviert eine der vier Attentats-Bedingungen in Turn 11 (Rumburg-Rache). [B für (a) — Q8; MC für (b) — Q12, Q1]

### 2.10 Bündnisse & Infrastruktur (Turn 1–9)

| Faktor | Mechanik | Quelle/Level |
|---|---|---|
| **Agnolia** (Van Hoorten) | Stahl-Deal (−1 Budget) oder Militärbündnis + Heljiland-Anerkennung (bricht Valgsland-Beziehungen, Valgsland verhängt Zölle). **H-3-Highway** (Turn-1-Megaprojekt Agnland): Agnolia kommt **pünktlich** zum Krieg; ohne sie Verspätung. Heljiland-Anerkennung + (modernisierte/erweiterte Marine) → volle Agnolia-Armee bei Dome, sonst bleibt Teil zur Inselverteidigung zurück | Q1 — **B** |
| **Wehlen** (Smolak) | Volle Teilnahme an „Operation Bear Trap" (−1 Budget nur bei Energiepreis-Spitze; später +2 Budget Öl-Deal; Bergia-BIP) = Bündnisäquivalent im Krieg. **Aber:** volle OBT **sperrt** OMEC-Rauswurf/Friedens-Isolation (Image). Wehlen-Truppe **zieht ab**, wenn Bergia unsicher: Gegenmittel = Bludisch-Versöhnung, oder Bergia zentralisiert + (Innenbudget erhöht oder BFF beschädigt), oder BFF vernichtet | Q1, Q2, Q5 — **B** |
| **Lespia** (Álvarez) | Starker Verbündeter (Bündnis nur auf kapitalistischer/neutraler Route; Wehlen-Deal zwingt Sordish-Petroleum-Verkauf → nur bei aufgehobenem EPA). **L-1-Hochgeschwindigkeitsbahn** (Turn 1) = Lespia kommt pünktlich. **Sordish Depression halbiert** Lespias Truppe; Sordish Recovery (oder Laissez-faire ohne Depression) → **lespianische Luftgeschwader** als Matrix-Baustein. Bündnis nullifiziert Valgsland-Verhandlungen (Zölle) | Q1, Q2 — **B** |
| **Valgsland** (Hegel) | Starker Verbündeter für Kommunisten-Route (Bündnis ohne Heljiland-Bedingung); sonst Heljiland-Anerkennung nötig (sperrt Agnolia). Im Krieg: **Ablenkung nach Heljiland**, wenn Valgslands Invasion läuft **und** Sordland weder (erweiterte/modernisierte Marine) noch (Heljiland-Anerkennung) hat → alle Valgsland-Zuweisungen gelöscht | Q1, Q2 — **B** |
| **Kompatible Kombinationen** | **Agnolia+Lespia** oder **Wehlen+Valgsland** (wegen Rivalitäten); Lespia+Wehlen „nicht buddies" (Vorsicht); Solo-Sieg technisch möglich (härteste Matrix) | Q1 — **B** |
| **ATO/CSP-Beitritt** | Abschreckung: Rumburg wagt keinen Angriff (Kartenanzeige „Weak"); verärgert Militär (CSP stärker). **Achtung Weltkrieg-Regel** (§6.3) | Q1, Q3 — **B** |
| **Supermacht-Hilfe (Turn 5)** | Arcasia +2 Budget / United Contana +3 Budget (oder beide ablehnen, Sollist +1). Arcasia-Hilfe = „Arcasian military influence" → Putsch-Schutz-Faktor; UC-Hilfe sperrt Lespia-Handel | Q5, Q4 — **B** |
| **Handelsvolumen** („increased trade") | Matrix-Baustein: aus den Handelsdeals (Agnolia/Wehlen/Lespia/Valgsland) aufgebaut; kein Deal Turn 5/6 → Wirtschaft −2. Exakte Schwelle **nicht dokumentiert** (§10) | Q1, Q6 — **B (Existenz) / offen (Schwelle)** |
| **Gasom/EPA** | EPA auf 10 % nach Rizia-Gasom-Einstieg sperrt Reparations-Friedensroute; Rumburg/Rizia-Anteile an Gasom später entziehen sperrt Friedensroute; Energiepreis-Spitze verteuert OBT und Beatrices Deal | Q4, Q1 — **B** |

### 2.11 Rumburg-Beziehungspflege (Eskalation vs. Deeskalation, Turn 2–9)

Deeskalations-Pflichtprogramm (Friedens- und Isolationsroute teilen große Teile): Konsulats-Schließung **nicht** erwidern (nur Brief) · nicht voll an OBT teilnehmen · kein Heljiland-Engagement · Whistleblower **zurückschicken** (nur Friedensroute) · kein Embargo, keine öffentliche Spionage-Anklage (Friedensroute) · kein Gegenschlag nach Flugzeugabschuss, keine Militärparade · Reparationen zahlen. Jede Provokations-Antwort ist einzeln dokumentiert; die Route kippt bei Verletzung einzelner Gates (z. B. OBT-Vollteilnahme für die Isolation). [B — Q1, Q8]

---

## 3. Auslöser: Wie der Krieg ausbricht (Turn 9–10)

### 3.1 Reparationsforderung (Turn 9)

Beatrice verlangt **2 Budget** Reparationen für den 15-Tage-Krieg von 1870. Zahlen = Budget −2, Wirtschaft +1, **PO −3**, Beziehung → Neutral, **Friedensgespräche beginnen** (überspringt den Emergency Call). Voraussetzung für das Angebot: kein Whistleblower-Asyl, kein Embargo, keine öffentliche Schuld-Zuweisung im Suno-Skandal, kein EPA-10 %-Rückzieher nach Rizia-Gasom-Einstieg. [B — Q4, Q9]

### 3.2 Flugzeugabschuss & „Emergency Call on an Escalating Situation" (Turn 9)

Rumburg schießt ein sordisches Flugzeug ab. Versteckte Vorprüfung: **„weak against Rumburg"** = (Militärbudget gekürzt) **oder** (Budget gehalten + Wehrpflicht abgeschafft + Rumburg kennt Militärgeheimnisse via Livia). Schwäche + Generalstabs-Purge + Allianzen bestimmen, welcher Offizier warnt. [B — Q8]

| Erste Order | PO | Bindung |
|---|---|---|
| „Start the Sordish war machine…" (Krieg erklären) | **+2** | Kriegspfad; Deivid bietet ≥1 Rückzugsoption (Fallback auf Diplomatie/Retaliation **behält die +2** — dokumentierter Exploit) |
| „An eye for an eye" (Vergeltungsschlag) | **+1** | Operation abzeichnen → Retaliation-Flag; Parade **nicht** automatisch |
| Diplomatie | **−3** | Deeskalation; optional Militärparade (Parade + Retaliation je +1 Wahl-Score in Turn 11) |

Kriegserklärung hier = **offensiver Krieg** („Sordish War Machine", Achievement) + automatische Parade. [B — Q8, Q9]

### 3.3 Turn-10-Gabel: Drei Anrufe der Königin

Nach AN-Rede und TV-Interview (Turn 9 Sacker-Interview bzw. Turn 10 AN-Rede) entscheidet sich:

1. **Versöhnungsangebot** (Frieden gekauft) — Gates: Konsulat verurteilt (Turn 2) + keine volle OBT + Reparationen gezahlt → Beatrice bietet Gaspipeline-Rabatt (30 %) gegen **KA-74-Produktionslizenz** + Friedensgipfel. Preis staffelt sich nach Energiepreis: **−1/−2/−3 Budget** (balanced/fluctuating/surging). Annahme: Beziehungen zu Rumburg **und** Rizia freundlich, Energiepreis → „fluctuating", Energieunabhängigkeit verloren, **PO −3/−6/−8 je nach Medienkontrolle** (zensiert −3 / gekaufte Medien −6 / frei −8!). Achievement „Reconciliation". [B — Q2]
2. **Ultimatum** — wenn Zwischenfall + keine eigene Kriegserklärung + kein ATO/CSP + **Isolation fehlgeschlagen**: Beatrice fordert **Estord und Narbel**. Ablehnen → **defensiver Krieg** (Rumburg greift an). Annehmen → **sofortiger, nicht mehr reparierbarer Putsch** (Iosef **und** Valken Feinde; Generalstabs-Purge schützt hier ausnahmsweise **nicht**). [B — Q2, Q3]
3. **Kein Anruf** — bei eigener Kriegserklärung (Turn 9), gelungener Isolation oder Bloc-Beitritt (Abschreckung). [B — Q1, Q2]

### 3.4 Warnsignale (was das Spiel dem Spieler vorher zeigt)

Karten-Panel „Military" (relatives Kräfteverhältnis, oberste zutreffende Zeile wird angezeigt — **Labels, keine addierbaren Punkte**: Weak/Equivalent/Strong/Overwhelming; Rumburg default „Overwhelming") · Generalstabs-Bericht Turn 7 (negativ bei Budgetkürzung ohne Befestigung) · „Communication Breakdown with Military" Turn 8 (Unruly Generals) · Iosefs/Valkens Warnungen im Emergency Call · Symon Holls Wirtschafts-Kriegshinweise (Planwirtschaft als Kriegsvorteil kommentiert) · Francs Front-Gespräch Turn 9 (Sohn beim Militär → emotionale Vorwarnung). [B — Q1, Q4, Q6, Q8; EQ — Q10 für Symon-Kommentar]

---

## 4. Kriegsphase: Der Kriegsraum (Turn 10, „Rumburg War Planning Meeting")

**Genau vier Entscheidungspunkte** in einem einzigen Event (plus Turn-10-Rede ohne mechanische Wirkung). Wer die Vorbereitungs-Matrix nicht erfüllt, kann im Kriegsraum **nichts mehr retten** — Phase-1-Fehlschlag ist nicht kompensierbar. [B — Q2]

| # | Entscheidung | Optionen |
|---|---|---|
| E1 | **Franc zurückrufen?** (nur wenn Sohn beim Militär) | Zurückrufen ändert **nichts am Kriegsergebnis** (aktuelle Version!), verhindert aber seinen Tod im Niederlagen-Epilog; Iosef verweigert den Befehl, wenn er Feind ist |
| E2 | **Verbündete anrufen?** | Agnolia/Lespia/Valgsland (bei Bündnis), Wehlen (bei voller OBT); regionale Verbündete lösen **keinen** Weltkrieg aus (nur eigene Kriegserklärung + Bloc) |
| E3 | **Phase 1 — Operationsplan** | (a) **Dig down** („invite them to certain death" — Valken-Verteidigung), (b) **Iosefs Zangenangriff**, (c) **Frontalangriff Tzarsbourgh** (nur mit Verbündeten überhaupt erfolgsfähig; verlangt eigene Kriegserklärung) |
| E4 | **Verbündeten-Zuweisung + Phase 2 — Endziel** | Phase-2-Ziel: **Thornbourgh** (Entscheidungsschlag auf Hauptstadt) oder **Dome** (längerer Nordfeldzug + Verteidigungslinie); Verbündete werden auf Front/Flanke/Dome/Tzarsbourgh-Deckung verteilt |

Soll erscheint konditional als Kommentator (privates Versprechen Turn-10-Fußball Event, oder Sollist-Route nach Notstandsverlängerung ohne Bloc-Beitritt; **kein Zahlenbonus**, nur Beratung/Dialog). Generalstabs-**Purge** entfernt Valken aus der Führung → Dig-down-Plan gesperrt, Zange bleibt. [B — Q2, Q1]

### 4.1 Verbündeten-Zuweisungen (E4-Details)

| Verbündeter | Phase-1-Optionen | Phase-2-Optionen | Ausfall-Risiko |
|---|---|---|---|
| Wehlen | Verstärkung Nargis / Flanke über Lards+Merdon | Dome / Tzarsbourgh-Deckung | **Rückzug** ohne Bludisch-Versöhnung, zentralisiertes+sicheres Bergia oder vernichtete BFF → alle Wehlen-Zuweisungen gelöscht; Smolak fehlt dann bei der Friedenskonferenz |
| Agnolia | Zangen-Unterstützung / Dome (auf anderen Plänen automatisch Dome) | läuft automatisch weiter | Verspätung ohne H-3; Teilkraft ohne Heljiland-Anerkennung+Marine |
| Lespia | automatisch (Ankunft pünktlich nur mit L-1; Depression halbiert; Luftgeschwader bei Recovery/Laissez-faire) | Tzarsbourgh-Deckung / Dome | Halbierung bei Depression |
| Valgsland | eigene Front halten / Nordinvasion Rumburgs | Dome / Flankendeckung | **Umlenkung nach Heljiland** ohne Marine+Anerkennung |

**Zwei Verbots-Kombis in Phase 2:** (a) Wehlen **und** Lespia beide auf Tzarsbourgh-Deckung → Plan scheitert; (b) beide nach Dome **und** Late-Game Crisis ≥ 2 → scheitert. [B — Q2]

### 4.2 Gewinn-Matrix Phase 1 (exakt)

Ohne Verbündete (Solo):

| Plan | Alle 5 Bedingungen |
|---|---|
| Dig down | erweiterte Armee **oder** Luftwaffe · Wehrpflicht beibehalten · Gendarmerie beim Militär · **keine** „decaying combat readiness" · erfahrene Generäle (kein Purge) |
| Zange | modernisierte Armee **oder** Luftwaffe · Wehrpflicht **abgeschafft** · Gendarmerie beim Militär · keine decaying readiness · erfahrene Generäle |
| Tzarsbourgh | **grundsätzlich unmöglich** |

Mit Verbündeten (gestufte Ersatzkette — Auszug, vollständig in Q2):

- **Dig down:** erst (erweiterte Armee/Luftwaffe/Lespia-Flügel) **oder** [(Befestigung oder gehaltenes/erhöhtes Budget) + (volles pünktliches Lespia | Valgsland an Front + Wehlen-Verstärkung | halbes pünktliches Lespia + Wehlen)]; dann (Wehrpflicht | Wehlen-Verstärkung | Agnolia auf Dome); schließlich (erfahrene Generäle | Lespia | Valgsland).
- **Zange:** erst (modernisierte Armee/Luftwaffe/Lespia-Flügel) **oder** [volles pünktliches Lespia | Valgsland-Front | halbes Lespia + (Wehlen-Flanke | Agnolia-Zange mit H-3)]; dann (Wehrpflicht abgeschafft + Gendarmerie | Wehlen-Flanke | Agnolia-Zange mit H-3); schließlich (Generäle | Lespia | Valgsland).
- **Tzarsbourgh (alle 6):** eigene Kriegserklärung · (erweiterte/modernisierte Luftwaffe | Lespia-Flügel) · (pünktliches Lespia | Valgsland) · (Wehrpflicht | Agnolia auf Dome) · (Gendarmerie | Wehlen-Flanke) · (keine decaying readiness + (Generäle | Lespia | Valgsland)).

### 4.3 Gewinn-Matrix Phase 2 (exakt)

Solo (starr):

| Ziel | Alle Bedingungen |
|---|---|
| Thornbourgh | modernisierte Armee/Luftwaffe · increased production + Militärindustrie · increased trade + **isoliertes Rumburg** · Gendarmerie + Wehrpflicht · Late-Game Crisis ≤ 3 |
| Dome | **erweiterte** Armee/Luftwaffe · Produktion+Industrie · Handel+Isolation · Gendarmerie + Wehrpflicht · LGC ≤ 3 |

Mit Verbündeten: Thornbourgh = (modernisiert | Lespia-Flügel | Valgsland-Nordinvasion) + [(Navy oder Valgsland-Front) und (Handel | Isolation)] **oder** [Produktion | Industrie] + (Gendarmerie | Wehrpflicht | Verbündeter deckt Tzarsbourgh). Dome analog mit erweiterter statt modernisierter Truppe und mehr Verbände-Alternativen. [B — Q2]

### 4.4 End-Check (Turn 10 Rede → Turn 11 Auflösung)

**Sieg genau dann, wenn alle vier:** (1) Phase 1 erfolgreich, (2) Phase 2 erfolgreich, (3) **Late-Game Crisis ≤ 3**, (4) **keine Sordish Depression**. (3)+(4) werden selbst dann erneut geprüft, wenn der Plan sie schon enthielt. Vorher greift die **Weltkrieg-Regel** (§6.3). [B — Q2, Q3]

**Die Doktrin-Konsistenz-Regel in einem Satz:** Die Matrix ist als **Paarungslogik** gebaut — Modernisierung↔Wehrpflicht-ab↔Zange↔Thornbourgh (Iosef) vs. Expansion↔Wehrpflicht-an↔Dig-down↔Dome (Valken). Mischformen scheitern an den UND-Verknüpfungen; Community-Formel: „follow one doctrine consistently". [B — Q1, Q2, Q11]

---

## 5. Zahlen & Flavor, soweit belegt

| Größe | Wert | Kontext | Level |
|---|---|---|---|
| Militärbudget erhöhen | −4 Budget, −1 Wirtschaft | Turn 3 | B (Q4/Q6); wiki.gg nennt identisch |
| Militärbudget kürzen | **+3 Budget**, −2 Wirtschaft | Turn 3 (2.0+); 1.x/wiki.gg: +2 | B mit Versionsdrift (Q4 vs. Q6) |
| Grenzbefestigung | −1 Budget | Turn 5, nur nach Kürzung | B (Q4) |
| Militärindustrie | −3, bei erhöhtem Budget −2; PO +1 | Turn 8 | B (Q4) |
| Reparationen | −2 Budget, +1 Wirtschaft, **−3 PO** | Turn 9 | B (Q4, Q9) |
| Friedensdeal Beatrice | −1/−2/−3 Budget (Energiepreis), PO −3/−6/−8 (Medienkontrolle) | Turn 10 | B (Q2) |
| Kriegsorder PO | Krieg +2 / Vergeltung +1 / Diplomatie −3 | Turn 9 Emergency Call | B (Q8) |
| Whistleblower-Asyl | PO −1, Sollist −1, Dem +1 | Turn 7 | B (Q4, Q9) |
| Putsch-Soforteffekt | Wirtschaft −2, Budget −1 | Turn 10/11 | B (Q2) |
| Weltkrieg-Tote | **~63 Mio.**, Rayne stirbt | Turn 11 Epilog | B (Q3) |
| Zivile Kriegstote | **bis ~1 Mio. Zivilisten** vs. „nur Zehntausende Soldaten" (Ergebnisbildschirm, auch bei abgewehrtem Angriff) | Turn 11 | EQ (Q12, „Inferred Holocaust") |
| Valken-Plan Flavor | Armee 400.000 + **>1 Mio. Einberufene**, **99.332 Gefallene** | Kriegsberichte | EQ (Q13) |
| Sordische Streitkräfte | **~200.000**, 5.-größte Ost-Merkopas | Codex | B (Q14) |
| Valgsland / Lespia | ~140.000 (Marine-Schwerpunkt) / ~200.000 | Community aus Spieltexten | EQ (Q15) |
| Rumburg | 121 Mio. Einwohner, 4.-größte Weltwirtschaft, Atommacht; Militär „in einem Jahrzehnt **verdreifacht**" (AN-Rede-Zeile) | Codex/Spiel | B (Q16, Q17) |
| Kriegsdauer (In-Story) | beginnt 1957, verzögert die Wahl **nicht** → Community-Schätzung **< 1 Jahr, eher < 6 Monate** | Turn 10→11 | EQ (Q18) |
| Historischer Referenzkrieg | **15-Tage-Krieg 1870** (5.–20.10.), Patt, Estord-Incident (Vertreibung/Massaker an Rums) | Codex | B (Q16) |

---

## 6. Folgen

### 6.1 Sieg („Capitulation of Rumburg", Achievement „Vectern sis da!")

- **Vertrag:** Kapitulation; Vertragsbedingungen sind **durch Plan + eingesetzte Verbündete fixiert** (Antworten an Beatrice ändern nichts); Community berichtet Friedenskonferenz mit den mitkämpfenden Verbündeten (Smolak nur bei Wehlen-Beitrag). Der Vertrag kann **„Treaty of Rayne"** heißen. [B — Q3; MC — Q12, Q19]
- **Territorium:** Community-Konsens: **2 neue Städte** für Sordland. Welche genau, ist uneinheitlich dokumentiert (Tzarsbourgh sehr wahrscheinlich; Dome geht erwartbar an Agnolia, wenn diese Dome eroberten). **Exakte Annexionsliste unverifiziert** (§10). [EQ — Q12; UV im Detail]
- **Wahl:** Kriegssieg = **Priorität-1-Automatiksieg** bei der Wahl (vor Depression-Check) — „landslide reelection". [B — Q3]
- **Putsch-Löscher:** Beginn der Kriegsroute **löscht ein ausstehendes Putsch-Ende**; der Sieg ersetzt den Putsch (auch für Kommunisten-Rayne). [B — Q1, Q11]
- **Risiken danach:** Attentats-Flag „Rumburg weiß von Entlarvung der Suno-Spionage + Kriegssieg" (SSP oder Taschenuhr retten); Wirtschaftszustand wird **nicht zurückgesetzt** — wer mit klammer Wirtschaft siegte, erbt die Krise (Rizia-Parallelbericht: „economy tanked and in tatters, with a revolution brewing"). [B — Q2, Q3; EQ — Q20]
- **Flavor:** Beatrice erscheint persönlich zur Unterzeichnung; optionale Demütigungen („Don't ever forget who your Suzerain is", Mittelfinger für Franc — Rizia-DLC referenziert das). [B — Q3]

### 6.2 Niederlage („Battle of Holsord", Achievement „Hail the Queen")

Rumburgs Armee überrennt Sordland, Holsord brennt. Endsequenz im Bunker: **Selbstmord (Pillen/Pistole), Heldentod, Gefangennahme** (→ elektrischer Stuhl bei Widerstand gegen Beatrice, sonst **lebenslange Haft in Thornbourgh**). Franc stirbt beim Konvoi, falls an der Front und nicht zurückgerufen. Fanon (nicht Kanon): Rumburg annektiert Agnland/Nargis/Dome-Rest, Sordland/Bergia als Marionette — passt zu Beatrices „Great Unification". [B — Q3; UV — Q12-Fanon]
**Für die Matrix wichtig:** Niederlage ist das *einzige* Kriegsergebnis ohne Weiterführung der Präsidentschaft; sie ist deterministisch aus der Matrix, keine Würfelkomponente. [B — Q11]

### 6.3 Weltkrieg („World At War")

Eigene Kriegserklärung **+ ATO-/CSP-Mitgliedschaft** → Supermächte eskalieren, Atomkrieg, ~63 Mio. Tote, Rayne stirbt; setzt im Save ein „Doomed by Canon"-Präzedenz. Rein **defensiver** Krieg als Bloc-Mitglied eskaliert **nicht**; Bloc-Beitritt ohne eigene Erklärung = beste Abschreckung. [B — Q3, Q11]

### 6.4 Frieden ohne Krieg (zwei Routen)

1. **Gekaufter Frieden:** Reparationen (−2 Budget, −3 PO) → Beatrice-Deal (Gas-Rabatt vs. KA-74-Lizenz, Gipfel; PO −3 bis −8 je nach Presse; Energie-Abhängigkeit). „Frieden hat einen sichtbaren Innenpreis und einen unsichtbaren strategischen Preis." [B — Q2, Q4]
2. **Isolation:** OMEC-Rauswurf (Turn-9-Interview, ≥5 „International Favor", keine volle OBT, AN nie beschuldigt) **+** AN-Rede mit KA-74/BFF-Beweisen (+ Whistleblower-Atomprogramm) → Rumburg isoliert/sanktioniert, **Invasion findet nicht statt**, Ultimatum-Anruf entfällt; Isolation ersetzt im Kriegsraum fehlende Handels-Unterstützung (falls der Spieler doch selbst angreift). [B — Q2]

### 6.5 Generalstab-Putsch-Routen (Valken/Iosef)

| Route | Bedingungen | Wer putcht |
|---|---|---|
| Gebietshingabe | Estord+Narbel abgetreten | beide; Purge hilft **nicht** |
| Unruhe-Route | Unruhe ungelöst (oder BFF-Deal bei aktivem Aufstand) + keine Arcasia-Präsenz + Old Guard intakt + kein Purge | Iosef (wenn Feind), sonst Valken |
| 7-Bedingungen-Schwäche | kein Purge + keine Arcasia-Präsenz + Old Guard intakt + **Budget gekürzt** + **Grenze nicht befestigt** + **Gendarmerie wegtransfersiert** + **PO ≤ 5** | dto. |
| Kommunisten-Provokation | „As much as I share their ideals…" vor Iosef | Iosef direkt |

Iosef-Putsch → Iosef wird Präsident, **stellt Demokratie wieder her**; Valken-Putsch → Militärherrschaft. **Purge** (nur mit autoritärer Verfassung per Dekret) verhindert die normalen Routen, löscht aber Valkens Kriegsplan. Kriegsbeginn bzw. -sieg ersetzt jeden geplanten Putsch. Prozess-Epilog: Todesstrafe-Dekret entscheidet Erschießung vs. lebenslang (Amnestie nach 7 Jahren). [B — Q2, Q3, Q11, Q14]

---

## 7. Wirtschafts-/Bündnis-Nebenbedingungen, die oft übersehen werden

- **Sordish Depression = automatischer Kriegsverlust** (End-Check) — die Kriegswirtschaft *ist* die Wirtschaft. Budget-Sparen in 2.0+ so knapp, dass Community-Runs mit voller Militärausstattung regelmäßig in die Depression rutschen und deshalb verlieren. [B — Q3; MC — Q10]
- **Late-Game Crisis ≤ 3** ist ein eigener, separat akkumulierter Punktestand (u. a. Gendarmerie-Zwangstransfer +1); Quellen der Punkte nicht vollständig dokumentiert (§10). [B (Existenz) — Q2]
- „Increased trade" + „isoliertes Rumburg" sind die beiden Wirtschafts-AND-Glieder der Solo-Matrix: **Wer Rumburg nicht isolierte UND zu wenig handelt, kann solo nicht gewinnen** — Suzerain codiert „Logistik = Handel + Diplomatie" direkt in die Sieg-Bedingung. [B — Q2]
- **Petr schlägt dem Spieler explizit vor, einen Krieg zur Wahlrettung anzuzetteln** (Dialog) — Krieg als innenpolitisches Instrument ist im Text verankert. [EQ — Q12]

---

## 8. Versionsunterschiede (1.x vs. 2.0 „Amendment" vs. 3.x)

| Aspekt | 1.x (2021–22) | 2.0 (31.07.2023) / 3.x (Rizia-Ära 2024–25) | Quelle/Level |
|---|---|---|---|
| Sieg-Schwelle | Community: „zwei Verbündete + Iosef-Plan genügt, nicht mal Budgeterhöhung nötig" | Vollmatrix mit Phase-1/2-Checks, Verbündeten-Zuweisungen, LGC- und Depression-End-Check; **deutlich härter** | MC (Q21 1.x) / B (Q2) |
| Franc an der Front | Community: hält Truppenmoral (Kriegsbonus) | Aktueller Walkthrough: Rückruf **ändert nichts** an der Kriegsrechnung (nur Epilog) | MC→B-Konflikt (Q10 vs. Q2) — **Versionsdrift, als 2.0-Nerf lesen** |
| Budgetwerte | wiki.gg: Kürzung +2 | Neoseeker aktuell + Reddit: **+3** (und Erhöhung −4 bestätigt) | B-Drift (Q4 vs. Q6/Q22) |
| Soll im Kriegsraum | erschien breiter/unklar | strikt konditional (Versprechen oder Sollist-Notstands-Route, kein Bloc) | B (Q1) |
| Inhalt | — | 2.0: neue Szenen, Gesetze, „mehrere hundert" News-Events; Schach, erweiterte Kriegsraum-Logik (Ally-Phase-2) | B (Q23) |
| Rebalance 3.1 | — | „major rebalancing"; Community (Ende 2025): **„Rumburg War got a recent difficulty increase"**, teils als nahezu unschaffbar ohne optimale Route beschrieben; Budget allgemein knapper („budget so stretched in 2.0+") | MC (Q24, Q10) |
| Rizia-Krieg (3.x) | — | eigener, buchhalterischer Kriegs-Modus (Einheitenbau/AP, Blockade→Arbitration→Krieg); Patch-Notiz: „War Phase: fortify nicht mehr möglich" → Torpor **balanciert Kriegssysteme fortlaufend nach** | MC (Q20, Q25) |

**Konsequenz für Zitate:** Alle Flag- und Schwellenangaben in §2–§6 beziehen sich auf die **aktuelle (3.x-)Matrix**; 1.x-Angaben nur, wo explizit markiert.

---

## 9. Ableitung für Staatsräson: Übersetzung ins Vorgangs-Objekt (MIL-1)

### 9.1 Zustandsfolge (6 Zustände) mit Suzerain-Beweis je Übergang

| Vorgangs-Zustand | Suzerain-Analog | Übernahme-Regel |
|---|---|---|
| **1 Spannung** | Turn 2–7: Konsulats-Zwischenfall, Grenzzwischenfälle, Whistleblower, Spionageskandal | Zustand kostenlos betretbar, jede Antwort setzt Eskalations- **oder** Deeskalations-Flags (Suzerain: einzelne Antworten kippen ganze Friedensrouten!). Sichtbarkeit: Beziehungsmatrix-Sicherheitsdimension + Karten-Anzeige „Militärstärke relativ" |
| **2 Drohkulisse** | Turn 9: Reparationsforderung + Flugzeugabschuss + Emergency Call | **Ausstieg muss teuer sein**: Frieden kostet Budget + Wähler (PO −3/−8) und langfristige Abhängigkeit; Suzerains dreistufiges PO-Menü (Krieg +2 / Vergeltung +1 / Diplomatie −3) als Vorlage für unsere Eskalations-Antworten inkl. „Rallye-Bonus" |
| **3 Einsatzbeschluss** | Turn-9-Kriegsmaschine / Turn-10-Ultimatum-Ablehnung | **Staatsräson-Verbesserung gegenüber Suzerain**: bei uns Parlament (Kriegskredit/Mandat) — Suzerain entscheidet der Präsident allein, und die Community empfindet das als Leerstelle. Defensiv-Fall = Deutungshoheit-Rabatt (Suzerain: defensiver Krieg hat keinerlei Weltkrieg-/Legitimitäts-Malus) |
| **4 Verlauf** | Turn-10-Kriegsraum: 4 Entscheidungspunkte (Personalie, Verbündetenruf, Phase 1, Phase 2+Zuweisung) | Unser Verlauf in Wochens-Schritten = Suzerains zwei Phasen aufgefächert: pro Schritt **Frontbericht** (abstrakte Lage aus Bereitschaft/Moral/Nachschub/Doktrin-Passung) + **ein** Entscheidungsangebot (Ressourcen-Umverteilung, Bündnis-Anruf, Plan halten/wechseln). Kritisch: **kein Zurück** — Phase-1-Fehlschlag nicht mehr reparierbar (Suzerain-Prinzip der Irreversibilität) |
| **5 Waffenruhe** | Ultimatum-Annahme (schlecht) / Kapitulation (gut/schlecht) / Friedensangebot im Verlauf | Suzerain bietet kein Friedensangebot *während* des Krieges — **unsere Lücke füllen**: Gegner kann bei Stagnation Waffenruhe anbieten (Preis wächst mit Eskalationsstufe, vgl. Suzerains Reparationslogik) |
| **6 Frieden** | Turn 11: Vertrag mit fixen, aus dem Verlauf abgeleiteten Bedingungen; Friedenskonferenz mit Mitkämpfern | Bedingungen = Funktion von Verlauf + Beiträgen Dritter (Wehlen ohne Beitrag → nicht am Tisch). Vertrags-Benennung („Treaty of Rayne") als Prestige-Belohnung übernehmen — kleine, billige, emotionale Mechanik |

### 9.2 Entscheidungspunkte im Verlauf (konkrete Liste, an Suzerain kalibriert)

1. **Strategie-Wahl** (Generalstab präsentiert 2–3 plandoktrin-kompatible Pläne; jeder Plan deklariert: benötigte Bereitschaftsprofile, Dauerbandbreite, Logistikbedarf, Verbündetenrollen).
2. **Verbündeten-Aktivierung** (anrufen ja/nein — Weltbild-Kosten; jeder Verbündete bringt **eigene Einsatzpräferenz** mit, die man nicht beliebig umbiegen kann — Agnolia will Dome, Punkt).
3. **Zuweisung der Verbündeten** (Front/Flanke/Nebenziel) inkl. Verbots-Kombis (Suzerains „beide auf Deckung = Scheitern" als Anti-Stapel-Regel).
4. **Ressourcen-Umverteilung im Verlauf** (Suzerain-Analog: keins vorhanden — bei uns: Nachschubstatus durch Handel/Infrastruktur; Kriegswirtschaft-Stufen aus MIL-2).
5. **Personalie** (Sohn an der Front; General halten/entlassen; Purge = Optionen löschen).
6. **Friedensangebot annehmen/ablehnen** (unser Zustand 5).

### 9.3 Doktrin-Passungs-Mechanik (Konsistenz-Regel) — der wichtigste Import

Suzerains Matrix ist keine Summe, sondern eine **Menge von UND-verknüpften Paarungsprofilen**. Übersetzung:

- Jede unserer 3 Doktrin-Linien bekommt ein **Kriegsprofil**: `{Truppenstruktur, Bereitschafts-Flags, Wirtschaftsprofil, Bündnistiefe, Logistikstatus, passende Operationen}`.
- Verlaufs-Auswertung = Profil-Match: erfüllte Glieder / benötigte Glieder je Phase. **Mischen über Doktrinen hinweg zahlt nichts aufeinander ein** (Modernisierung zählt für Valken-Profil = 0), plus Harte-Gates für Kernpaarungen (Wehrpflicht↔Massenheer; Berufsheer↔Zangenmanöver).
- **Planwechsel im Verlauf**: Offiziersvertrauen −Δ, ein Verlaufs-Schritt verloren, Ereignis „Strategiestreit im Generalstab" sichtbar. (Suzerain erlaubt keinen Wechsel — wir machen ihn teuer statt unmöglich, weil unser Verlauf länger ist.)
- **Purge-Regel**: Generalstab säubern = ein Doktrin-Zweig + seine Pläne dauerhaft gelöscht; Putsch-Risiko ↓. Suzerains bitterste Lektion 1:1 übernehmbar.
- **Verbündeten-Beitrag ist flag-basiert, nicht pauschal**: Pünktlichkeit (Infrastruktur), Stärke (Wirtschaftslage), Abzugsrisiken (innere Konflikte des Partners) — jeder Verbündete ist eine **kleine Bedingungskette**, kein +2-Bonus.

### 9.4 Folge-Tabellen (mit Suzerain-Ankerwerten)

| Dimension | Kriegsbeginn | Verlauf | Sieg | Niederlage | Gekaufter Frieden |
|---|---|---|---|---|---|
| **Märkte** | CDS/Öl-Sprung; PO-Rallye +2 (Suzerain-Anker) | Depression = automatischer Verlust (härtester Suzerain-Check!); LGC-Krisenpunkte akkumulieren | Vertrag + ggf. Reparationen/Handel; **Wirtschaft wird nicht geheilt** — Krise erben | Reparationen/Gebietsverlust; Wirtschaftskollaps-Szenario | −1..−3 Budget (energiepreis-abhängig), langfristige Rohstoff-Abhängigkeit, Energiepreis-Verschlechterung |
| **Wähler** | Krieg +2 / Vergeltung +1 / Diplomatie −3 (Turn-9-Anker) | Frontberichte verschieben Stimmung phasenweise | **Automatischer Wahl-Automatiksieg** (Priorität 1) | Sturz-Routen; kein Wahlausgang mehr relevant | PO −3 (Reparationen) bis −8 (Deal bei freier Presse!) — **freie Medien verteuern Frieden**, ein Suzerain-Detail, das wir 1:1 brauchen |
| **Offiziere** | Schwäche-Signale (Budget↓, Grenze offen, Gendarmerie weg, PO≤5) als Putsch-Zutaten | Planwechsel kostet Vertrauen; Fehlschlag-Phasen senken es | Putsch-Ende gelöscht; siegender Präsident unantastbar | Putsch/Amtsenthebung/Fall | Generäle unzufrieden, aber kein Putsch (Suzerain: nur Gebietshingabe putschen sofort) |
| **Völkerrecht** | Rahmung deklarieren (Suzerain: eigen-erklärt vs. angegriffen unterscheidet Weltkrieg-Regel) | AN/UNO-Analog: Beweis-Events (Rüstung, Atomprogramm) als Isolations-Mechanik | Isolierter Gegner → bessere Vertragslage; Supermacht-Sanktionen möglich | Besatzung/Diktat ohne Instanz | AN-Vermittlung als Bühne; Frieden über Drittinstanz legitimiert |
| **Welt eskaliert** | **Bloc-Mitglied + eigene Erklärung = Weltkrieg** (63 Mio.) | Drittstaaten wählen Seiten | — | — | — |

### 9.5 Was Suzerain bewusst *nicht* hat — unsere Design-Freiheitsgrade

Kein Parlament beim Einsatzbeschluss · kein Friedensangebot mid-war · keine Verlaufs-Zeitachse (alles ein Event) · keine Veteranen-/Nachkriegs-Verwaltung · keine Taktik. Unser Vorgangs-Objekt füllt genau die ersten vier Punkte und bleibt beim fünften hart (Negativliste).

---

## 10. Offene Punkte — nur durch eigenes Spielen oder Dataminen klärbar

1. **Exakte Annexions-/Vertragsliste nach Sieg** (welche 2 Städte? Dome-Verteilung an Agnolia konditional?) — Community widerspricht sich; nur Epilog-Screenshots/Datamine.
2. **„Increased trade"-Schwelle** (welche Deal-Kombinationen zählen; Rolle von Morna Port/Lorren-Investments) — im Steam-Thread scheiterte ein Run trotz 3 Handelspartnern an „insufficient trade volume".
3. **Late-Game-Crisis-Punkte**: vollständige Quellenliste und Gewichte (Gendarmerie-Zwang +1 belegt, Rest offen).
4. **Agnolia-Dome-Problem**: Bedingungen, unter denen Agnolia Dome *nie* einnimmt (mehrere unabhängige Verlierer-Berichte; vermutlich hartes Gate, evtl. Bug).
5. **3.1+/2025er-Schwierigkeitserhöhung**: exakte Änderungen (Thread behauptet „difficulty increase", Details nicht öffentlich; Torpor patcht ohne vollständige Changelogs der Kriegsflags).
6. **„Contrian synergy"** (Reddit-Kommentar: Budget-Erhöhung „trying to hit military and Contrian synergy" — unklare Mechanik, evtl. United-Contana-Investitions-Synergie).
7. **Ob der Krieg selbst laufende Budget-Kosten hat** (Turn 10/11) — nicht dokumentiert; vermutlich nein (Kosten sind vorgelagert), aber für unsere Kalibrierung relevant.
8. **Lileas-Verrat im Krieg** (TV Tropes: sie läuft zu Rumburg über, wenn anti-sollistischer Rayne Krieg führt → „Sordlands Zerstörung, wenn nicht vorher erledigt") — nur Einzelquelle; genaue Flags/Auswirkung offen.
9. **Zivilopfer-Formel** (bis ~1 Mio.): woran hängt die Höhe (Dauer? Plan?) — nur Ergebnisbildschirm-Beobachtung.
10. **Ob Soll im Kriegsraum versteckte Boni gibt** — offiziell „kein Zahlenbonus", aber ungeprüft.
11. **Kriegsdauer exakt** (Community: <6 Monate) — nur aus Wahl-Terminlogik erschlossen.
12. **PO-/Wirtschafts-Deltas des Kriegsverlaufs selbst** (zwischen Erklärung und Auflösung) — undokumentiert.

---

## 11. Quellenverzeichnis mit Qualitätseinstufung

| # | Quelle | Typ | Qualität |
|---|---|---|---|
| Q1 | neoseeker.com/suzerain/guides/Geopolitics (Stand 2026) | Strukturierter Guide: Bündnisse, Frieden/Isolation/Krieg, Militärstärke-Tabelle | Hoch (B) — deckt sich mit Wiki-Flags |
| Q2 | neoseeker.com Walkthrough Chapter IV Turn 10 | Walkthrough mit exakten Flag-Namen, Schwellen, Kriegsraum-Matrix | Sehr hoch (B) — zentrale Quelle |
| Q3 | neoseeker.com Walkthrough Chapter IV Turn 11 | Enden, Weltkrieg, Sieg/Niederlage, Wahl-Prioritäten | Sehr hoch (B) |
| Q4 | suzerain.wiki.gg + suzerain.fandom.com „Decision" | Offizielle Wiki, dokumentiert interne Variablennamen | Hoch (B), teils 1.x-Zahlen |
| Q5 | neoseeker.com Walkthrough Turn 5 | Budget-Programme, Befestigung, Supermacht-Hilfe | Hoch (B) |
| Q6 | neoseeker.com Walkthrough Turn 6 | Wehrpflicht, Waffengattungen, Handelsauflösung | Hoch (B) |
| Q7 | neoseeker.com Walkthrough Turn 8 | Gendarmerie-Mediation, Oligarchen | Hoch (B) |
| Q8 | neoseeker.com Walkthrough Turn 9 (via Such-Snippets) | Emergency Call, Schwäche-Formel, Reparationen | Hoch (B) |
| Q9 | neoseeker.com „Decision Prompts Guide and List" | Prompt-Texte + Werte (Whistleblower, Reparationen) | Hoch (B) |
| Q10 | Steam-Diskussion 6760518612022769157 („Agnolia/Wehlen-Run") | Detaillierter Verlierer-Bericht 2.0 mit Voll-Setup | Mittel (MC/EQ) — Fehleranalyse wertvoll |
| Q11 | neoseeker.com „Main Endings Guide" | Putsch-/Kriegs-/Weltkrieg-Enden, Doktrin-Regel | Hoch (B) |
| Q12 | tvtropes.org Suzerain-Seiten (Main/YMMV/NightmareFuel) | Community-Wiki: Treaty of Rayne, 2 Städte, Zivilopfer, Lileas-Verrat, Petr-Vorschlag | Mittel (EQ), Fanon-Teile als UV markiert |
| Q13 | reddit.com/r/suzerain 1k38lpz (Merkopa-Truppengrößen) | Flavor-Zahlen Valken-Plan (400k/1 Mio./99.332) | EQ |
| Q14 | suzerain.fandom.com „Sordish Armed Forces" / „Sordland/Strategy" | 200.000 Soldaten; Iosef/Valken-Profile, Putsch-Notizen | Hoch (B) |
| Q15 | Steam-Diskussion 6760519036171821047 | Valgsland 140k / Lespia ~200k | EQ |
| Q16 | wiki.gg/fandom „Rumburg", „15-Day War", Codex torporgames.com | Lore: 121 Mio., Atommacht, 1870er Krieg | Hoch (B) |
| Q17 | gamenguides.com Kapitel-IV-Guide | AN-Rede-Zeile „military has tripled", OMEC-Ablauf | Mittel (EQ) |
| Q18 | reddit.com/r/suzerain 1gqdfbb (Kriegsdauer) | < 1 Jahr, eher < 6 Monate | EQ |
| Q19 | reddit.com/r/suzerain 1icrmhh („Treaty Of Rayne") | Solo-Sieg-Bestätigung, Vertragsname | EQ |
| Q20 | reddit.com/r/suzerain 1kwiw6t (Rizia 3.1 War Guide) | Rizia-Kriegsmechanik + „economy tanked, revolution brewing" | MC (mit Q25) |
| Q21 | Steam-Diskussionen 2021 (3102389184713925502, 3033725780706587580) | 1.x-Regeln („zwei Verbündete + Iosef") | MC (1.x) |
| Q22 | reddit.com/r/suzerain 1tsyyli (Militärfunding-Werte) | Budgetwerte 3.x (+3/−4) | MC (mit Q6) |
| Q23 | torporgames.com Pressemitteilung 2.0 „Amendment" (31.07.2023) | Offiziell: neue Szenen/Gesetze/Events | B (Hersteller) |
| Q24 | reddit.com/r/suzerain 1s80pc3 (Update-Rückblick 2025) | „Rumburg War got a recent difficulty increase" | EQ |
| Q25 | Steam Bug-Forum (Pinned/2024–25) | Rizia „War Phase: fortify" geändert — laufendes Rebalancing | EQ |
| Q26 | YouTube: „Win the Rumburg War Every Time!" (11/2025), „1.17 Solo-Win" | Video-Guides (Transkript-Snippets), bestätigen Iosef+Lespia+Agnolia-Mainline | MC |

**Nicht verwertet / verworfen:** Mock-Elections-Wiki (Fan-Fiction-Alternativgeschichte, kein Kanon); Sufficient-Velocity-Quest (Fan-Fiction — ihre Friedensbedingungen „Dome→Agnolia, Datefort→Wehlen, Tzarsbourgh→Sordland, Rüstungsindustrie-Abrüstung, GASOM-Rückgabe" sind **erfunden**, spiegeln aber Community-Erwartungen an einen „harten Siegerfrieden" — als Stimmungsbild in §6.1 erwähnt, UV).

---

## 12. Die fünf wichtigsten Erkenntnisse (Kurzfassung)

1. **Der Krieg wird Jahre vor seinem Ausbruch entschieden.** Die eigentliche „Kriegsmatrix" ist eine ~25-Flag-lange Vorbereitungskette (Turn 3–9); der Kriegsraum selbst hat nur 4 Entscheidungen und kann fehlende Vorbereitung nicht reparieren. → Unser Vorgang muss die Eskalationsphase als Hauptspielfläche ernst nehmen, nicht als Vorspann.
2. **Doktrin ist eine Paarungslogik, kein Punktesystem.** Modernisierung↔Berufsheer↔Zange↔Hauptstadt-Stoß vs. Expansion↔Wehrpflicht↔Grabenkrieg↔Langfeldzug — UND-verknüpft, Mischen = 0. Das ist die direkt übernehmbare „Konsistenz-Regel" für unsere 3 Doktrin-Äste.
3. **Wirtschaft ist Kriegsbedingung, nicht Kriegskostenpunkt.** Depression = automatische Niederlage; Handelsvolumen + gegnerische Isolation sind AND-Glieder der Sieg-Matrix. Logistik wird als *Diplomatie+Handel+Infrastruktur* codiert (H-3/L-1 = Pünktlichkeit der Verbündeten), nicht als Versorgungs-Taktik.
4. **Jeder Deeskalationspfad hat einen Innenpreis, und freie Medien machen Frieden teurer** (PO −3 bis −8 staffelt nach Medienkontrolle; Reparation −2 Budget/−3 PO; Gebietshingabe = Sofort-Putsch). Frieden ist spielbar, aber sichtbar bezahlt — genau unsere „harte, aber faire" Preisliste.
5. **Krieg ist der Putsch-Löscher und Wahl-Automatiksieg — und trotzdem meist ein Fehler.** Sieg löscht Putsch-Ende und garantiert die Wiederwahl (Priorität 1), aber die Erfüllungsbedingungen sind so teuer, dass derselbe Aufwand ohnehin gewonnen hätte („Awesome, but Impractical"); Niederlage ist der einzige Pfad ohne jede Fortsetzung; und Bloc-Mitgliedschaft + eigene Erklärung = Weltuntergang. Eine perfekte Risiko-Versuchungs-Schere für MIL-1.
