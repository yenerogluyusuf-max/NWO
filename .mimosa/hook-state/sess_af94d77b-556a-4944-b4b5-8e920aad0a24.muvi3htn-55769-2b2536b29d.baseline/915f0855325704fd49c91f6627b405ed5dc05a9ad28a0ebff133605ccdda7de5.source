// Das Vermächtnis: Rückblick auf die ganze Laufbahn in Kapiteln (Zustimmungskurve, Amtszeiten, Wahlen, Zusagen, Kriege, Verfassung, Reich, Kabinett,
// Katastrophen, Zahlen, Wendepunkte, Epilog). Reine Darstellung der Daten aus sim/vermaechtnis.ts; alle Texte laufen über die Übersetzungsschicht.

import type { VermaechtnisDaten } from "../../sim/vermaechtnis";
import { t } from "../../i18n";
import "./vermaechtnis.css";

const B = 640;
const H = 150;
const RAND = { l: 38, r: 10, o: 10, u: 22 };

/** Zustimmungskurve als SVG: Linien bei 50 Prozent (Sieg) und 25 Prozent (Sturz), Marken für Wahlen (gewonnen golden, verloren rot). */
export function Kurve({ kurve, wahlen }: { kurve: VermaechtnisDaten["kurve"]; wahlen: VermaechtnisDaten["wahlen"] }) {
  const n = kurve.length;
  if (n < 2) return null;
  const x = (i: number) => RAND.l + (i / (n - 1)) * (B - RAND.l - RAND.r);
  const y = (v: number) => RAND.o + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - RAND.o - RAND.u);
  const pfad = kurve.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.wert).toFixed(1)}`).join(" ");
  const jahr0 = Number(kurve[0]!.monat.slice(0, 4));
  const jahre: { i: number; j: number }[] = [];
  kurve.forEach((p, i) => {
    const j = Number(p.monat.slice(0, 4));
    if (p.monat.endsWith("-01") && j > jahr0) jahre.push({ i, j });
  });
  return (
    <svg className="vm-kurve" viewBox={`0 0 ${B} ${H}`} role="img" aria-label={t("vermaechtnis.kap.zustimmung")}>
      {[25, 50].map((v) => (
        <g key={v}>
          <line x1={RAND.l} x2={B - RAND.r} y1={y(v)} y2={y(v)} className={v === 50 ? "vm-grenze sieg" : "vm-grenze sturz"} />
          <text x={RAND.l - 6} y={y(v) + 4} textAnchor="end" className="vm-achse">{v} %</text>
        </g>
      ))}
      {jahre.map(({ i, j }) => (
        <text key={j} x={x(i)} y={H - 6} textAnchor="middle" className="vm-achse">{j}</text>
      ))}
      <path d={pfad} className="vm-linie" fill="none" />
      {wahlen.map((w) => {
        const i = kurve.findIndex((p) => p.monat === w.datum.slice(0, 7));
        if (i < 0) return null;
        return <circle key={w.datum} cx={x(i)} cy={y(kurve[i]!.wert)} r={5} className={w.gewonnen ? "vm-wahl gewonnen" : "vm-wahl verloren"} />;
      })}
    </svg>
  );
}

function epilogSchluessel(d: VermaechtnisDaten): string {
  if (!d.ende) return "vermaechtnis.epilog.laufend";
  if (d.ende.art === "amtszeitende") {
    if (d.ende.nachfolge === "sieg") return "vermaechtnis.epilog.amtszeitende_sieg";
    if (d.ende.nachfolge === "niederlage") return "vermaechtnis.epilog.amtszeitende_niederlage";
    return "vermaechtnis.epilog.amtszeitende";
  }
  return `vermaechtnis.epilog.${d.ende.art}`;
}

export function Vermaechtnis({ daten: d }: { daten: VermaechtnisDaten }) {
  return (
    <div className="vm">
      <header className="vm-kopf">
        <p className="vm-kicker">{t("vermaechtnis.kicker", { name: d.name })}</p>
        <h2>{t("vermaechtnis.titel")}</h2>
        <p className="vm-zeitraum">{t("vermaechtnis.zeitraum", { von: d.von, bis: d.bis, jahre: d.tage / 365 })}</p>
        <p className="vm-ende">{t(d.ende ? `vermaechtnis.ende.${d.ende.art}` : "vermaechtnis.ende.laufend")}</p>
      </header>

      <section className="vm-kap vm-breit">
        <h3>{t("vermaechtnis.kap.zustimmung")}</h3>
        <p className="vm-text">{t("vermaechtnis.kap.zustimmung_text")}</p>
        <Kurve kurve={d.kurve} wahlen={d.wahlen} />
      </section>

      <div className="vm-spalten">
        <section className="vm-kap">
          <h3>{t("vermaechtnis.kap.amtszeiten")}</h3>
          <ul>
            {d.amtszeiten.map((a) => (
              <li key={a.nr}>
                <strong>{t("vermaechtnis.amtszeit.zeile", { nr: a.nr, von: a.von, bis: a.bis, start: a.zustimmungStart, ende: a.zustimmungEnde })}</strong>
                <span>
                  {a.ziele.length
                    ? t("vermaechtnis.amtszeit.ziele", { erreicht: a.ziele.filter((z) => z.erreicht).length, gesamt: a.ziele.length })
                    : t("vermaechtnis.amtszeit.keine_ziele")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="vm-kap">
          <h3>{t("vermaechtnis.kap.wahlen")}</h3>
          {d.wahlen.length === 0 && <p className="vm-text">{t("vermaechtnis.wahl.keine")}</p>}
          <ul>
            {d.wahlen.map((w) => (
              <li key={w.datum} className={w.gewonnen ? "gewonnen" : "verloren"}>
                {t("vermaechtnis.wahl.zeile", {
                  datum: w.datum,
                  anteil: w.anteil,
                  gang: w.stichwahl ? "stich" : "erst",
                  ergebnis: w.gewonnen ? "ja" : "nein",
                  vorher: w.lagerSitzeVorher,
                  nachher: w.lagerSitze,
                  letzte: w.letzte ? "ja" : "nein",
                })}
              </li>
            ))}
          </ul>
        </section>

        <section className="vm-kap">
          <h3>{t("vermaechtnis.kap.zusagen")}</h3>
          <p className="vm-text">{t("vermaechtnis.zusagen.text", { gehalten: d.zusagen.gehalten, gebrochen: d.zusagen.gebrochen, offen: d.zusagen.offen, glaub: d.zusagen.glaubwuerdigkeit })}</p>
        </section>

        <section className="vm-kap">
          <h3>{t("vermaechtnis.kap.kriege")}</h3>
          {d.kriege.length === 0 && <p className="vm-text">{t("vermaechtnis.kriege.keine")}</p>}
          <ul>
            {d.kriege.map((k, i) => (
              <li key={i}>{t("vermaechtnis.kriege.zeile", { gegner: k.gegner, wochen: k.wochen, ausgang: t(`vermaechtnis.krieg.${k.ausgang}`) })}</li>
            ))}
          </ul>
        </section>

        <section className="vm-kap">
          <h3>{t("vermaechtnis.kap.verfassung")}</h3>
          <p className="vm-text">
            {d.verfassung.aenderungen.length ? t("vermaechtnis.verfassung.text", { n: d.verfassung.aenderungen.length, artikel: d.verfassung.aenderungen }) : t("vermaechtnis.verfassung.keine")}
            {d.verfassung.gescheitert > 0 ? ` ${t("vermaechtnis.verfassung.gescheitert", { n: d.verfassung.gescheitert })}` : ""}
          </p>
        </section>

        <section className="vm-kap">
          <h3>{t("vermaechtnis.kap.reich")}</h3>
          <p className="vm-text">{t("vermaechtnis.reich.text", { fertig: d.reich.fertig, laufend: d.reich.laufend })}</p>
          {d.reich.wunder.length > 0 && <p className="vm-text">{t("vermaechtnis.reich.wunder", { liste: d.reich.wunder })}</p>}
        </section>

        <section className="vm-kap">
          <h3>{t("vermaechtnis.kap.kabinett")}</h3>
          <ul>
            {d.kabinett.amtierend.map((m) => (
              <li key={m.name}>{t("vermaechtnis.kabinett.zeile", { name: m.name, rolle: m.rolle, loyal: m.loyalitaet })}</li>
            ))}
          </ul>
          <p className="vm-text">{t("vermaechtnis.kabinett.ehemalige", { n: d.kabinett.ehemalige })}</p>
        </section>

        <section className="vm-kap">
          <h3>{t("vermaechtnis.kap.katastrophen")}</h3>
          <p className="vm-text">{d.katastrophen.text || t("vermaechtnis.katastrophen.keine")}</p>
        </section>
      </div>

      <section className="vm-kap vm-breit">
        <h3>{t("vermaechtnis.kap.kennzahlen")}</h3>
        <table className="vm-tabelle">
          <tbody>
            {d.kennzahlen.map((k) => (
              <tr key={k.name}>
                <th>{k.name}</th>
                <td>{k.start}</td>
                <td aria-hidden>→</td>
                <td className={`urteil-${k.urteil}`}>{k.ende}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="vm-kap vm-breit">
        <h3>{t("vermaechtnis.kap.wendepunkte")}</h3>
        {d.wendepunkte.length === 0 && <p className="vm-text">{t("vermaechtnis.wendepunkte.keine")}</p>}
        <ul className="vm-wende">
          {d.wendepunkte.map((w, i) => (
            <li key={i}>
              <strong>{w.titel}</strong>
              <em>{w.ausgang}</em>
            </li>
          ))}
        </ul>
      </section>

      <section className="vm-kap vm-breit vm-epilog">
        <h3>{t("vermaechtnis.kap.epilog")}</h3>
        <p className="vm-text">{t(epilogSchluessel(d))}</p>
      </section>
    </div>
  );
}
