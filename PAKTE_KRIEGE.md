# Pakte, Koalitionen und Kriege zwischen anderen Staaten (04.10.2026)

Simulation für `KARTE_KONZEPT_2026-10-04.md`, Abschnitt 6. Code: `game/src/sim/pakte.ts`, `pakte-typen.ts`; Anbindung in `krieg.ts`, `welt-modell.ts`, `ereignisse-krieg.ts`, `welt-ereignisse.ts`. Alle Zahlen sind Spielparameter (Kommentar am Wert), Tatsachen stehen nur mit Quelle in den Klauseltexten.

## Regeln in Klartext

1. **Pakt = Institution + Klausel.** NATO und Mekka-Pakt: *kollektiv* (Angriff auf ein Mitglied gilt als Angriff auf alle); EU (Art. 42 Abs. 7 EUV) und Golf: *Beistand* (Pflicht mit Gewicht 0,6); SOZ und Turkstaaten: *Konsultation* (0,2); BRICS und G20: keine. Dazu kommen laufende bilaterale Klauseln „beistand“ aus Verträgen.
2. **Pflicht nur für das Opfer.** Wer selbst angreift, löst keinen Bündnisfall aus und verliert Ansehen und Nähe zu den Pakt-Führern. Beginnt die Türkei, gilt: Revision, Schutz, Beistand: das Opfer ist der Gegner; Selbstverteidigung: beide Seiten zur Hälfte. Beginnt der Gegner, sind die Pakt-Partner der Türkei verpflichtet.
3. **Pakt mit beiden Streitparteien = Spaltung.** Türkei gegen ein NATO-Mitglied: keine Klausel verpflichtet, der Krieg spaltet den Pakt; die übrigen Staaten entscheiden nach Eigeninteresse (`koalition.spaltung`).
4. **Eigeninteresse** (Punkte): Bündniswert, Feindschaft zur Gegenseite, Vertrauen/Misstrauen gegenüber Ankara, Handel, eigene Kriegsbelastung, Instabilität. Ab 45 Punkten tritt ein Staat bei, ab 28 zögert er, darunter bleibt er draußen (höchstens 10 Partner je Seite).
5. **Wirkung:** Partner heben die eigene Stärke (bis +40 %) bzw. die des Gegners (bis +16 Punkte), teilen Last (Verlust und Erschöpfung bis −30 %), schmelzen mit der Zeit ab und steigen aus. Partner des Gegners blockieren harte Friedenspakete (bis −24 Punkte Annahme), solange sie Kampfkraft haben. Frieden löst die Koalitionen auf.
6. **Handlung** `koalition_rufen` („Bündnispartner um Beistand bitten“, 6 Kapital, 21 Tage Abkühlung): Zögernde neu bewerten.
7. **Drittkriege** (`weltmodell.kriege`): Paare in `KRIEGSPAARE` (Russland–Ukraine, Iran–Israel mit USA, Armenien–Aserbaidschan, Israel–Syrien, Iran–Saudi-Arabien, Georgien–Russland) zünden über einer Schwelle mit Monatschance, enden bei fallender Spannung, durch Erschöpfung oder (bei Vermittlungskonflikten) durch Einigung. Pakt-Partner des Opfers treten bei. Großmächte untereinander sind keine Kandidaten. Wirkungen auf die Türkei (Terrorgefahr, Tourismus, Ölpreis) zählen nur, was über die Ausgangslage hinausgeht.
8. **Beistandsruf** (Ereignis `krieg_beistandsruf`): Wird ein Pakt-Partner der Türkei (Klausel kollektiv oder Beistand) angegriffen, kommt eine Entscheidung: Truppen (Konfliktvorgang in der Drohkulisse, Rahmung „Beistand“), Material und Diplomatie, oder Ablehnung (Vertrauen, Ansehen, Vertragsverstoß; Schweigen kostet mehr).

## Schnittstellen für die Oberfläche

- `paktSicht(w)` → alle Pakte (Mitglieder, Klausel, Pflichtgewicht, laufende Kriege, `gespalten`).
- `koalitionenIn(w, kriegId)` → `{ aggressor, eigen[], gegner[], spaltung? }` mit Rolle `hauptgegner | partner | zoegert | abseits`; vor dem Krieg eine Vorschau.
- `drittKriege(w, auchBeendete?)` → Kriege zwischen anderen Staaten mit Seiten, Intensität, Beitritten.
- `KriegVorgang.koalition`, `KriegVorgang.beistandFuer`.
- Hinweise: `krieg-koalition-<id>-<tag>` (Kriegsbeginn), `krieg-koalition-beitritt-…` (Beitritt mitten im Krieg), `krieg-beistand-<id>`.

## Offen (Welle 2)

Gebietsübertragung und Regionen: Hebel in `krieg.ts` `friedenSchliessen` (siehe Absatz in `krieg-typen.ts`). Chat-Befehle für Koalition und Beistand (`befehle.ts`). Drittkriege als Karten-Ebene.
