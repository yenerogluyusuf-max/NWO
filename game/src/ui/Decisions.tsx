import { useEffect, useState } from "react";
import type { World } from "../sim/types";
import { fuehreAus, type Aktion, type Metric, type Outlook } from "../sim/forecast";
import { berechneVorschau } from "./vorschau";
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
  aktion: Aktion;
}

const OPTIONS: Option[] = [
  {
    id: "gouverneur",
    title: "Zentralbankführung austauschen",
    icon: "bank",
    lever: "Präsidialdekret",
    text: "Eine gefügige Führung einsetzen, die eher auf Wachstum als auf Preisstabilität achtet.",
    aktion: { art: "zentralbank" },
  },
  {
    id: "kritik",
    title: "Zentralbank öffentlich kritisieren",
    icon: "parlament",
    lever: "Rede",
    text: "In einer Rede die hohen Zinsen angreifen, ohne jemanden zu entlassen.",
    aktion: { art: "kritik" },
  },
  {
    id: "ausgaben",
    title: "Staatsausgaben erhöhen",
    icon: "lira",
    lever: "Haushalt · +2 % des BIP",
    text: "Zusätzliche Ausgaben von 2 % der Wirtschaftsleistung, etwa für Renten und Investitionen.",
    aktion: { art: "haushalt", impuls: 2 },
  },
  {
    id: "sparen",
    title: "Staatsausgaben kürzen",
    icon: "preis",
    lever: "Haushalt · −1 % des BIP",
    text: "Ausgaben um 1 % der Wirtschaftsleistung senken.",
    aktion: { art: "haushalt", impuls: -1 },
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

export function Decisions({ world, onDecided, start }: { world: World; onDecided: () => void; start?: string }) {
  const [chosen, setChosen] = useState<Option | null>(OPTIONS.find((o) => o.id === start) ?? null);
  const [outlooks, setOutlooks] = useState<{ id: Metric; label: string; unit: string; o: Outlook }[] | "laedt">([]);

  // Die Vorschau rechnet im Hintergrund und gilt für den Stand, an dem sie geöffnet wurde.
  useEffect(() => {
    if (!chosen) {
      setOutlooks([]);
      return;
    }
    let aktiv = true;
    setOutlooks("laedt");
    berechneVorschau(world, chosen.aktion, METRICS.map((m) => m.id), 12, 12).then((os) => {
      if (aktiv) setOutlooks(METRICS.map((m, k) => ({ ...m, o: os[k]! })));
    });
    return () => {
      aktiv = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen]);

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
              {outlooks === "laedt" && (
                <tr>
                  <td colSpan={3} className="rechnet">
                    Die Kanzlei rechnet die nächsten zwölf Monate durch …
                  </td>
                </tr>
              )}
              {outlooks !== "laedt" && outlooks.map(({ id, label, o }) => (
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
                fuehreAus(world, chosen.aktion);
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
