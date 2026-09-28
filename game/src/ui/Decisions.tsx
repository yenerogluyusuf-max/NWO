import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { outlook, type Metric, type Outlook } from "../sim/forecast";
import { criticizeCentralBank, replaceGovernor, setFiscalImpulse } from "../sim/world";
import { Icon, type IconName } from "./icons";
import { Vignette } from "./art/Vignette";
import { formatDateDe } from "../sim/dates";

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
      <div className="decision-list">
        {OPTIONS.map((o) => (
          <button key={o.id} className={"decision-card" + (chosen?.id === o.id ? " active" : "")} onClick={() => setChosen(o)} aria-pressed={chosen?.id === o.id}>
            <span className="decision-icon">
              <Icon name={o.icon} size={22} />
            </span>
            <strong>{o.title}</strong>
            <span className="decision-lever">{o.lever}</span>
          </button>
        ))}
      </div>
      {!chosen && (
        <section className="decree empty">
          <Vignette scene="parlament" />
          <p className="decree-hint">Wähle links eine Maßnahme. Hier liegt dann der Erlass zur Unterschrift, mit einer Vorschau auf das nächste Jahr.</p>
        </section>
      )}
      {chosen && (
        <section className="decree">
          <p className="kicker">Erlass · {formatDateDe(world.date)}</p>
          <h3>{chosen.title}</h3>
          <p className="decree-text">{chosen.text}</p>
          <table className="decree-outlook">
            <caption>In zwölf Monaten, verglichen mit „nichts tun“</caption>
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
          <p className="mentor-inline">Die Bandbreite zeigt, wie unsicher das ist. Die Wirklichkeit hält sich nicht an Modelle.</p>
          <div className="signature">
            <div className="signature-line">
              <span className="signature-name">{world.player?.name ?? ""}</span>
              <span className="signature-caption">Unterschrift</span>
            </div>
            <button
              className="wax-seal"
              onClick={() => {
                chosen.act(world);
                setChosen(null);
                onDecided();
              }}
            >
              <img src="/ui/siegel.png" alt="" />
              <span>Unterzeichnen</span>
            </button>
          </div>
          <button className="link" onClick={() => setChosen(null)}>
            Verwerfen
          </button>
        </section>
      )}
    </div>
  );
}

function fmtRange(low: number, high: number, digits: number): string {
  const f = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: digits });
  return `${f(Math.floor(low))} bis ${f(Math.ceil(high))}`;
}
