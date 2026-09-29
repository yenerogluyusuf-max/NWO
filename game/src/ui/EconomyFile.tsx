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
  const [selected, setSelected] = useState<string | null>("inflation");
  const e = world.economy;
  const p = world.published;
  const publishedHistory = world.history.filter((s) => s.month <= p.inflation.period);
  const recentHistory = world.history.slice(-24);
  const series = (key: "policyRate" | "eurTry" | "riskPremium" | "debtRatio", now: number) => {
    const xs = recentHistory.map((s) => s[key]).filter((x): x is number => x !== undefined);
    return [...xs, now];
  };

  const rows: Row[] = [
    {
      id: "inflation",
      label: "Inflation",
      value: `${nf(p.inflation.value)} %`,
      measured: `${formatMonthDe(p.inflation.period)}, veröffentlicht am ${formatDateDe(p.inflation.publishedOn)}`,
      explain:
        "Wie stark die Preise im Vergleich zum Vorjahresmonat gestiegen sind. Das Statistikamt meldet den Wert Anfang des Folgemonats; du steuerst also immer mit Blick in den Rückspiegel.",
      series: publishedHistory.slice(-24).map((s) => s.inflation),
    },
    {
      id: "leitzins",
      label: "Leitzins",
      value: `${nf(e.policyRate)} %`,
      measured: "tagesaktuell",
      explain:
        "Der Zins, zu dem sich Banken bei der Zentralbank Geld leihen. Ihn legt der Geldpolitische Ausschuss der Zentralbank fest, nicht der Präsident.",
      series: series("policyRate", e.policyRate),
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
      series: series("eurTry", e.eurTry),
    },
    {
      id: "wachstum",
      label: "Wachstum",
      value: `${nf(p.growth.value)} %`,
      measured: `${p.growth.period}, veröffentlicht am ${formatDateDe(p.growth.publishedOn)}`,
      explain: "Wie stark die Wirtschaftsleistung gegenüber dem Vorjahresquartal gewachsen ist. Erscheint etwa zwei Monate nach Quartalsende.",
      series: publishedHistory.slice(-24).map((s) => s.growth),
    },
    {
      id: "arbeitslosigkeit",
      label: "Arbeitslosenquote",
      value: `${nf(p.unemployment.value)} %`,
      measured: `${formatMonthDe(p.unemployment.period)}, veröffentlicht am ${formatDateDe(p.unemployment.publishedOn)}`,
      explain: "Anteil der Arbeitsuchenden an den Erwerbspersonen. Folgt dem Wachstum mit Verzögerung.",
      series: publishedHistory.slice(-24).map((s) => s.unemployment),
    },
    {
      id: "cds",
      label: "Risikoaufschlag",
      value: `${nf(e.riskPremium, 0)} Basispunkte`,
      measured: "tagesaktuell",
      explain:
        "Was Anleger als Aufpreis für das Risiko verlangen, dass der Staat nicht zahlt. Er steigt bei hoher Inflation, hohen Schulden und politischer Unsicherheit.",
      series: series("riskPremium", e.riskPremium),
    },
    {
      id: "schulden",
      label: "Staatsschulden",
      value: `${nf(e.debtRatio)} % des BIP`,
      measured: "Schätzung des Finanzministeriums",
      explain: "Alle Schulden des Staates im Verhältnis zur Wirtschaftsleistung. Hohe Inflation lässt die Quote sinken, weil die Wirtschaftsleistung nominal schneller wächst als die Schulden.",
      series: series("debtRatio", e.debtRatio),
    },
    {
      id: "politikosten",
      label: "Politikosten",
      value: `${nf(e.policyCost, 2)} % des BIP pro Jahr`,
      measured: "aus dem Politiknetz berechnet",
      explain:
        "Laufende Kosten aller beschlossenen Maßnahmen gegenüber dem Amtsantritt, in Prozent der Wirtschaftsleistung pro Jahr. Jede Erhöhung einer teuren Maßnahme treibt diesen Wert; Kürzungen senken ihn. Der Beschluss ist noch keine Wirkung — die Umsetzung läuft über Monate.",
    },
  ];

  const current = rows.find((r) => r.id === selected);
  const recent = [...world.log].reverse().filter((l) => l.kind !== "ereignis").slice(0, 4);

  return (
    <div className="file">
      <section className="paper">
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
  const w = 150;
  const h = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const y = (v: number) => h - ((v - min) / span) * (h - 6) - 3;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, y(v)] as const);
  const line = pts.map(([x, yy]) => `${x.toFixed(1)},${yy.toFixed(1)}`).join(" ");
  const area = `M0 ${h} L${line.replace(/ /g, " L")} L${w} ${h} Z`;
  const last = values[values.length - 1]!;
  return (
    <svg className="spark" overflow="visible" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path d={area} fill="currentColor" fillOpacity="0.12" />
      <polyline points={line} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx={w} cy={y(last)} r="2.6" fill="currentColor" />
      <text x="-4" y={y(max) + 3} textAnchor="end" className="spark-mark">{fmtShort(max)}</text>
      {max !== min && <text x="-4" y={y(min) + 3} textAnchor="end" className="spark-mark">{fmtShort(min)}</text>}
    </svg>
  );
}

function fmtShort(x: number): string {
  return x.toLocaleString("de-DE", { maximumFractionDigits: Math.abs(x) >= 100 ? 0 : 1 });
}
