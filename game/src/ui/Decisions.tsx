import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { outlook, type Metric, type Outlook } from "../sim/forecast";
import { criticizeCentralBank, replaceGovernor, setFiscalImpulse } from "../sim/world";
import { Icon, type IconName } from "./icons";

interface Option {
  id: string;
  title: string;
  text: string;
  icon: IconName;
  /** Über welchen Weg die Entscheidung läuft */
  lever: string;
  act: (w: World) => void;
}

const OPTIONS: Option[] = [
  {
    id: "gouverneur",
    title: "Zentralbankführung austauschen",
    icon: "bank",
    lever: "Präsidialdekret",
    text: "Eine gefügige Führung einsetzen, die eher auf Wachstum als auf Preisstabilität achtet.",
    act: (w) => replaceGovernor(w, "gefuegig", "eine neue, regierungsnahe Führung"),
  },
  {
    id: "kritik",
    title: "Zentralbank öffentlich kritisieren",
    icon: "parlament",
    lever: "Rede",
    text: "In einer Rede die hohen Zinsen angreifen, ohne jemanden zu entlassen.",
    act: (w) => criticizeCentralBank(w),
  },
  {
    id: "ausgaben",
    title: "Staatsausgaben erhöhen",
    icon: "lira",
    lever: "Haushalt · +2 % des BIP",
    text: "Zusätzliche Ausgaben von 2 % der Wirtschaftsleistung, etwa für Renten und Investitionen.",
    act: (w) => setFiscalImpulse(w, w.economy.fiscalImpulse + 2),
  },
  {
    id: "sparen",
    title: "Staatsausgaben kürzen",
    icon: "preis",
    lever: "Haushalt · −1 % des BIP",
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
      <p className="subtitle">Wähle eine Maßnahme. Vor der Unterschrift siehst du, wohin sie in einem Jahr ungefähr führt.</p>
      <div className="decision-cards">
        {OPTIONS.map((o) => (
          <button key={o.id} className={"decision-card" + (chosen?.id === o.id ? " active" : "")} onClick={() => setChosen(o)} aria-pressed={chosen?.id === o.id}>
            <span className="decision-icon">
              <Icon name={o.icon} size={24} />
            </span>
            <strong>{o.title}</strong>
            <span className="decision-text">{o.text}</span>
            <span className="decision-lever">{o.lever}</span>
          </button>
        ))}
      </div>
      {chosen && (
        <section className="outlook">
          <h3>{chosen.title}</h3>
          <p className="subtitle">In zwölf Monaten, verglichen mit „nichts tun“. Richtung und Bandbreite, keine genauen Zahlen.</p>
          <table>
            <tbody>
              {outlooks.map(({ id, label, o }) => (
                <tr key={id}>
                  <th>{label}</th>
                  <td className={`dir dir-${o.direction}`}>
                    <span aria-hidden>{o.direction === "hoeher" ? "▲" : o.direction === "niedriger" ? "▼" : "◆"}</span> {DIRECTION[o.direction]}
                    {id === "usdTry" && o.direction === "hoeher" && " (Lira schwächer)"}
                    {id === "usdTry" && o.direction === "niedriger" && " (Lira stärker)"}
                  </td>
                  <td className="range">etwa {fmtRange(o.withAction.low, o.withAction.high, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mentor-inline">
            Die Bandbreite zeigt, wie unsicher das ist. Das Modell rechnet die Zukunft mehrfach durch; die Wirklichkeit hält sich nicht an Modelle.
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
              Unterzeichnen
            </button>
            <button className="link" onClick={() => setChosen(null)}>
              Verwerfen
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function fmtRange(low: number, high: number, digits: number): string {
  const f = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: digits });
  return `${f(Math.floor(low))} bis ${f(Math.ceil(high))}`;
}
