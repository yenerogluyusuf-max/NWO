# Gemalte Porträts für Staatsräson: Vorgaben für das Bildmodell

Ziel: Ein einheitlicher Satz gemalter Brustbilder, den das Spiel anstelle der gezeichneten Gesichter nutzt (Ministerrat, Umbildung, Wahlabend, Prolog, Zeitung, Verhandlungstisch). Das Spiel wählt aus den Bildern nach Geschlecht, Altersgruppe, Hautton und Merkmalen und fällt auf die gezeichneten Gesichter zurück, wo ein Bild fehlt. Es braucht also nicht alles auf einmal: Stufe 1 genügt zum Start.

## 1. Stil (für jede Anfrage gleich mitgeben)

> Painterly editorial portrait illustration of a fictional person, head and shoulders, front-facing or slightly turned three-quarter view, calm and dignified expression, soft warm studio lighting with a gentle rim light, natural skin texture, detailed realistic eyes with catchlights, plain warm parchment-beige background with a very subtle vignette, muted historic palette (ochre, sepia, deep teal, oxblood, olive), gouache and oil-paint feel with visible soft brush texture, realistic proportions, no text, no frame, no watermark, no logo, no hands, same illustrator style across the whole set.

Hinweise:
- Immer **fiktive** Personen, nie ähnlich zu einer bestimmten lebenden Person, kein Politiker und kein Promi (keine Namen im Prompt).
- Ein Gespräch pro Charge; ab dem zweiten Bild das erste als Stilvorlage mitgeben („same style as the reference image“).
- Format 4:5 hochkant, später auf 768 × 960 zuschneiden.
- Respektvolle, nicht klischeehafte Darstellung; Vielfalt, wie sie in der Türkei plausibel ist (Haut, Haar, Brauen, Nasenformen).

## 2. Prompt-Vorlage

> [STIL-ABSATZ von oben]. A {GESCHLECHT} aged around {ALTER}, {HAUTTON}, {HAARE}, {MERKMALE}, wearing {KLEIDUNG}.

Platzhalter:
- **GESCHLECHT:** woman / man
- **ALTER:** 30, 40, 50, 60, 70 (dazu passende Falten und graues Haar)
- **HAUTTON** (Nummer im Dateinamen): 1 = fair, 2 = light olive, 3 = olive, 4 = tan brown, 5 = deep brown
- **HAARE:** short dark hair / wavy brown hair / grey hair / shoulder-length hair / bald with grey sides / bun / curly hair und so weiter, wechsle je Bild
- **MERKMALE** (kommagetrennt, optional): wearing rimless glasses · short beard · full grey beard · moustache · headscarf (nur Frauen, für etwa jedes achte Bild) · a faint smile · a serious look
- **KLEIDUNG:** dark business suit with tie / blazer and white blouse / dark suit with open collar / military dress uniform with insignia (Stufe 2) / black judge's robe with white collar (Stufe 2)

Beispiel: „…A woman aged around 50, light olive skin, shoulder-length dark hair with grey streaks, wearing rimless glasses, wearing a dark blazer and white blouse.“

## 3. Umfang

**Stufe 1 (Start, rund 60 Bilder):**
- je Geschlecht (f, m) und Altersgruppe (30, 40, 50, 60, 70) und Hautton 1 bis 3: ein Bild = 30
- dazu je Geschlecht und Altersgruppe ein zweites Bild mit Brille oder Bart (Männer) bzw. Kopftuch (Frauen, 30 bis 60) = 20
- dazu Hautton 4 und 5, je Geschlecht zwei Bilder = 8
- Ergänzung bis 60 mit freien Varianten

**Stufe 2 (Rollen, rund 40 Bilder):**
- Uniform (Generalstab, Streitkräfte): 10 Männer, 6 Frauen
- Robe (Justiz): 6 Frauen, 6 Männer
- Journalistinnen und Journalisten, Diplomatinnen und Diplomaten, ältere Staatsfrauen und Staatsmänner: der Rest

**Stufe 3 (Ausdruck, optional):** zehn Schlüsselfiguren je in drei Mienen (lächelnd, ernst, besorgt) mit derselben Person: dafür das Referenzbild der Person im selben Gespräch mitgeben.

## 4. Dateien

Ablage: `game/public/ui/portraits/`. Format WebP, 768 × 960, Qualität etwa 80, jede Datei höchstens 80 KB (Gesamtbudget unter 12 MB).

Dateiname: `p-<f|m>-<alter>-<ton>-<nn>[-<merkmale>].webp`
- `f` oder `m`, `alter` ∈ 30, 40, 50, 60, 70, `ton` ∈ 1 bis 5, `nn` zweistellige Laufnummer
- Merkmale mit `+` verbunden: `kopftuch`, `brille`, `bart`, `uniform`, `robe`

Beispiele: `p-f-50-2-03-brille.webp`, `p-m-60-3-01-bart+brille.webp`, `p-f-40-2-05-kopftuch.webp`, `p-m-50-3-02-uniform.webp`.

Danach das Manifest erzeugen (liest nur die Dateinamen):

```
node game/tools/portraits/baue_manifest.mjs
```

Das schreibt `game/public/ui/portraits/portraits.json`. Danach den Bau der App wie gewohnt starten; das Spiel nutzt die Bilder automatisch, sobald das Manifest Einträge enthält.

## 5. Urheberrecht und Konsistenz

- Die Bilder erzeugst du selbst mit einem Bildmodell; prüfe dessen Nutzungsbedingungen für die kommerzielle Verwendung, bevor das Spiel veröffentlicht wird.
- Keine echten Personen nachbilden; keine Prompts mit Namen, Parteien oder Amtsbezeichnungen realer Politiker.
- Bei Stilabweichungen einzelne Bilder neu erzeugen, nicht den Stil im Spiel nachbessern.
