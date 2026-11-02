# S0 — Papiertest „Die Klinikum-Affäre“

Stufe S0 aus dem [Entwicklungsplan](../ENTWICKLUNGSPLAN.md), Abschnitt 0. **Seit Version 0.4 optional:** Das Spiel selbst hat kein vorgegebenes Szenario. Dieser Test nutzt eine feste Ereignisvorlage nur als günstiges Werkzeug, um Figuren und Dilemmas zu prüfen. Ziel ist eine einzige Frage: **Will man weiterspielen?**

Es wird kein Code gebraucht. Ein Mensch führt die Simulation von Hand, ein Sprachmodell spricht die Figuren, eine Testperson regiert.

## Rollen

| Rolle | Wer | Aufgabe |
|---|---|---|
| **Spieler** | Testperson | Regiert als Ministerpräsident(in). Schreibt frei, was sie will. Kennt nur das Spielerbriefing. |
| **Spielleitung (SL)** | Du oder eine vertraute Person | Führt den Weltzustand, entscheidet Folgen nach den Regeln, spielt die Ereignisse ein. Kennt die verborgene Wahrheit. |
| **Figuren** | Claude (ein Chat) | Spricht die sechs Figuren. Entscheidet keine Folgen, sondern schlägt nur vor. |

Wenn niemand Zweites da ist: Du bist Spielleitung, ein Freund spielt. Selbst spielen ist wertlos, weil du die Wahrheit kennst.

## Material

| Datei | Wer liest sie? |
|---|---|
| [01_SPIELERBRIEFING.md](01_SPIELERBRIEFING.md) | Spieler (zu Beginn ausgehändigt) |
| [02_FIGUREN.md](02_FIGUREN.md) | SL und Claude; der Spieler sieht nur die öffentlichen Teile im Briefing |
| [03_WAHRHEIT_NUR_SPIELLEITUNG.md](03_WAHRHEIT_NUR_SPIELLEITUNG.md) | **Nur SL**, Claude bekommt je Figur nur deren Wissen |
| [04_REGELN_SPIELLEITUNG.md](04_REGELN_SPIELLEITUNG.md) | SL |
| [05_WELTZUSTAND.md](05_WELTZUSTAND.md) | SL führt ihn laufend nach (Kopie pro Testperson anlegen) |
| [06_KI_PROMPT.md](06_KI_PROMPT.md) | Wird zu Beginn in einen neuen Claude-Chat kopiert |
| [07_BEOBACHTUNGSBOGEN.md](07_BEOBACHTUNGSBOGEN.md) | SL, während und nach der Sitzung |

Außerdem ein Würfel (W6) oder eine Würfel-App.

## Ablauf einer Sitzung (60 bis 75 Minuten)

1. **Vorbereitung (10 Min., ohne Spieler):** Kopie von `05_WELTZUSTAND.md` anlegen. Neuen Claude-Chat öffnen, `06_KI_PROMPT.md` und `02_FIGUREN.md` einfügen. Eine Probezeile mit einer Figur testen.
2. **Einstieg (5 Min.):** Spieler liest `01_SPIELERBRIEFING.md`. Keine weiteren Erklärungen zu den Regeln; der Spieler soll entdecken.
3. **Spiel (45 Min.):** Sieben Spieltage nach dem Tagesablauf in den Regeln. Richtwert: etwa 6 Minuten pro Tag. Tag 1 darf länger dauern.
4. **Bilanz (5 Min.):** Die SL liest die Schlagzeile der Woche und die Bilanz vor (siehe Regeln, Tag 7).
5. **Befragung (10 Min.):** Die drei festen Fragen und der Beobachtungsbogen.

## Was als Ergebnis zählt

Bestanden, wenn mindestens **drei von fünf** Testpersonen nach der Sitzung freiwillig weiterspielen wollen und eine Geschichte aus ihrer Partie erzählen können. Die genauen Kriterien stehen im Beobachtungsbogen.

Genauso wertvoll wie das Ergebnis sind die **zähen Stellen**: Wo hat der Spieler gezögert, sich gelangweilt, nicht verstanden, was los ist? Diese Stellen sind der wichtigste Ertrag von S0.

## Grundhaltung der Spielleitung

- **Fair, nicht gnädig.** Folgen nach Regeln, auch wenn sie hart sind. Keine Rettung, damit es spannend bleibt, und keine Strafe, um eine Moral durchzusetzen.
- **Wege statt Verbote.** Sagt der Spieler etwas, das so nicht geht, nennt eine Figur die möglichen Wege und was sie kosten. Nie nur „Das geht nicht.“
- **Die Vergangenheit zurückbringen.** Jede Zusage, jede Drohung, jeder Gefallen wird notiert und soll in der Woche mindestens einmal wieder auftauchen.
- **Nicht erklären, was die Simulation denkt.** Der Spieler erfährt die Welt durch Figuren, Meldungen und Zahlen im Briefing.
