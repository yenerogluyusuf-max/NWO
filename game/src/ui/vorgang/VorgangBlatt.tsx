// Das Vorgangsblatt: ein politisches Vorhaben an einer Stelle (sim/vorgaenge.ts).
// Oben die offene Entscheidung, dann der Zeitstrahl aller Schritte, Personen mit Gesicht, der Ort, die Begründung des Spielers
// und am Ende die Rechenschaft mit getrennten Modellannahmen und beobachteten Spielwerten.

import { useState } from "react";
import { aktuelleLocale, t } from "../../i18n";
import { PROVINZEN } from "../../sim/regional";
import { figur } from "../../sim/figuren";
import { SCHRITTE, buergermeisterPartei, entscheideVorgang, erwartung, offenerKonflikt, restTage, schrittAnteil, wegeFuer, zweiterAbschnitt, type Vorgang, type VorgangSchritt } from "../../sim/vorgaenge";
import type { World } from "../../sim/types";
import { Portraet } from "../personen/bausteine";
import "./vorgang.css";

const nf = (x: number) => x.toLocaleString(aktuelleLocale(), { maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: "exceptZero" });

export function schrittIndex(v: Vorgang): number {
  if (v.schritt === "abgeschlossen") return SCHRITTE.length;
  if (v.schritt === "aufgegeben") return -1;
  return SCHRITTE.indexOf(v.schritt);
}

/** Datum, an dem ein Schritt erreicht wurde (aus der Chronik). */
const monat = (d: string | undefined): string | undefined => (d ? new Date(d).toLocaleDateString(aktuelleLocale(), { month: "short", year: "numeric" }) : undefined);
const erreicht = (v: Vorgang, s: VorgangSchritt): string | undefined => monat(v.verlauf.find((e) => e.k === `vorgang.log.schritt.${s}`)?.datum ?? (s === "planung" ? v.verlauf[0]?.datum : undefined));

export function VorgangBlatt({ w, v, onGeaendert }: { w: World; v: Vorgang; onGeaendert?: () => void }) {
  const [meldung, setMeldung] = useState<string | null>(null);
  const [satz, setSatz] = useState(v.begruendung ?? "");
  const k = offenerKonflikt(v);
  const f = figur(w, v.zustaendig);
  const ort = PROVINZEN[v.plaka - 1]?.name ?? String(v.plaka);
  const idx = schrittIndex(v);
  const e = erwartung(v);
  const kap = w.spiel?.kapital ?? 0;
  const fin = figur(w, "finanzen");
  const rest = restTage(w, v);
  const waehle = (weg: Parameters<typeof entscheideVorgang>[2]) => {
    const r = entscheideVorgang(w, v.id, weg, satz.trim() || undefined);
    setMeldung(r.text);
    onGeaendert?.();
  };
  return (
    <article className="vg-blatt" aria-label={t("vorgang.ui.titel", { ort })}>
      <header className="vg-kopf">
        <div>
          <p className="vg-kicker">{t(`vorgang.ui.ursprung.${v.ursprung.art}`)}</p>
          <h3>{t("vorgang.ui.titel", { ort })}</h3>
          <p className="vg-unter">{t("vorgang.ui.umfang", { n: v.wohnungen, ort })}</p>
        </div>
        {v.schritt === "aufgegeben" && <span className="vg-stempel">{t("vorgang.ui.aufgegeben")}</span>}
      </header>

      {k && (
        <section className="vg-entscheidung" aria-live="polite">
          <h4>{t(`vorgang.ui.konflikt.${k.art}`, { ort, partei: buergermeisterPartei(w, v.plaka) })}</h4>
          <figure className="vg-gegen">
            {k.art === "finanzierung" && fin ? <Portraet w={w} f={fin} size={64} /> : <span className="vg-wappen" aria-hidden>{ort.slice(0, 1)}</span>}
            <figcaption>
              <blockquote>{t(`vorgang.ui.zitat.${k.art}`, { n: v.wohnungen, ort })}</blockquote>
              <cite>{k.art === "finanzierung" && fin ? `${fin.name}, ${fin.rolle}` : t("vorgang.ui.buergermeister", { ort, partei: buergermeisterPartei(w, v.plaka) })}</cite>
            </figcaption>
          </figure>
          <p className="vg-frist">{t("vorgang.ui.frist", { tage: Math.max(0, k.frist - w.day) })}</p>
          {!v.begruendung && (
            <label className="vg-satz">
              <span>{t("vorgang.ui.begruendung_frage")}</span>
              <input value={satz} maxLength={140} onChange={(ev) => setSatz(ev.target.value)} placeholder={t("vorgang.ui.begruendung_platz")} />
            </label>
          )}
          <div className="vg-wege">
            {wegeFuer(w, v).map((s) => (
              <button key={s.id} type="button" className="vg-weg" disabled={!!s.grund || kap + 20 < s.pk} onClick={() => waehle(s.id)} title={s.grund ?? ""}>
                <b>{t(`vorgang.ui.weg.${s.id}`)}</b>
                <span>{t(s.k, s.p)}</span>
                <i>{s.pk > 0 ? t("vorgang.ui.preis", { pk: s.pk }) : t("vorgang.ui.kostenlos")}</i>
              </button>
            ))}
          </div>
          {meldung && <p className="vg-meldung" role="status">{meldung}</p>}
        </section>
      )}

      {v.rechenschaft && (
        <section className="vg-rechenschaft">
          <h4>{t("vorgang.ui.rechenschaft")}</h4>
          <p className="vg-urteil">{t(`vorgang.urteil.${v.rechenschaft.zuordnung}`)}</p>
          <ul className="vg-drei">
            <li>{t("vorgang.ui.kurz.erwartet", { wn: nf(v.rechenschaft.erwartet.wohnungsnot) })} <em>{t("vorgang.ui.modell")}</em></li>
            <li>{t("vorgang.ui.kurz.eingetreten", { wn: nf(v.rechenschaft.eingetreten.wohnungsnot), mi: nf(v.rechenschaft.eingetreten.mieten) })} <em>{t("vorgang.ui.beobachtet")}</em></li>
            <li>{t("vorgang.ui.kurz.eigen", { wn: nf(v.rechenschaft.eigen.wohnungsnot) })} <em>{t("vorgang.ui.modell")}</em></li>
          </ul>
          <details className="vg-details">
            <summary>{t("vorgang.ui.details")}</summary>
          <table>
            <thead>
              <tr>
                <th />
                <th>{t("vorgang.ui.spalte.wohnungsnot")}</th>
                <th>{t("vorgang.ui.spalte.mieten")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>{t("vorgang.ui.zeile.erwartet")} <em>{t("vorgang.ui.modell")}</em></th>
                <td>{nf(v.rechenschaft.erwartet.wohnungsnot)}</td>
                <td>{nf(v.rechenschaft.erwartet.mieten)}</td>
              </tr>
              <tr>
                <th>{t("vorgang.ui.zeile.eingetreten")} <em>{t("vorgang.ui.beobachtet")}</em></th>
                <td>{nf(v.rechenschaft.eingetreten.wohnungsnot)}</td>
                <td>{nf(v.rechenschaft.eingetreten.mieten)}</td>
              </tr>
              <tr>
                <th>{t("vorgang.ui.zeile.eigen")} <em>{t("vorgang.ui.modell")}</em></th>
                <td>{nf(v.rechenschaft.eigen.wohnungsnot)}</td>
                <td>{nf(v.rechenschaft.eigen.mieten)}</td>
              </tr>
            </tbody>
          </table>
          <p className="vg-zuordnung">{t(`vorgang.zuordnung.${v.rechenschaft.zuordnung}`)}</p>
          {v.rechenschaft.mitgewirkt.length > 0 && (
            <>
              <h5>{t("vorgang.ui.mitgewirkt")}</h5>
              <ul>
                {v.rechenschaft.mitgewirkt.map((m, i) => (
                  <li key={i}>{t(m.k, m.p)}</li>
                ))}
              </ul>
            </>
          )}
          </details>
          {!v.rechenschaft.korrektur.includes("keine") && (
            <>
              <h5>{t("vorgang.ui.korrektur")}</h5>
              <ul>
                {v.rechenschaft.korrektur.map((c) => (
                  <li key={c}>{t(`vorgang.ui.korrektur.${c}`)}</li>
                ))}
              </ul>
            </>
          )}
          {v.rechenschaft.korrektur.includes("bauabschnitt") && (
            <button
              type="button"
              className="brass-button"
              onClick={() => {
                setMeldung(zweiterAbschnitt(w, v.id).text);
                onGeaendert?.();
              }}
            >
              {t("vorgang.ui.abschnitt_knopf")}
            </button>
          )}
          {!k && meldung && <p className="vg-meldung" role="status">{meldung}</p>}
        </section>
      )}

      <ol className="vg-zeitstrahl">
        {SCHRITTE.map((s, i) => (
          <li key={s} className={`${i < idx ? "fertig" : i === idx ? "jetzt" : "offen"}${s === "bau" || s === "uebergabe" ? " moment" : ""}`}>
            <span className="vg-punkt" aria-hidden />
            <span>{t(`vorgang.ui.schritt.${s}`)}</span>
            {i <= idx && erreicht(v, s) && <small>{erreicht(v, s)}</small>}
            {i === idx && rest !== null && <i className="vg-fortschritt" aria-hidden><s style={{ width: `${Math.round(schrittAnteil(w, v) * 100)}%` }} /></i>}
          </li>
        ))}
      </ol>

      {!k && rest !== null && <p className="vg-laeuft">{t(`vorgang.ui.laeuft.${v.schritt}`, { monate: Math.max(1, Math.round(rest / 30)), ort })}</p>}

      <div className="vg-raster">
        <section>
          <h4>{t("vorgang.ui.personen")}</h4>
          <ul className="vg-personen">
            {f && (
              <li>
                <Portraet w={w} f={f} size={56} />
                <div>
                  <b>{f.name}</b>
                  <span>{t("vorgang.ui.zustaendig", { rolle: f.rolle })}</span>
                </div>
              </li>
            )}
            <li className="vg-person-text">
              <b>{t("vorgang.ui.rathaus", { ort })}</b>
              <span>{buergermeisterPartei(w, v.plaka)}</span>
            </li>
          </ul>
        </section>
        <section>
          <h4>{t("vorgang.ui.erwartung")}</h4>
          <p className="vg-modell">{t("vorgang.ui.modellannahme")}</p>
          <p>{t("vorgang.ui.erwartung_text", { wn: nf(e.wohnungsnot), mi: nf(e.mieten) })}</p>
          {v.finanzierung && <p>{t(`vorgang.ui.finanzierung.${v.finanzierung.weg}`, { name: v.finanzierung.verdraengt ?? "" })}</p>}
          {v.begruendung && <blockquote className="vg-begruendung">{v.begruendung}</blockquote>}
        </section>
      </div>

      <details className="vg-chronik">
        <summary>{t("vorgang.ui.chronik", { n: v.verlauf.length })}</summary>
        <ul>
          {v.verlauf.map((x, i) => (
            <li key={i}>
              <time>{x.datum}</time> {t(x.k, x.p)}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
