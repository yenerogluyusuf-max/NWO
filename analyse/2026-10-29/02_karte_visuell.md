# 02 — Die Karte und die sichtbare Veränderung der Welt

Stand: 29.10.2026 · **geprüfter Stand: W4** (Commit `09a14ff`, `/home/user/nwo-w4/game`, Dev-Server `localhost:5199/?schnellstart`); zum Vergleich der Altstand `/home/user/nwo-analyse/game`. Dateiangaben ohne Zusatz beziehen sich auf W4 (`game/src/…`).

Auftrag: Warum sieht man auf der großen Karte nicht, dass sich das Land durch die eigenen Entscheidungen verändert („wie bei Civilization“)? Was zeigt die Karte, was reagiert auf den Spielzustand, was müsste sichtbar werden, wie spielen Karte und Akten zusammen? Schwerpunkt laut Projektinhaber: **Funktionen, Spielweise, dass alles sauber funktioniert.**

Methode: (1) Codelesung mit Belegen `Datei:Zeile`. (2) Kopfsonde gegen die Simulation (vitest, temporär in `game/`, danach gelöscht): nach jeder Handlung werden alle 15 Ebenenfarben, Reich-Marken, Neubau-Linien, Ereignismarken, Stadtschilder, Länderfarben und das Kriegsbild verglichen. (3) Browserlauf mit Vorher/Nachher-Bildern (Playwright, Software-WebGL). Keine externe Recherche: Aussagen über Referenzspiele stammen aus Projektdokumenten (mit Fundstelle) oder sind **[ungeprüft]**. Keine erfundenen Zahlen; Sondenwerte sind Ergebnisse von Spielparametern, keine Tatsachen.

Prioritäten: **P0** = Fehler, der die Karte lügen lässt, oder Grundversprechen; **P1** = nächster Ausbau; **P2** = später. Aufwand (grob geschätzt): **S** ≤ 1 Tag, **M** einige Tage, **L** > 1 Woche.

---

## 1. Was nicht sauber funktioniert

Spalte „Stand“: **neu in W4** = Fehler, den es im Altstand nicht gab; **offen** = galt im Altstand und gilt in W4; **teilweise** / **in W4 behoben** = Vergleich mit dem Altstand.

### 1.1 Die Karte zeigt etwas, das im Spiel nicht stimmt (P0/P1)

| # | Befund | Beleg | Stand | P | Aufwand |
|---|---|---|---|---|---|
| F1 | **Kanal Istanbul, Çanakkale-Brücke, Osmangazi-Brücke und Atatürk-Damm werden immer gezeichnet — auch wenn sie nicht gebaut sind.** `drawMegaprojekte` zeichnet die festen Trassen aus `MEGAPROJEKTE_DETAILS` ohne Blick auf den Spielstand. Der Kanal ist zu Spielbeginn nur „verfügbar“ (nicht begonnen), steht aber als blaue Wasserstraße auf der Karte. Die zustandsbewusste Fassung `zeichneMegaprojekte` (prüft `laufend`/`bestand`) existiert, wird aber nirgends aufgerufen. | `ui/atlas/vector.ts:824-825, 1062-1110`; tote Funktion `ui/atlas/karten-features.ts:397-420`; Status des Kanals: Sonde (`status: verfuegbar`) | neu in W4 | **P0** | S |
| F2 | **Feste „taktische Fronten“ im Frieden.** In den Ebenen *Politisch*, *Beziehungen* und *Akute Probleme* zeichnet die Karte vier feste Linien (Syrien-Korridor als „aktiv“ in Rot, Nordirak „befestigt“, Ägäis „Patrouille“, Zypern „Puffer“). Sie hängen an keiner Simulationsgröße und verschwinden nur, wenn ein echter Krieg sein eigenes Bild zeigt. | `ui/atlas/vector.ts:1018-1060`, `ui/atlas/karten-features.ts:117-187`, Abschaltung `ui/atlas/AtlasMap.tsx:617` | neu in W4 | **P1** | S |
| F3 | **Fertige Strecken verschwinden.** Neubau-Linien gibt es nur für `reich.laufend`; ist die Bahn fertig, ist die Linie weg — und weil freie Vorhaben keinen `ort` haben, entsteht auch keine Marke. Eine fertige „Bahn Ankara–Sivas“ hinterlässt **null** Spur. | `ui/atlas/neubau.ts:29` (nur `z.laufend`), `sim/reich.ts:1344` (`!v.ort` → übersprungen); Sonde `n4.json`: vorher Linie, nach Fertigstellung `linien` ohne Bahn, `marken: 0` | neu in W4 (Linien sind neu) | **P0** | S |
| F4 | **Katastrophen verschwinden von der Karte, sobald das Ereignis beantwortet oder abgelaufen ist.** Marken kommen nur aus offenen Ereignissen, nie aus `katastrophen.faelle`. | `ui/Stage.tsx:331-343`; Sonde: Marke `grossbeben@1/65` nach 12 Monaten weg, Fall `bewaeltigt: null`, privat 2.579 von 71.626 Wohnungen ersetzt | offen | **P0** | S |
| F5 | **Stadtschilder zeigen nach der Kommunalwahl die falsche Partei.** W4 führt Rathäuser je Provinz (`sim/kommunen.ts`, erste Wahl 25.03.2029), die Schilder lesen aber weiter `buergermeister2024`. | `ui/atlas/staedte.ts:103`, `sim/kommunen.ts:35-40, 63`; Sonde: nach der Wahl 18 Rathäuser anders als 2024, **0** Schilder geändert | neu sichtbar in W4 (Sim kann es jetzt) | **P0** | S |
| F6 | **Wiederaufbau als Bahnlinie.** Das Programm „Wiederaufbau im Erdbebengebiet“ (10 Provinzen) erscheint als Neubau-Linie, die in Listenreihenfolge durch Hatay → Kahramanmaraş → Gaziantep → Malatya → Adıyaman → Osmaniye → Adana → Diyarbakır → Şanlıurfa → Kilis zickzackt. Ein Wohnungsprogramm ist keine Strecke. | `ui/atlas/neubau.ts:30-33` (jede Provinzliste ≥ 2 wird Linie); Sonde Start: `Wiederaufbau im Erdbebengebiet[31-46-27-44-2-80-1-21-63-79] 50%` | neu in W4 | **P1** | S |
| F7 | **„Krise“ an 62 von 81 Städten, dauerhaft.** Das Statussymbol „Krise“ der Stadtschilder heißt „mindestens ein Problem akut“. In der Sonde 62 Städte am Start und 62 nach 19 Monaten — das Zeichen sagt nichts mehr. Die Kartenmarke `art: "krise"` wird weiterhin nie erzeugt. | `ui/atlas/staedte.ts:106` (`krise: anzahl > 0`); `ui/Stage.tsx:332` (nur ereignis/frist) | teilweise (Altstand: gar nicht) | P1 | S |
| F8 | **Ebene „Wirtschaftskraft“ ist eingefroren** (Startdaten `bipProKopf`). | `ui/ebenen.ts:262-275`; Sonde: 0 Änderungen in 19 Monaten, obwohl `wachstum` sich um +10 bewegt | offen | **P0** | S |
| F9 | **Ebene „Infrastruktur“ ist eingefroren** (OSM-Straßendichte, feste Linien und Punkte). Gebautes kommt nicht hinzu. | `ui/ebenen.ts:310-325`, `ui/atlas/vector.ts` (Laden `/data/osm/*`) | offen | P1 | M |
| F10 | **Freie Einzelort-Projekte bleiben unsichtbar** (z. B. „großer Hafen in Samsun“: eine Provinz, kein `ort`). | `sim/reich.ts:1344`; Sonde: begonnen, `orteNeu: []`, `linienNeu: []` | teilweise (mehrere Provinzen → Linie) | P0 | S |
| F11 | **Nationale Vorhaben als Punkt bei Ankara** (Übertragungsnetz TEİAŞ steht als Wunder-Marke auf der Karte). | Sonde Start: `wunder:v:infra_stromnetz:fertig`; `data/reich/infrastruktur.ts:150` (`ort.name: "Türkei"`) | offen | P2 | S |
| F12 | **Flaggenring und Länderfläche benutzen verschiedene Schwellen** (Ring „mittel“ ab 35, Fläche „nüchtern“ ab 40, „kühl“ ab 25, „gut“ nur bei Konflikt < 55). | `ui/Stage.tsx:362` gegen `ui/ebenen.ts:427-429` | offen | P2 | S |
| F13 | **Restmonate der Baumarke sind eine Faustrechnung** (`monate × (1 − Fortschritt)`), die Reich-Akte rechnet mit der Bauplan-Rate. Beide Zahlen können auseinanderlaufen **[Abweichung nicht gemessen]**. | `ui/atlas/marken.ts:134` gegen `sim/reich.ts` `vorhabenSicht().restMonate` | neu in W4 | P2 | S |
| F14 | **Ortsmaßnahmen sind in keiner Standardebene zu sehen.** Krankenhausbau in Van/Hakkari/Şırnak: Knotenwert +8,75 in den Zielprovinzen, aber keine Ebene, Marke oder Linie ändert sich; nur die über das Netz erreichbare Ebene „Politiknetz“ mit genau diesem Knoten. | Sonde Schritt „6 Monate“; `ui/ebenen.ts:347-` | offen | **P0** | S–M |
| F15 | **Erdbeben trifft Adana und Van als ein Ereignis** (Seed 1234): Zusatzprovinzen werden aus der ganzen Verwerfungszone gezogen, nicht aus der Nachbarschaft. Auf einer Karte, die Betroffene zeigt, unglaubwürdig. | `sim/katastrophe.ts` (`loeseAus`, Zone `daf`); Sonde alt und W4 identisch | offen | P1 | S |
| F16 | **Jedes fertige Bauwerk heißt auf der Karte „Wunder“** — Marmaray, Istanbuler Flughafen, das Übertragungsnetz. Die Marke kennt nur die Arten bau/wunder/erbe. | `ui/atlas/marken.ts:12, 57` (`marken.art.wunder`); `sim/reich.ts:1350` (`art: "wunder"` für jeden Bestand) | neu sichtbar in W4 (Tafeltext) | P2 | S |
| F17 | **Das gefeierte Bauwerk ist nach „Auf der Karte zeigen“ nicht zu sehen.** Marken im Stadtbereich werden unter der Stadtfigur zu „+1“ zusammengefasst; die Kamerafahrt endet auf der Figur. | Bild `bilder_w4/c1-wunder-kamerafahrt.png`, `c2-…`; Fahrziel `ui/Stage.tsx` (`onKarte`, Abstand 4,6) | neu sichtbar in W4 | P1 | S |

### 1.2 Leistung und Technik

| # | Befund | Beleg | Stand | P | Aufwand |
|---|---|---|---|---|---|
| T1 | Dauer-Rendern jedes Bildes, auch hinter Akten | Altstand `ui/atlas/AtlasMap.tsx:184-209` → W4 drosselt: aktiv jedes Bild, Ruhe ~15/s, hinter einer Akte ~3/s, Relief nur bei Blickwechsel oder Wasser-Takt (80 ms bzw. 320 ms), Beschriftung nur bei Änderung (`AtlasMap.tsx:356-452`, `Stage.tsx:751` `sparsam={!!dossier}`) | **in W4 weitgehend behoben**; das Wasser hält das Relief im Leerlauf weiter bei rund 12 Bildern/s | P2 | S |
| T2 | Zweite WebGL-Karte im Wahlkampf-Fenster (lädt Relief und Geodaten erneut) | `ui/Wahlkampf.tsx:134` | offen | P2 | S |
| T3 | `kriegsKarte(...)` wird bei jedem Render zweimal ungemerkt neu berechnet | `ui/Stage.tsx:792, 1094` | neu in W4 | P2 | S |
| T4 | Leistung im Testlauf: Software-WebGL (SwiftShader) auf ausgelastetem Rechner (Last 18–28 auf 4 Kernen, andere Analysen liefen parallel): rund 0,7 Bilder/s, 30–35 s je Bildschirmfoto. **Nicht repräsentativ für echte Grafikkarten [ungeprüft auf GPU].** | Lauf-Logs | — | — | — |
| T5 | Konsolenfehler im Browserlauf: siehe 3.2 | `bilder_w4/lauf.log` | — | — | — |

### 1.3 In W4 behoben (gegenüber dem Altstand)

| Altbefund | Was W4 tut | Beleg |
|---|---|---|
| Am Spielbeginn keine einzige Bau-/Wundermarke (Reich wurde erst im ersten Monatsschritt angelegt) | `reichMarken` legt das Reich beim ersten Zugriff an; Sonde: 8 fertige Bauwerke und 2 Baustellen am 5. Juni 2028 | `ui/atlas/marken.ts:97-101` |
| Baumarken ohne Fortschritt, Verzug, Pause, Zustand | Tafel mit Fortschritt in %, Restmonaten, Vergabephase, Pause; fertige Stücke mit Zustand und Lagen „verfällt“/„in Gefahr“ | `ui/atlas/marken.ts:13-90` |
| Freie Großprojekte gar nicht auf der Karte | Mehrprovinz-Vorhaben als gestrichelte Neubau-Linie, die mit dem Fortschritt vergoldet | `ui/atlas/neubau.ts` (aber F3, F6, F10) |
| Ausbauten ohne Marke | Klasse `ausbau` und Werke mit gewähltem Standort (Wissensbaum) werden gezeigt | `sim/reich.ts:1338-1354` |
| Kriege unsichtbar | Kriegsschauplatz mit Regionen (eigen/umkämpft/Gegner/besetzt), Frontabschnitt, Vorstoßpfeilen; Sonde: 9 Regionen nach Kriegsbeginn gegen Syrien | `ui/atlas/kriegsfx.ts`, `sim/kriegsschauplatz.ts:568` |
| Städte nur Punkte | Gezeichnete Stadtfiguren (Hauptstadt, Großstadt, Provinzstadt), alle 81 Provinzen mit Banner, Tafel (Einwohner, Rathaus, akute Lage, Zustimmung vor Ort, offene Vorhaben) | `ui/atlas/StadtFigur.tsx`, `ui/atlas/staedte.ts` |
| Kommunalwahl ohne Ergebnis je Provinz | Sim führt Rathäuser, Wahl, Zwangsverwalter je Provinz (Anzeige fehlt noch → F5) | `sim/kommunen.ts` |
| Dauer-Rendern | siehe T1 | |
| Jahreszeiten | Schnee, Frühlingsgrün, Lichtwärme aus dem Spieldatum | `ui/atlas/jahreszeit.ts`, `scene.ts:310, 373, 485` |

---

## 2. Bestandsaufnahme W4: Was die Karte zeigt und was davon lebt

### 2.1 Schichten

1. **Gelände (WebGL)** `ui/atlas/scene.ts` (1.036 Zeilen): Relief, Küste, Wasser, gemalte Palette, prozedurale Wälder. **Neu:** Jahreszeit aus dem Spieldatum (Schnee, Grün, Licht). Darüber hinaus hängt kein Uniform am Spielzustand — Dürre, Ernte, Verschmutzung, Zerstörung verändern das Gelände nicht.
2. **Vektorebene** `ui/atlas/vector.ts`: Länder, Provinzen, Bezirke, Flüsse, OSM-Straßen/Bahn/Punkte (statisch), dazu neu Bruchlinien (nur Ebenen Risiko/Probleme, statisch, sachlich passend), feste Fronten (F2) und feste Megaprojekte (F1).
3. **Effektschicht** `ui/atlas/fx.ts`, `kriegsfx.ts`: Hover-/Auswahllicht, Ereignisringe, Funken bei Fertigstellung, Tinte beim Besitzerwechsel, Kriegsschauplatz.
4. **HTML/SVG-Schicht** `ui/atlas/AtlasMap.tsx`: 81 Stadtbanner mit Figuren, Reich-Marken, Ereignismarken, Flaggen, Fundorte (Ressourcen/Strategie), Neubau-Linien (SVG).

### 2.2 Reagiert die Karte? (W4)

| Element | Quelle | Reagiert? | Beleg |
|---|---|---|---|
| Relief, Wasser, Wälder | Höhenmodell, Shader | nein; nur Jahreszeit | `scene.ts` |
| Straßen, Bahn, Häfen, Flughäfen, Kraftwerke | OSM | nein | `vector.ts` |
| Megaprojekt-Trassen (Kanal, Brücken, Damm) | feste Liste | **nein, immer an (F1)** | `vector.ts:1062` |
| Fronten im Frieden | feste Liste | **nein (F2)** | `vector.ts:1026` |
| Bruchlinien | feste Liste | nein (gewollt) | `vector.ts:985` |
| Stadtfigur und -größe | `PROVINZEN.bevoelkerung` | nein (Bevölkerung ist Startwert) | `staedte.ts`, `StadtFigur.tsx` |
| Stadtbanner: Parteistreifen | `buergermeister2024` | **nein (F5)** | `staedte.ts:103` |
| Stadtbanner: Status Ereignis/Frist/Bau | offene Ereignisse, laufende Vorhaben | ja | `staedte.ts:71-106` |
| Stadtbanner: Status Krise, Tafel „Zustimmung vor Ort“, „akute Lage“ | Netz | ja (Krise gesättigt, F7) | `staedte.ts:79-106` |
| Reich-Marken | `reich.laufend/bestand`, Zustand | ja, mit Fortschritt | `marken.ts` |
| Neubau-Linien | `reich.laufend` mit ≥ 2 Provinzen | ja, solange im Bau (F3) | `neubau.ts` |
| Ereignismarken | offene Ereignisse | ja, flüchtig (F4) | `Stage.tsx:331` |
| Kriegsschauplatz | `spiel.kriege` | ja | `kriegsfx.ts` |
| Ebenen Rückhalt, Arbeitslosigkeit, Akute Probleme, Belastung, Kulturerbe, Beziehungen, Politiknetz | Netz/Reich/Welt | ja | `ebenen.ts` |
| Ebenen Wahlausgang | Prolog | nein — **ehrlich beschriftet** („Stand zum Amtsantritt“, nennt die Monate bis zur Wahl) | `ebenen.ts:68-90, 247-260` |
| Ebenen Wirtschaftskraft, Infrastruktur, Katastrophenrisiko, Regionen, Ressourcen, Strategie | Startdaten | nein (bei Wirtschaftskraft und Infrastruktur ein Fehler, F8/F9; Risiko sollte Vorsorge spiegeln, K22) | `ebenen.ts` |

**Bilanz:** W4 hat die Karte deutlich lebendiger gemacht (Marken mit Fortschritt, Bau-Linien, Krieg, Stadttafeln, Jahreszeiten). In der Grundansicht *Politisch* bewegen sich aber weiterhin nur Symbole; das Land selbst (Flächen, Gelände, Städte, Netze) bleibt das Atlasbild vom Spielbeginn — und an zwei Stellen (F1, F2) zeigt es Dinge, die es im Spiel nicht gibt.

---

## 3. Experiment

### 3.1 Kopfsonde W4 (Seed 11, Schnellprofil, Kapital für die Analyse auf 400)

Rohdaten: `analyse/karte/probe_w4.json` (W4), `analyse/karte/probe2.json` (Altstand), `analyse/karte/n4.json` (Fertigstellung einer freien Bahn).

| Schritt | Simulation | Karte (W4) |
|---|---|---|
| Start 5. Juni 2028 | 8 fertige Katalog-Bauwerke, Akkuyu (75 %) und Wiederaufbau (50 %) im Bau | 10 Reich-Marken; 1 Neubau-Linie „Wiederaufbau“ (F6); Kanal Istanbul bereits als Trasse (F1); 62 Städte mit „Krise“ (F7) |
| Kanal Istanbul beginnen | angenommen, 62 Monate; Märkte +1, Legitimität +0,5 | neue Baumarke 0 %, sonst nichts |
| Freie Bahn Ankara–Sivas | begonnen, Provinzen 6 und 58, Vergabephase | neue gestrichelte Linie „ruht“ |
| Freier Hafen Samsun | begonnen, eine Provinz, kein `ort` | **nichts** (F10) |
| Krankenhausbau Van/Hakkari/Şırnak (Gesetz) | eingebracht, 382 Ja erwartet | nichts |
| 6 Monate | Kanal 7 %, Bahn 12 %, Krankenhaus-Knoten +8,75 in den Zielprovinzen; Inflation −3,5 | Marken und Linien rücken vor; Rückhalt 80 Prov. (Mittel ΔRGB 2), Arbeitslosigkeit 81 Prov. (Mittel 14); **Ortsmaßnahme unsichtbar** (F14) |
| Kanal fertig (Sonden-Abkürzung) + 1 Monat | Bestand; Vertrauen in Istanbul −5,4, Wasserversorgung −3,1, Russland −2,4 | Marke wird Wunder; Rückhalt färbt einzelne Provinz stark um (max ΔRGB 75) — **das ist die einzige deutlich sichtbare Folge**; die Trasse sah vorher schon gleich aus (F1) |
| Erdbeben | Adana + Van, 15.280 Tote, 71.626 Wohnungen | rote Ereignismarke; Probleme-Ebene 1 Provinz |
| 12 Monate | Kommunalwahl durchgeführt, 18 Rathäuser gewechselt; Fall unbewältigt; Wachstum +10, Vertrauen −9 | Bebenmarke **weg** (F4); **0** Stadtschilder umgefärbt (F5); Wirtschaftskraft **0** Änderungen (F8) |
| Krieg gegen Syrien | Phase „krieg“, Front 47 | Kriegsschauplatz mit 9 Regionen erscheint; feste Fronten treten zurück |
| Freie Bahn fertig (n4) | im Bestand | Linie **verschwindet**, keine Marke (F3) |

### 3.2 Browserlauf W4 (Vorher/Nachher-Bilder)

Skript `analyse/karte/k4w4.mjs` (lief kurz als `game/_k4w4.mjs`, danach gelöscht), 1100×660, Browser-Sprache Deutsch, Software-WebGL. Die Simulation wurde über dieselben Module bedient, die die Seite lädt (`/src/sim/*.ts` über den Dev-Server); offene Ereignisse wurden für freie Sicht beiseitegelegt. Bilder: `analyse/karte/bilder_w4/`. Abweichung je Bildpaar = Anteil der Pixel im Kartenausschnitt (ohne Kopfleiste) mit Farbsprung > 24; Kontrollpaar ohne Spieländerung: 0,03 %.

| Bildpaar | Pixel geändert | Was man sieht |
|---|---|---|
| `a0` → `a1` Kontrolle (nichts getan) | 0,03 % | Rauschen (Wasser) |
| `a2` → `b2` Istanbul, Kanal begonnen | 4,3 % | ein **Kransymbol** im Istanbul-Banner; sonst gleich |
| `b2` → `c2` Istanbul, Kanal fertig (7 Monate später) | 4,7 % | Kran weg, dafür „+1“ an der Stadtfigur; Jahreszeit (Januar) |
| `a2` → `c2` Istanbul, Spielbeginn → Kanal fertig | 1,3 % | praktisch **kein sichtbarer Unterschied**: Die Trasse war schon vor dem Beschluss da (F1), die Wundermarke steckt unter der Stadtfigur |
| `c1` Kamerafahrt „Auf der Karte zeigen“ nach der Feier | — | Kamera landet auf Istanbul; zu sehen sind Osmangazi- und Çanakkale-Marke, **das gefeierte Bauwerk selbst nicht** (verdeckt, „+1“) |
| `d2` → `e1` Bebengebiet Adana, Beben → ein Jahr später | 6,3 % | nur die rote Ereignismarke an Adana fehlt; **keine Spur von 71.626 zerstörten Wohnungen** (F4); die Wiederaufbau-Linie zickzackt unverändert (F6); rote gestrichelte „Front“ an der Grenze bei Hatay im Frieden (F2) |
| `a4` → `e2` Ankara, Spielbeginn → 19 Monate | 22,1 % | Jahreszeit (Licht, Farbe) macht den Großteil; neu: **goldene Neubau-Linie Ankara → Sivas** (wirkt), Kran im Ankara-Banner |
| `a1` → `e4` ganze Türkei, Spielbeginn → 19 Monate | 18,0 % | Jahreszeit; Akkuyu Kran → goldene Raute; Krane in Ankara/Sivas; Parteistreifen der Städte unverändert (F5); Ortsmaßnahme Van/Hakkari/Şırnak unsichtbar (F14) |
| `f1` Krieg gegen Syrien | — | der Südosten getönt („unter türkischer Kontrolle“), Zielregionen gestrichelt, Legende erklärt Front und Vorstöße; das Bild ist zurückhaltend, die Front selbst schwer zu finden **[Zoom 6, Software-Rendering]** |

**Konsolen- und Seitenfehler:** keine im W4-Lauf (`bilder_w4/lauf.log`, Filter auf `pageerror` und `console.error`). Im Altstand-Lauf ebenfalls keine; nur Treiberhinweise von SwiftShader („GPU stall due to ReadPixels“).

**Weitere Beobachtungen im Lauf (nicht Karte, aber „Anzeige passt nicht“):**
- Ereignisfenster Erdbeben (`d0`): „Zustimmung (Umfragen) 38 %“, gleichzeitig Kopfleiste „50 %“. Die Kopfleiste liest `spiel.umfrage.zustimmung` (`ui/Stage.tsx:419`), das Ereignis `angezeigteZustimmung(w)` (`ui/ereignis/kontext.ts:113-116`). Welche Zahl gemeint ist, wurde nicht geprüft — für den Spieler sind es zwei Zustimmungen. P1, S.
- Ereignisantwort „bescheidenes Versprechen (43.000,0 Wohnungen)“: Wohnungen mit Nachkommastelle. P2, S. **[Fundstelle der Formatierung nicht gesucht]**
- Die Legende „Marken auf der Karte“ ist in jedem Bild aufgeklappt und deckt rechts rund ein Viertel der Karte ab (lässt sich mit „–“ einklappen). P2, S.
- Ohne deutsche Browsersprache startet das Spiel auf Englisch (erster Lauf, `lauf_en_abgebrochen.log`) — gewollte Mehrsprachigkeit, aber für deutsche Tester mit englischem Browser überraschend. **[Absicht nicht geprüft]**

---

## 4. Vergleich: Wie andere Spiele Veränderung zeigen

Im Projekt belegt: REFERENZANALYSE.md §1 (Civ VI: Bezirke machen Geografie für die Stadtentwicklung relevant; Gathering Storm: Umweltwirkungen), RECHERCHE_KONKURRENZ_FACHBEREICHE.md Z. 93, 118, 125 (Wunder mit Standortregeln, Zeitraffer, „Eröffnungsfeier mit Kartenfahrt“), Z. 151 (Kartenmodi Haltung, Verträge, Konflikt), VERBESSERUNGSPLAN Z. 75 (keine Einheitenbewegung, kein Schlachten-Interface). Alles Übrige ist allgemeines Spielwissen **[ungeprüft]**.

| Spiel | Wie Veränderung sichtbar wird | Für Staatsräson |
|---|---|---|
| Civilization VI | Bauwerke stehen als Modell auf ihrem Feld, Wunder erst als Baustelle, dann fertig; Grenzen und Städte wachsen sichtbar; Linsen [teils ungeprüft] | **Übernehmen:** Bauwerk bleibt nach Fertigstellung am Ort (fehlt bei F3/F10); Linsen = unsere Ebenen. **Nicht:** Feldraster |
| Hearts of Iron IV | Gebäude je Staat, Fronten als Linien, Besatzung schraffiert [ungeprüft] | **Teilweise:** W4 hat das Kriegsbild bereits ohne Divisionen; Fronten nur, wenn es Krieg gibt (F2) |
| Victoria 3 | Gebäude und Städte wachsen mit dem Staat, Kartenmodi für fast alles, Unruhen als Marken, Handelsrouten [ungeprüft] | **Am nächsten am Präsidentenspiel:** Der Staat verändert sich, ohne dass man Einheiten führt |
| Cities: Skylines | Heatmaps (Verschmutzung, Kriminalität, Landwert), Gebäude steigen auf, Trümmer nach Katastrophen [ungeprüft] | **Übernehmen:** Trümmer → Wiederaufbau als Zustandsbild (F4) |
| Anno | Häuser zeigen den Wohlstand ihrer Bewohner [ungeprüft] | Idee „Wohlstand sieht man an der Stadtfigur“ |
| Frostpunk | Ein Zustand färbt die ganze Szene (Kälte) [ungeprüft] | Dürre, Stromausfall, Krieg als Stimmung der Szene |
| Democracy 4, Suzerain | (Projektwissen) kein Kartenbild; Netz bzw. Text und Zeitung | **Warnung:** Das Genre braucht keine Karte — eine große muss etwas tun |

---

## 5. Katalog: Was sichtbar werden soll

| # | Sichtbare Veränderung | Darstellung | Sim-Daten (vorhanden, Feldnamen) | P | Aufwand |
|---|---|---|---|---|---|
| K1 | **Bestand bleibt sichtbar** (behebt F3, F10) | Fertige Strecken als durchgezogene Linie im Kartenstil; Einzelort-Projekte als Marke im Schwerpunkt der Provinz | `reich.bestand`, `reich.frei[id].def.provinzen, schaetzung.typ`; Provinzmitten `ui/atlas/overlay.ts` | P0 | S |
| K2 | **Megaprojekte nach Spielstand** (behebt F1) | geplant: nichts; im Bau: gestrichelt mit Fortschritt; fertig: wie heute | `reich.laufend`, `reich.bestand`; fertige Funktion `zeichneMegaprojekte` | P0 | S |
| K3 | **Katastrophenspur mit Wiederaufbau** (behebt F4) | Schraffur der betroffenen Provinzen, solange `!bewaeltigt`; Zelt bei Übergangsversorgung; Balken geliefert/zerstört; Versprechen als Banner; danach blasse Narbe | `katastrophen.faelle[].provinzen, art, staerke, wohnungen, privatGeliefert, zusage.{wohnungen,geliefert}, hilfe.uebergangBis, bewaeltigt, wohnbau` | P0 | S |
| K4 | **Rathäuser nach Spielstand** (behebt F5) | Parteistreifen aus `kommunen.rathaus`; Zwangsverwalter als Siegel; Wahlabend Provinz für Provinz | `gesellschaft.kommunen.rathaus[plaka].partei`, `wahlen`, Zwangsverwalter (`sim/kommunen.ts:102-160`) | P0 | S |
| K5 | **Ebene „Veränderung“** (behebt F14 teilweise) | Je Provinz Veränderung seit Amtsantritt oder Vormonat, grün/rot, Pfeile im Banner; Vorwahl „Lebenslage“ | `net.values`, `net.start`, `net.history` (13 Monate), `net.acute` | P0 | S |
| K6 | **Ortsmaßnahmen als Symbole** | Kreuz (Krankenhaus), Tropfen (Wasser), Schule … in den Zielprovinzen mit Umsetzungsring | `net.ziele[m][p]`, `net.schritte`, `net.umsetzung` | P0 | S–M |
| K7 | **Folgenstempel nach jedem Beschluss** | Kameraschwenk (gibt es für Wunder und Beben schon, `Stage.tsx:594-595`) auf die betroffenen Provinzen, die kurz aufleuchten (Ringe in `fx.ts` vorhanden) | Ergebnis von `bringeEin`/`beginne`, Provinzliste | P0 | S |
| K8 | **Wirtschaftskraft lebt** (behebt F8) | Startwert × Index aus `wachstum_regional` | `wachstum_regional`, `investitionen`, `industrie` je Provinz | P0 | S |
| K9 | **Krise als Zeichen mit Bedeutung** (behebt F7) | Nur neu akute oder schwere Lagen (Schwelle über Hysterese, `net.acute`), höchstens 5–8 gleichzeitig | Problemknoten `p_*`, `net.acute` | P1 | S |
| K10 | **Proteste, Streiks** | Mengen-Symbol nach `streikneigung`, `polarisierung`, Protestdruck (W4 Stufe 6 „Protestdruck mit Gewöhnung“) | Netzknoten; Gesellschaftszustand **[Feldnamen in W4 nicht geprüft]** | P1 | S–M |
| K11 | **Nachtlichter: Wohlstand und Strom** | Nachtansicht, Lichtpunkte nach Einwohnern aus `orte.json`, Helligkeit nach `stromversorgung`, `wachstum_regional`, `armut`; Stromausfall dunkel | Netzknoten; `karte/orte.json` (`pop`) | P1 | M |
| K12 | **Dürre, Wasser, Ernte im Gelände** | Provinz-Wertetextur in den Shader: Böden bräunen, Stauseen sinken | `duerre`, `wasserversorgung`, `ernte`, `p_wassermangel`; Katastrophe `duerre` | P1 | M |
| K13 | **Luftverschmutzung** | Dunst über Provinzen | `luftqualitaet`, `p_luftverschmutzung` | P1 | S |
| K14 | **Städte wachsen/schrumpfen** | Figurgröße, Trendpfeil | **fehlt:** `bevoelkerung` fest; Ersatz: Pfeil aus `landflucht`, `gefluechtete`, Katastrophen-Migration | P1 (Pfeil) / P2 (Modell) | S / L |
| K15 | **Infrastruktur-Ebene wächst mit** (behebt F9) | gebaute Strecken/Häfen/Kraftwerke in die OSM-Darstellung einreihen; Provinzfarbe aus `belastung` | Reich-Bestand, Belastungsebene (vorhanden) | P1 | M |
| K16 | **Handel und Verträge** | Linien zu Partnerhauptstädten, Stärke nach `handel`, Symbol je Vertrag | `welt[land].handel, vertraege, abkommen` | P1 | M |
| K17 | **Verfall sichtbar** | Figur/Marke verblasst bei `zustand` < 60, Risse < 40 (Lagen gibt es schon in der Tafel) | `reich.bestand[].zustand`, `staetten[].zustand` | P1 | S |
| K18 | **Risiko-Ebene spiegelt Vorsorge** | Gewichtung mit `erdbebenvorsorge`, `bauqualitaet` (wie `schadenBerechnen`) | Netzknoten | P1 | S |
| K19 | **Wunder als Bildmarken** | vorhandene Silhouetten `Vorhaben.bild` als Billboard über dem Ort | `sim/reich-typen.ts` (`bild`) | P2 | M |
| K20 | **Zeitvergleich Amtsantritt–heute** | Klappbild in der Chronik | `net.start`; für Jahre fehlt ein längeres Provinzgedächtnis | P2 | M |

---

## 6. Ist die Karte zu dominant? Wie sollten Karte und Akten zusammenspielen?

**Befund.** Die Karte füllt den Hintergrund (`ui/Stage.tsx:749`), wird aber von fast jeder Akte breit überdeckt (`Stage.tsx:847`, rund zwei Dutzend Akten öffnen „wide“ oder vollflächig). Entscheidungen fallen in Akten, Ereignisfenstern und im Netz. W4 hat das teure Dauer-Rendern hinter Akten gedrosselt (T1) — die Karte ist also billiger geworden, aber nicht wichtiger. SPIELDESIGN.md:179 gibt ihr die Rolle „Werkzeug, wenn die Frage räumlich ist: Wo wirkt sich etwas aus, und wie weit ist der Bau?“ — den zweiten Teil löst W4 jetzt ein (Fortschritt, Linien), den ersten nicht (F4, F14, F8).

**Gefährlicher als Dominanz ist Unwahrheit.** Ein Akten-/Entscheidungsspiel lebt davon, dass Anzeigen stimmen. Ein Kanal, der gebaut aussieht, bevor er beschlossen ist (F1), eine rote „aktive Front“ im Frieden (F2), ein Rathaus in der falschen Farbe (F5) und eine Bahn, die nach der Eröffnung verschwindet (F3), beschädigen das Vertrauen in alle anderen Anzeigen. Diese vier sind deshalb P0/P1, noch vor jedem Ausbau.

**Empfehlung: drei Aufgaben, sonst nichts.**

1. **Lagebild zwischen den Entscheidungen.** Wenn die Zeit anhält (Auto-Stopp), zeigt die Karte zuerst, *was sich seit dem letzten Blick verändert hat* (K5, neue Marken K3/K6/K9), nicht das unveränderte Atlasbild.
2. **Rückmeldung jeder Entscheidung.** Jeder Beschluss mit Ort endet mit Folgenstempel und Kameraschwenk (K7); jede räumliche Akte hat „Auf der Karte zeigen“ (gibt es bei Wundern). Die Wirkungsberichte nach 6/12 Monaten öffnen dieselbe Ansicht.
3. **Ortswahl als Eingabe.** Provinzen auf der Karte wählen, um Ziele einer Maßnahme oder eines Projekts zu setzen; die Vorschau färbt die erwartete Wirkung vor.

**Was zurücktreten darf:** feste Zierlinien ohne Spielbezug (F1, F2), die zweite Karte im Wahlkampf (T2), Wasseranimation hinter Akten. Für Akten genügt eine kleine Provinzskizze statt der vollen Szene.

**Abgrenzung zu Einheiten.** Alles im Katalog zeigt Zustände und Bauwerke. Das Kriegsbild von W4 (Regionen, Front, Pfeile) bleibt abstrakt und ohne Divisionen; das entspricht ENTSCHEIDUNGEN Tabelle C („Verlauf abstrakt, Folgen voll“) und der Negativliste (VERBESSERUNGSPLAN Z. 75).

---

## 7. Reihenfolge (Vorschlag)

1. **Fehler, die die Karte lügen lassen (P0, je S):** F1/K2 Megaprojekte nach Spielstand, F3+F10/K1 Bestand bleibt sichtbar, F5/K4 Rathäuser, F4/K3 Katastrophenspur, F8/K8 Wirtschaftskraft.
2. **Rückmeldeschleife (P0):** K5 Veränderungs-Ebene, K6 Ortsmaßnahmen, K7 Folgenstempel.
3. **Aufräumen (P1/P2, S):** F2 feste Fronten nur bei Spannung/Krise, F6 Programme ohne Strecke nicht als Linie, F7/K9 Krise mit Bedeutung, F11–F13, T2, T3.
4. **Lebende Provinzen (P1):** K10, K13, K17, K18 (S), dann K11, K12, K15, K16 (M).
5. **Simulationslücken (P1/P2):** Bevölkerung je Provinz dynamisch (K14), längeres Provinzgedächtnis (K20).

Neu zu entscheiden (für ENTSCHEIDUNGEN): ob Bevölkerung je Provinz dynamisch wird; ob feste Sicherheitslinien (F2) überhaupt ins Spiel gehören oder an Konfliktwerte gebunden werden.

---

## 8. Lücken und Ungeprüftes

- Leistung nur mit Software-WebGL auf ausgelastetem Rechner gemessen; GPU-Verhalten **[ungeprüft]**.
- Referenzspiele außerhalb der genannten Projektquellen **[ungeprüft]** (Auftrag: keine externe Recherche).
- Kanal Istanbul und die freie Bahn wurden in der Sonde per Fortschrittsabkürzung fertiggestellt; der Code-Pfad der Fertigstellung ist derselbe.
- F13 (Restmonate) nur aus dem Code abgeleitet, Abweichung nicht gemessen.
- Feldnamen des W4-Gesellschaftszustands für Protestdruck (K10) nicht nachgelesen.

---

## Anhang: Dateien

- Sonden: `analyse/karte/_karte_probe.test.ts` (Altstand), `analyse/karte/_karte_probe_w4.test.ts` (W4); Rohdaten `probe2.json`, `probe_w4.json`, `n4.json`, Zählung `zaehl.json`
- Browserskripte: `analyse/karte/k4.mjs` (Altstand, abgebrochen nach Standwechsel), `analyse/karte/k4w4.mjs` (W4); Bilder `analyse/karte/bilder_w4/*.png`, Protokoll `bilder_w4/protokoll.json`, Log `bilder_w4/lauf.log`
