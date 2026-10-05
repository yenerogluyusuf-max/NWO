// Der Reiter „Medien“ in der Zeitungsakte (Runde 2, Fork MEDIEN): Eigentum und Zustand der sieben Cluster als Tableau, Eingriffe mit Preis
// und Vorschau der Folgen, Pressefreiheitswert mit Verlauf, Wahrnehmung der Umfragen (Institute statt Wahrheit, Rohdaten gegen Kapital)
// und der Verlauf der letzten Eingriffe. Reine Darstellung über die Funktionen aus sim/medien.ts; Aktionen rufen sie auf und melden die
// Änderung nach oben (`onAenderung`), damit die Bühne sichert und neu zeichnet.

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import { NET } from "../sim/modell";
import { nationalAverage } from "../sim/netz";
import { blattDef } from "../sim/zeitung";
import { MEDIEN_CLUSTER } from "../data/medien";
import {
  ROHDATEN,
  angezeigteZustimmung,
  fuehreMedienAktionAus,
  lizenzVon,
  medienAktionen,
  medienVon,
  reichweiteJetzt,
  rohdatenKaufen,
  rsfSicht,
  sperrGrund,
  startSelbstzensur,
  type AktionId,
  type MedienAktionSicht,
} from "../sim/medien";
import { aktuelleLocale, t } from "../i18n";

const nf = (x: number, d = 1) => x.toLocaleString(aktuelleLocale(), { maximumFractionDigits: d, minimumFractionDigits: d });

const DRUCK: AktionId[] = ["eigentuemerdruck", "anzeigenstopp", "aufsichtsstrafe", "blackout", "lizenzentzug", "verfahren", "sperre_netz", "uebernahme"];
const ZUWENDUNG: AktionId[] = ["staatsanzeigen", "interview"];

function Balken({ wert, start, ueberschrift, text, gut }: { wert: number; start?: number; ueberschrift: string; text: string; gut?: boolean }) {
  const w = Math.max(0, Math.min(100, wert));
  return (
    <div className="md-balken">
      <div className="md-balken-kopf">
        <span>{ueberschrift}</span>
        <strong>{text}</strong>
      </div>
      <i className={`md-balken-spur${gut ? " gut" : ""}`} aria-hidden>
        <b style={{ width: `${w}%` }} />
        {start !== undefined && <u style={{ left: `${Math.max(0, Math.min(100, start))}%` }} />}
      </i>
    </div>
  );
}

function RsfVerlauf({ verlauf }: { verlauf: { score: number }[] }) {
  if (verlauf.length < 2) return <p className="md-hinweis">{t("medien.ui.rsf_verlauf_leer")}</p>;
  const W = 360;
  const H = 70;
  const min = Math.min(...verlauf.map((v) => v.score), 0) - 1;
  const max = Math.max(...verlauf.map((v) => v.score), 40) + 1;
  const x = (i: number) => 6 + (i / (verlauf.length - 1)) * (W - 12);
  const y = (v: number) => H - 6 - ((v - min) / (max - min)) * (H - 12);
  const d = verlauf.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v.score).toFixed(1)}`).join(" ");
  return (
    <svg className="md-rsf-linie" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("medien.ui.rsf_verlauf")}>
      <path d={d} />
      <circle cx={x(verlauf.length - 1)} cy={y(verlauf[verlauf.length - 1]!.score)} r="3.2" />
    </svg>
  );
}

export function MedienAkte({ world, onAenderung }: { world: World; onAenderung?: () => void }) {
  const [, setTick] = useState(0);
  const [gewaehlt, setGewaehlt] = useState<string>("opposition_masse");
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const spiel = world.spiel;
  if (!spiel) return <p className="md-hinweis">{t("medien.ui.ohne_spiel")}</p>;

  const m = medienVon(world);
  const rsf = rsfSicht(world);
  const wahr = angezeigteZustimmung(world);
  const aufsicht = nationalAverage(NET, world.net, "m_medienaufsicht");
  const internet = nationalAverage(NET, world.net, "m_internetsperren");
  const staatsmedien = nationalAverage(NET, world.net, "m_staatsmedien");
  const aktionen = medienAktionen(world);
  const rohdaten = m.rohdaten;

  const neu = (r: { ok: boolean; text: string }) => {
    setMeldung(r);
    setTick((x) => x + 1);
    if (r.ok) onAenderung?.();
  };

  const liste = (ids: AktionId[]): MedienAktionSicht[] => aktionen.filter((a) => a.cluster === gewaehlt && ids.includes(a.aktion) && a.anwendbar);
  const cluster = MEDIEN_CLUSTER.find((c) => c.id === gewaehlt) ?? MEDIEN_CLUSTER[0]!;
  const pk = aktionen.find((a) => a.aktion === "pressekonferenz");
  const verlaufEintraege = useMemo(() => [...m.eingriffe].reverse().slice(0, 8), [m.eingriffe.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const AktionKarte = ({ a }: { a: MedienAktionSicht }) => (
    <li className={`md-aktion${a.moeglich ? "" : " gesperrt"}`}>
      <div className="md-aktion-kopf">
        <strong>{t(`medien.aktion.${a.aktion}.name`)}</strong>
        <span className="md-kosten">{t("medien.ui.kosten", { kapital: a.kapital, aufmerksamkeit: a.aufmerksamkeit })}</span>
      </div>
      <p>{t(`medien.aktion.${a.aktion}.text`)}</p>
      <ul className="md-vorschau">
        {a.vorschau.map((v, i) => (
          <li key={i}>{v}</li>
        ))}
      </ul>
      <div className="md-aktion-fuss">
        {!a.moeglich && a.grund && <span className="md-grund">{a.grund}</span>}
        <button
          type="button"
          className="pd-btn"
          disabled={!a.moeglich}
          title={a.grund ?? undefined}
          onClick={() => neu(fuehreMedienAktionAus(world, a.aktion, a.cluster))}
        >
          {t("medien.ui.anordnen")}
        </button>
      </div>
    </li>
  );

  return (
    <div className="md">
      <header className="md-kopf">
        <div>
          <h3>{t("medien.ui.titel")}</h3>
          <p className="md-hinweis">{t("medien.ui.zweck")}</p>
        </div>
        <section className="md-rsf" aria-label={t("medien.ui.rsf")}>
          <h5>{t("medien.ui.rsf")}</h5>
          <p>
            <strong>{t("medien.ui.rsf_rang", { rang: rsf.rang })}</strong> · {t("medien.ui.rsf_wert", { score: nf(rsf.score) })}
          </p>
          <RsfVerlauf verlauf={rsf.verlauf} />
          <p className="md-hinweis">{t("medien.ui.rsf_start", { rang: rsf.start.rang, score: nf(rsf.start.score) })}</p>
        </section>
      </header>

      {meldung && (
        <p className={`md-meldung${meldung.ok ? "" : " fehler"}`} role="status">
          {meldung.text}
        </p>
      )}

      <section className="md-wahrnehmung" aria-label={t("medien.ui.wahrnehmung")}>
        <h5>{t("medien.ui.wahrnehmung")}</h5>
        <p>
          {wahr.quelle === "rohdaten"
            ? t("medien.ui.wahrnehmung_rohdaten", { wert: nf(wahr.wert), bis: (wahr.rohdatenBis ?? world.day) - world.day })
            : wahr.quelle === "institut"
              ? t("medien.ui.wahrnehmung_institut", { wert: nf(wahr.wert), institut: wahr.institut ?? "", tage: wahr.alterTage, streuung: nf(wahr.streuung) })
              : t("medien.ui.wahrnehmung_start", { wert: nf(wahr.wert) })}
        </p>
        {wahr.verbot && <p className="md-warn">{t("medien.ui.verbot")}</p>}
        {wahr.schublade && <p className="md-hinweis">{t("medien.ui.schublade", { institut: wahr.schublade })}</p>}
        <div className="md-aktion-fuss">
          <span className="md-hinweis">
            {rohdaten && world.day <= rohdaten.bisTag
              ? world.day >= rohdaten.bereitTag
                ? t("medien.rohdaten.laeuft", { bis: rohdaten.bisTag - world.day })
                : t("medien.rohdaten.bestellt", { tage: rohdaten.bereitTag - world.day })
              : t("medien.ui.rohdaten_preis", { kapital: ROHDATEN.kapital, aufmerksamkeit: ROHDATEN.aufmerksamkeit, wartetage: ROHDATEN.wartetage, gueltig: ROHDATEN.gueltigTage })}
          </span>
          <button type="button" className="pd-btn" disabled={!!rohdaten && world.day <= rohdaten.bisTag} onClick={() => neu(rohdatenKaufen(world))}>
            {t("medien.ui.rohdaten_kaufen")}
          </button>
        </div>
      </section>

      <section className="md-tableau" aria-label={t("medien.ui.tableau")}>
        <h4>{t("medien.ui.tableau")}</h4>
        <ul className="md-karten">
          {MEDIEN_CLUSTER.map((c) => {
            const z = m.cluster[c.id]!;
            const lizenz = lizenzVon(world, c.id);
            const start = startSelbstzensur(c);
            const reich = reichweiteJetzt(world, c.id);
            const grund = sperrGrund(world, c.id);
            return (
              <li key={c.id}>
                <button type="button" className={`md-karte${c.id === gewaehlt ? " on" : ""}`} aria-pressed={c.id === gewaehlt} onClick={() => setGewaehlt(c.id)}>
                  <span className="md-karte-kopf">
                    <strong>{blattDef(c.id).name}</strong>
                    <em>{c.name}</em>
                  </span>
                  <span className="md-marken">
                    <span className={`md-lizenz ${lizenz}`}>{lizenz === "gesperrt" && z.gesperrtBis !== undefined && z.gesperrtBis > world.day ? t("medien.lizenz.gesperrt_bis", { tage: z.gesperrtBis - world.day }) : t(`medien.lizenz.${lizenz}`)}</span>
                    <span className="md-eigentuemer">{t(`medien.eigentuemer.${z.eigentuemer}`)}</span>
                    {z.gekippt && <span className="md-tag">{t("medien.ui.gekippt")}</span>}
                    {z.uebernommen && <span className="md-tag">{t("medien.ui.uebernommen")}</span>}
                    {z.maertyrer >= 15 && <span className="md-tag">{t("medien.ui.maertyrer")}</span>}
                  </span>
                  <Balken ueberschrift={t("medien.ui.reichweite")} wert={Math.min(100, reich * 100 * 0.8)} start={80} text={`${Math.round(reich * 100)} %`} />
                  <Balken ueberschrift={t("medien.ui.selbstzensur")} wert={z.selbstzensur} start={start} text={`${Math.round(z.selbstzensur)}`} />
                  <Balken ueberschrift={t("medien.ui.abhaengigkeit")} wert={z.abhaengigkeit} text={`${Math.round(z.abhaengigkeit)}`} />
                  {grund && <span className="md-grund">{t(`medien.sperre.${grund}`)}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="md-aktionen" aria-label={t("medien.ui.eingriffe")}>
        <h4>{t("medien.ui.eingriffe_bei", { blatt: blattDef(cluster.id).name })}</h4>
        <p className="md-hinweis">{t("medien.ui.eingriffe_text")}</p>
        {pk && (
          <ul className="md-aktionen-liste">
            <AktionKarte a={pk} />
          </ul>
        )}
        <h5>{t("medien.ui.gruppe_druck")}</h5>
        <ul className="md-aktionen-liste">
          {liste(DRUCK).map((a) => (
            <AktionKarte key={a.aktion} a={a} />
          ))}
          {liste(DRUCK).length === 0 && <li className="md-hinweis">{t("medien.ui.keine_aktion")}</li>}
        </ul>
        <h5>{t("medien.ui.gruppe_zuwendung")}</h5>
        <ul className="md-aktionen-liste">
          {liste(ZUWENDUNG).map((a) => (
            <AktionKarte key={a.aktion} a={a} />
          ))}
          {liste(ZUWENDUNG).length === 0 && <li className="md-hinweis">{t("medien.ui.keine_aktion")}</li>}
        </ul>
      </section>

      <section className="md-regler" aria-label={t("medien.ui.dauerkanaele")}>
        <h4>{t("medien.ui.dauerkanaele")}</h4>
        <p className="md-hinweis">{t("medien.ui.dauerkanaele_text")}</p>
        <ul>
          <li>
            <span>{t("medien.ui.regler_aufsicht")}</span>
            <strong>{Math.round(aufsicht)}</strong>
          </li>
          <li>
            <span>{t("medien.ui.regler_internet")}</span>
            <strong>{Math.round(internet)}</strong>
          </li>
          <li>
            <span>{t("medien.ui.regler_staatsmedien")}</span>
            <strong>{Math.round(staatsmedien)}</strong>
          </li>
        </ul>
      </section>

      <section className="md-verlauf" aria-label={t("medien.ui.verlauf")}>
        <h4>{t("medien.ui.verlauf")}</h4>
        {verlaufEintraege.length === 0 && <p className="md-hinweis">{t("medien.ui.verlauf_leer")}</p>}
        <ul>
          {verlaufEintraege.map((e, i) => (
            <li key={`${e.tag}-${i}`}>
              <span className="md-wann">{formatDateDe(e.datum)}</span>
              <span>{e.text}</span>
              <span className={`md-rsf-delta${e.rsf > 0 ? " minus" : e.rsf < 0 ? " plus" : ""}`}>{e.rsf === 0 ? "" : `${e.rsf > 0 ? "−" : "+"}${nf(Math.abs(e.rsf))}`}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
