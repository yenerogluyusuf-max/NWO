// Das „Stand der Dinge“-Blatt beim Laden: einmalig, ruhig, wegklickbar — danach der normale Schreibtisch.
// Atlas-Typografie wie das Ereignisfenster (frame, kicker, Flourish), aber ohne Szene: ein Blatt, keine Episode.
// Die Zahlen rechnet standderdinge.ts; hier wird nur gezeigt.

import { Corners, Flourish } from "./art/Ornament";
import type { KennzahlDelta, StandDerDinge as Stand } from "./standderdinge";
import { t } from "../i18n";

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

function DeltaChip({ d }: { d: KennzahlDelta }) {
  const bewegt = Math.abs(d.delta) >= 0.05;
  const auf = d.delta > 0;
  const gut = bewegt && auf === d.gutWennAuf;
  const label = d.id === "kapital" ? t("buehne.stat.kapital") : d.id === "zustimmung" ? t("buehne.stat.zustimmung") : t("buehne.stat.inflation");
  const zuletztWert = d.id === "kapital" ? Math.floor(d.von) : nf(d.von);
  return (
    <li className={`sdd-delta${bewegt ? (gut ? " gut" : " schlecht") : ""}`}>
      <span className="sdd-delta-label">{label}</span>
      <span className="sdd-delta-wert">
        {d.id === "kapital" ? Math.floor(d.nach) : nf(d.nach)}
        {d.einheit ? ` ${d.einheit}` : ""}
      </span>
      <span className="sdd-delta-diff">
        {bewegt ? `${auf ? "▲" : "▼"} ${nf(Math.abs(d.delta))}` : "± 0"}
        <em> {t("sdd.zuletzt", { wert: zuletztWert })}</em>
      </span>
    </li>
  );
}

export function StandDerDingeBlatt({ stand, onSchliessen }: { stand: Stand; onSchliessen: () => void }) {
  return (
    <div className="event-layer" role="dialog" aria-modal="true" aria-labelledby="sdd-titel">
      <article className="frame event-window sdd">
        <Corners />
        <div className="event-body sdd-body">
          <p className="kicker">{t("sdd.kicker")}</p>
          <h2 id="sdd-titel">
            {t("sdd.amtszeit", { datum: stand.datum, amtszeit: stand.amtszeit })}
          </h2>
          <Flourish width={180} />
          <p className="subtitle">
            {t("sdd.willkommen", { monate: stand.monateBisWahl, vergleichDatum: stand.vergleichDatum ?? undefined })}
          </p>

          {stand.deltas ? (
            <ul className="sdd-deltas" aria-label={t("sk.sdd.deltaAria")}>
              {stand.deltas.map((d) => (
                <DeltaChip key={d.id} d={d} />
              ))}
            </ul>
          ) : (
            <p className="sdd-notiz">{t("sdd.keineVergleichsdaten")}</p>
          )}

          <div className="sdd-spalten">
            <section>
              <h3>{t("sdd.vorgaenge")}</h3>
              {stand.vorgaenge.length === 0 ? (
                <p className="sdd-notiz">{t("sdd.vorgaengeLeer")}</p>
              ) : (
                <ul className="sdd-liste">
                  {stand.vorgaenge.map((v) => (
                    <li key={v.id}>
                      <strong>{v.titel}</strong>
                      <span className="sdd-rest">{v.rest}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3>{t("sdd.probleme")}</h3>
              {stand.probleme.length === 0 ? (
                <p className="sdd-notiz">{t("sdd.problemeLeer")}</p>
              ) : (
                <ul className="sdd-liste">
                  {stand.probleme.map((p) => (
                    <li key={p.id}>
                      <span className={`sdd-ampel ${p.stufe}`} role="img" aria-label={p.stufe === "rot" ? t("sk.ui.dringendAria") : t("sk.ui.achtungAria")} />
                      <strong>{p.text}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <p className="sdd-zeile">
            <span className="sdd-zeile-label">{t("sdd.agenda")}</span> {stand.agenda ?? t("sdd.agendaLeer")}
          </p>
          <p className="sdd-zeile">
            <span className="sdd-zeile-label">{t("sdd.frist")}</span>{" "}
            {stand.frist ? t("sdd.tageFrist", { titel: stand.frist.titel, tage: stand.frist.tage }) : t("sdd.keineFrist")}
          </p>

          <div className="event-actions">
            <button className="brass-button" onClick={onSchliessen}>
              {t("sdd.zumSchreibtisch")}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
