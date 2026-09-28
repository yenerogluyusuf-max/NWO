import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { outlook, type Metric, type Outlook } from "../sim/forecast";
import { criticizeCentralBank, replaceGovernor, setFiscalImpulse } from "../sim/world";

interface Option {
  id: string;
  title: string;
  text: string;
  act: (w: World) => void;
}

const OPTIONS: Option[] = [
  {
    id: "gouverneur",
    title: "Zentralbankführung austauschen",
    text: "Eine gefügige Führung einsetzen, die eher auf Wachstum als auf Preisstabilität achtet.",
    act: (w) => replaceGovernor(w, "gefuegig", "eine neue, regierungsnahe Führung"),
  },
  {
    id: "kritik",
    title: "Zentralbank öffentlich kritisieren",
    text: "In einer Rede die hohen Zinsen angreifen, ohne jemanden zu entlassen.",
    act: (w) => criticizeCentralBank(w),
  },
  {
    id: "ausgaben",
    title: "Staatsausgaben erhöhen",
    text: "Zusätzliche Ausgaben von 2 % der Wirtschaftsleistung, etwa für Renten und Investitionen.",
    act: (w) => setFiscalImpulse(w, w.economy.fiscalImpulse + 2),
  },
  {
    id: "sparen",
    title: "Staatsausgaben kürzen",
    text: "Ausgaben um 1 % der Wirtschaftsleistung senken.",
    act: (w) => setFiscalImpulse(w, w.economy.fiscalImpulse - 1),
  },
];

const METRICS: { id: Metric; label: string; unit: string }[] = [
  { id: "inflation", label: "Inflation", unit: "%" },
  { id: "growth", label: "Wachstum", unit: "%" },
  { id: "unemployment", label: "Arbeitslosigkeit", unit: "%" },
  { id: "usdTry", label: "Lira je Dollar", unit: "" },
];

const DIRECTION: Record<Outlook["direction"], string> = {
  hoeher: "eher höher",
  niedriger: "eher niedriger",
  unklar: "kaum Unterschied erkennbar",
};

export function Decisions({ world, onDecided }: { world: World; onDecided: () => void }) {
  const [chosen, setChosen] = useState<Option | null>(null);

  const outlooks = useMemo(
    () => (chosen ? METRICS.map((m) => ({ ...m, o: outlook(world, chosen.act, m.id, 12, 16) })) : []),
    // Die Vorschau gilt für den Stand, an dem sie geöffnet wurde.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chosen],
  );

  return (
    <div className="decisions">
      <section className="paper">
        <h2>Entscheidungen</h2>
        <p className="subtitle">Entwickleransicht: Die Handlungen kommen später über das Politiknetz und die Schreibfläche.</p>
        <div className="options">
          {OPTIONS.map((o) => (
            <button key={o.id} className={"option intent" + (chosen?.id === o.id ? " active" : "")} onClick={() => setChosen(o)}>
              <strong>{o.title}</strong>
              <span>{o.text}</span>
            </button>
          ))}
        </div>
      </section>
      {chosen && (
        <aside className="paper outlook">
          <h3>{chosen.title}</h3>
          <p className="subtitle">In zwölf Monaten, verglichen mit „nichts tun“. Richtung und Bandbreite, keine genauen Zahlen.</p>
          <table>
            <tbody>
              {outlooks.map(({ id, label, o }) => (
                <tr key={id}>
                  <th>{label}</th>
                  <td>
                    {DIRECTION[o.direction]}
                    {id === "usdTry" && o.direction === "hoeher" && " (Lira schwächer)"}
                    {id === "usdTry" && o.direction === "niedriger" && " (Lira stärker)"}
                  </td>
                  <td className="range">
                    etwa {fmtRange(o.withAction.low, o.withAction.high, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mentor-inline">
            <strong>Mentorin:</strong> Die Bandbreite zeigt, wie unsicher das ist. Das Modell rechnet die Zukunft mehrfach
            durch; die Wirklichkeit hält sich nicht an Modelle.
          </p>
          <div className="confirm">
            <button
              className="primary"
              onClick={() => {
                chosen.act(world);
                setChosen(null);
                onDecided();
              }}
            >
              Entscheiden
            </button>
            <button onClick={() => setChosen(null)}>Verwerfen</button>
          </div>
        </aside>
      )}
    </div>
  );
}

function fmtRange(low: number, high: number, digits: number): string {
  const f = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: digits });
  return `${f(Math.floor(low))} bis ${f(Math.ceil(high))}`;
}
