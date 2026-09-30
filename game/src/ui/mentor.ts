// Randnotizen der Mentorin (Lernkonzept, Abschnitt 4). Vorerst feste Regeln
// statt Sprachmodell. Sie erklären nur, was das Modell tatsächlich rechnet,
// und nennen keine Zahlen über die Zukunft.

import type { World } from "../sim/types";
import { realRate } from "../sim/economy";
import { stimmenSicht } from "../sim/handeln";
import { waehlerLage } from "../sim/waehler";

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

  const spiel = world.spiel;
  if (spiel) {
    if (world.day < 45) {
      notes.push({
        short: "Tipp für die ersten Wochen: Klicken Sie auf eine Provinz. Das Blatt zeigt Probleme, Straßen und Krankenhäuser; „Hier bauen“ führt direkt zu den Maßnahmen.",
        more: "Die Ebene „Infrastruktur“ färbt die Karte nach der Straßendichte und zeigt beim Hineinzoomen einzelne Bezirke. So sehen Sie, wo etwas fehlt, bevor Sie Geld ausgeben. Jede Maßnahme lässt sich auf einzelne Provinzen beschränken, dann kostet sie weniger Kapital und wirkt vor Ort.",
      });
    }
    if (spiel.kapital < 10) {
      notes.push({
        short: "Ihr Politisches Kapital ist fast aufgebraucht. Jede Änderung kostet davon; setzen Sie Schwerpunkte.",
        more: "Kapital wächst mit dem Vertrauen in die Regierung und einer Mehrheit im Parlament. Kleine, örtlich begrenzte Vorhaben kosten weniger als landesweite. Wer Ereignisse unbeantwortet lässt, verliert dazu noch Zustimmung.",
      });
    }
    const s = stimmenSicht(world);
    if (s.luecke > 0) {
      notes.push({
        short: `Ihrem Lager fehlen etwa ${s.luecke} Stimmen für eine Mehrheit. Gesetze werden dadurch teuer und unsicher.`,
        more: "Sie können Stimmen kaufen (das kostet Kapital und schafft eine Zusage, die später eingefordert wird) oder Partner gewinnen, deren Angebote als Ereignis kommen. Wer Zusagen bricht, verliert Partner.",
      });
    }
  }

  if (notes.length === 0) {
    notes.push({
      short: "Keine auffälligen Zusammenhänge im Moment. Klicke eine Zahl in der Wirtschaftsakte an, wenn du etwas wissen willst.",
      more: "Ich melde mich, wenn etwas passiert, das man verstehen sollte. Ich sage dir nicht, was richtig ist, sondern was wie zusammenhängt.",
    });
  }
  // Hinweise zu den Spielsystemen: Kapital, Wähler, Partner
  const sp = world.spiel;
  if (sp) {
    if (sp.kapital < 8 && world.day > 60) {
      notes.push({
        short: "Ihr Kapital ist knapp. Erst zurücklegen, dann gezielt ausgeben.",
        more: "Kapital wächst jeden Monatsersten und wird für Gesetze, Verhandlungen und Antworten auf Ereignisse gebraucht. Wer es sofort aufbraucht, kann auf eine Krise nicht mehr reagieren. Ein Gespräch mit einer Fraktion kostet 1, ein Gesetz oft das Zehnfache; günstige Schritte zuerst.",
      });
    }
    const verstimmt = waehlerLage(world).filter((g) => g.laune < 42).sort((a, b) => a.laune - b.laune)[0];
    if (verstimmt) {
      notes.push({
        short: `${verstimmt.name} sind verärgert (Stimmung ${Math.round(verstimmt.laune)}).`,
        more: `Warum: ${verstimmt.gruende.slice(0, 2).map((r) => `${r.name} (${r.text.replace(/\.$/, "")})`).join("; ")}. Wer verärgert ist, sucht bei der Wahl eine andere Antwort. Was sie wollen, steht im Fenster „Wähler“.`,
      });
    }
    const wackelig = sp.figuren.find((f) => f.amt === "partner" && sp.lager.includes(f.partei ?? "") && f.loyalitaet < 32);
    if (wackelig) {
      notes.push({
        short: `${wackelig.rolle} ${wackelig.name} steht kurz vor dem Bruch.`,
        more: "Ein Partner, der geht, nimmt seine Sitze mit. Loyalität wächst mit gehaltenen Zusagen und einem Gespräch (1 Kapital) und sinkt mit Vertrösten und Bruch. Unter „Personen und Zusagen“ sehen Sie, was er will.",
      });
    }
  }
  return notes;
}
