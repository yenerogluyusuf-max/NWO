// Randnotizen der Mentorin (Lernkonzept, Abschnitt 4). Vorerst feste Regeln
// statt Sprachmodell. Sie erklären nur, was das Modell tatsächlich rechnet,
// und nennen keine Zahlen über die Zukunft.

import type { World } from "../sim/types";
import { realRate } from "../sim/economy";

export interface Note {
  short: string;
  more: string;
}

export function mentorNotes(world: World): Note[] {
  const e = world.economy;
  const notes: Note[] = [];
  const r = realRate(e);

  if (r > 3) {
    notes.push({
      short: "Der Realzins ist hoch. Das bremst Kredite und Nachfrage, allerdings erst nach Monaten.",
      more:
        "Der Realzins ist der Leitzins abzüglich der erwarteten Inflation. Ist er hoch, lohnt Sparen mehr als Leihen. " +
        "Das dämpft Konsum und Investitionen und damit auf Dauer die Inflation. Auf die Nachfrage wirkt das meist erst nach einem halben bis anderthalb Jahren, auf die Währung dagegen schnell. " +
        "Das Spiel vereinfacht Banken und Kreditvergabe zu einem einzigen Zusammenhang.",
    });
  } else if (r < 0) {
    notes.push({
      short: "Der Realzins ist negativ. Wer spart, verliert Geld; das treibt Nachfrage und schwächt die Lira.",
      more:
        "Liegt der Leitzins unter der erwarteten Inflation, wird Geld jeden Monat weniger wert. Menschen kaufen lieber heute, Anleger ziehen Geld ab. " +
        "Kurzfristig kann das die Wirtschaft beleben, auf Dauer steigen meist Preise und Wechselkurs.",
    });
  }

  const yearAgo = world.history[world.history.length - 12];
  if (yearAgo) {
    const fx = (e.usdTry / yearAgo.usdTry - 1) * 100;
    const normal = e.inflation - 2.5;
    if (fx > normal + 10) {
      notes.push({
        short: "Die Lira hat stärker verloren, als die Inflation erklärt. Importe werden teurer, das kommt in den Preisen an.",
        more:
          "Eine schwache Währung verteuert importierte Energie und Vorprodukte. Das erhöht die Inflation mit einigen Wochen bis Monaten Verzögerung. Exporteure profitieren dagegen.",
      });
    }
  }

  if (e.credibility < 0.25) {
    notes.push({
      short: "Das Vertrauen in die Zentralbank ist gering. Erwartungen lösen sich vom Ziel.",
      more:
        "Wenn Haushalte und Firmen der Zentralbank nicht zutrauen, die Inflation zu senken, erhöhen sie vorsorglich Preise und Löhne. " +
        "Glaubwürdigkeit baut sich langsam auf und geht schnell verloren. Fachleute sind sich weitgehend einig, dass verankerte Erwartungen die Inflationsbekämpfung erleichtern.",
    });
  }

  if (notes.length === 0) {
    notes.push({
      short: "Keine auffälligen Zusammenhänge im Moment. Klicke eine Zahl in der Wirtschaftsakte an, wenn du etwas wissen willst.",
      more: "Ich melde mich, wenn etwas passiert, das man verstehen sollte. Ich sage dir nicht, was richtig ist, sondern was wie zusammenhängt.",
    });
  }
  return notes;
}
