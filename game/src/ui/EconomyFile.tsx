import { useState } from "react";
import type { World } from "../sim/types";
import { formatDateDe, formatMonthDe } from "../sim/dates";

interface Row {
  id: string;
  label: string;
  value: string;
  measured: string;
  explain: string;
  series?: number[];
}

const nf = (x: number, digits = 1) =>
  x.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function EconomyFile({ world }: { world: World }) {
  const [selected, setSelected] = useState<string | null>(null);
  const e = world.economy;
  const p = world.published;
  const publishedHistory = world.history.filter((s) => s.month <= p.inflation.period);

  const rows: Row[] = [
    {
      id: "inflation",
      label: "Inflation",
      value: `${nf(p.inflation.value)} %`,
      measured: `${formatMonthDe(p.inflation.period)}, veröffentlicht am ${formatDateDe(p.inflation.publishedOn)}`,
      explain:
        "Wie stark die Preise im Vergleich zum Vorjahresmonat gestiegen sind. Das Statistikamt meldet den Wert Anfang des Folgemonats; du steuerst also immer mit Blick in den Rückspiegel.",
      series: publishedHistory.slice(-24).map((s) => s.inflation),
    },
    {
      id: "leitzins",
      label: "Leitzins",
      value: `${nf(e.policyRate)} %`,
      measured: "tagesaktuell",
      explain:
        "Der Zins, zu dem sich Banken bei der Zentralbank Geld leihen. Ihn legt der Geldpolitische Ausschuss der Zentralbank fest, nicht der Präsident.",
    },
    {
      id: "usd",
      label: "Lira je US-Dollar",
      value: nf(e.usdTry, 2),
      measured: "tagesaktuell",
      explain:
        "Der Außenwert der Lira. Er reagiert täglich auf Zinsen, Inflation und Vertrauen. Eine schwächere Lira macht Importe teurer.",
      series: world.history.slice(-24).map((s) => s.usdTry),
    },
    {
      id: "eur",
      label: "Lira je Euro",
      value: nf(e.eurTry, 2),
      measured: "tagesaktuell",
      explain: "Wie beim Dollar. Die EU ist der wichtigste Handelspartner.",
    },
    {
      id: "wachstum",
      label: "Wachstum",
      value: `${nf(p.growth.value)} %`,
      measured: `${p.growth.period}, veröffentlicht am ${formatDateDe(p.growth.publishedOn)}`,
      explain: "Wie stark die Wirtschaftsleistung gegenüber dem Vorjahresquartal gewachsen ist. Erscheint etwa zwei Monate nach Quartalsende.",
    },
    {
      id: "arbeitslosigkeit",
      label: "Arbeitslosenquote",
      value: `${nf(p.unemployment.value)} %`,
      measured: `${formatMonthDe(p.unemployment.period)}, veröffentlicht am ${formatDateDe(p.unemployment.publishedOn)}`,
      explain: "Anteil der Arbeitsuchenden an den Erwerbspersonen. Folgt dem Wachstum mit Verzögerung.",
    },
    {
      id: "cds",
      label: "Risikoaufschlag",
      value: `${nf(e.riskPremium, 0)} Basispunkte`,
      measured: "tagesaktuell",
      explain:
        "Was Anleger als Aufpreis für das Risiko verlangen, dass der Staat nicht zahlt. Er steigt bei hoher Inflation, hohen Schulden und politischer Unsicherheit.",
    },
    {
      id: "schulden",
      label: "Staatsschulden",
      value: `${nf(e.debtRatio)} % des BIP`,
      measured: "Schätzung des Finanzministeriums",
      explain: "Alle Schulden des Staates im Verhältnis zur Wirtschaftsleistung. Hohe Inflation lässt die Quote sinken, weil die Wirtschaftsleistung nominal schneller wächst als die Schulden.",
    },
  ];

  const current = rows.find((r) => r.id === selected);
  const recent = [...world.log].reverse().filter((l) => l.kind !== "ereignis").slice(0, 4);

  return (
    <div className="file">
      <section className="paper">
        <h2>Wirtschaftsakte</h2>
        <p className="subtitle">Klicke eine Zahl an: Was heißt das, wann wurde sie gemessen, was hat sie verändert?</p>
        <table className="indicators">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.id === selected ? "selected" : ""} onClick={() => setSelected(r.id)}>
                <th>{r.label}</th>
                <td className="value">{r.value}</td>
                <td>{r.series && r.series.length > 1 && <Sparkline values={r.series} />}</td>
                <td className="measured">{r.measured}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {current && (
        <aside className="paper why-panel">
          <h3>{current.label}</h3>
          <p>{current.explain}</p>
          <h4>Was zuletzt passiert ist</h4>
          <ul>
            {recent.map((l, i) => (
              <li key={i}>
                <span className="when">{formatDateDe(l.date)}</span> {l.text}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 120;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
