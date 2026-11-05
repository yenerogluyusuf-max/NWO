// Parlament › Tagesordnung (Plan Oberfläche, Anhang A; ENTSCHEIDUNGEN W 2): Frage „Was wird wann abgestimmt, und reicht es?“.
// Eine Zeile je Vorlage mit Ja-Balken an der Mehrheitslinie, Termin und nur den Handlungen, die etwas ändern. Gesetze bringt man in
// der Politik ein (eine Eingangstür); hier stehen sie bis zur Abstimmung. Die Zahlen kommen aus sim/tagesordnung.ts.

import { useState } from "react";
import type { World } from "../../sim/types";
import { tagesordnung, type TagesordnungPunkt } from "../../sim/tagesordnung";
import { REGELN, gesetzPrognose, stimmenKaufen, zieheGesetzZurueck } from "../../sim/handeln";
import { formatDateDe } from "../../sim/dates";
import { t } from "../../i18n";
import "./tagesordnung.css";

type Ergebnis = { ok: boolean; text: string; why?: string };

function Balken({ p }: { p: TagesordnungPunkt }) {
  if (p.ja === undefined || p.schwelle === undefined) return null;
  const pct = (x: number) => `${Math.min(100, Math.max(0, (x / 600) * 100))}%`;
  return (
    <div className="to-balken" role="img" aria-label={t("to.balkenAria", { ja: p.ja, schwelle: p.schwelle })}>
      {p.tief !== undefined && p.hoch !== undefined && <span className="to-spanne" style={{ left: pct(p.tief), width: `calc(${pct(p.hoch)} - ${pct(p.tief)})` }} />}
      <span className={`to-ja to-${p.urteil ?? "knapp"}`} style={{ width: pct(p.ja) }} />
      <span className="to-linie" style={{ left: pct(p.schwelle) }} title={String(p.schwelle)} />
      {p.direkt !== undefined && <span className="to-linie to-direkt" style={{ left: pct(p.direkt) }} title={String(p.direkt)} />}
    </div>
  );
}

export function Tagesordnung({ world, refresh, onMassnahme, onHaushalt, onVerfassung, onPolitik }: {
  world: World;
  refresh: () => void;
  onMassnahme: (massnahme: string) => void;
  onHaushalt: () => void;
  onVerfassung: () => void;
  onPolitik: () => void;
}) {
  const [antwort, setAntwort] = useState<Ergebnis | null>(null);
  const punkte = tagesordnung(world);
  const sp = world.spiel;
  const tun = (r: Ergebnis) => {
    setAntwort(r);
    refresh();
  };
  return (
    <section className="to" aria-label={t("to.titel")}>
      {antwort && (
        <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}
      {punkte.length === 0 ? (
        <div className="to-leer">
          <p>{t("to.leer")}</p>
          <button type="button" className="pd-btn" onClick={onPolitik}>{t("to.zurPolitik")}</button>
        </div>
      ) : (
        <ol className="to-liste">
          {punkte.map((p) => {
            const g = p.art === "gesetz" ? sp?.gesetze.find((x) => x.id === p.gesetzId) : undefined;
            const gs = g ? gesetzPrognose(world, g) : undefined;
            const oeffne = p.art === "gesetz" && p.massnahme ? () => onMassnahme(p.massnahme!) : p.art === "haushalt" ? onHaushalt : p.art === "verfassung" ? onVerfassung : undefined;
            return (
              <li key={p.id} className={`to-zeile to-art-${p.art}${p.urteil ? ` to-${p.urteil}` : ""}`}>
                <div className="to-kopf">
                  <span className="to-art">{t(`to.art.${p.art}`)}</span>
                  {oeffne ? (
                    <button type="button" className="to-titel" onClick={oeffne}>{p.titel}</button>
                  ) : (
                    <strong className="to-titel">{p.titel}</strong>
                  )}
                  <span className="to-termin">{t(p.art === "gericht" ? "to.spruch" : "to.termin", { datum: formatDateDe(p.datum), n: p.tageBis })}</span>
                </div>
                <Balken p={p} />
                <div className="to-fuss">
                  {p.ja !== undefined && p.schwelle !== undefined ? (
                    <span className="to-zahl">
                      {t("to.erwartet", { ja: p.ja, schwelle: p.schwelle })}
                      {p.urteil === "knapp" && <b> · {t("to.knapp")}</b>}
                      {p.ja < p.schwelle && <b> · {t("to.fehlt", { n: p.schwelle - p.ja })}</b>}
                    </span>
                  ) : (
                    <span className="to-zahl">{t("to.gericht", { p: Math.round((p.p ?? 0) * 100) })}</span>
                  )}
                  {g && gs && gs.noetig > 0 && (
                    <button type="button" className="pd-btn primary" disabled={!gs.bezahlbar} onClick={() => tun(stimmenKaufen(world, g.id, gs.noetig))} title={gs.bezahlbar ? undefined : t("to.zuTeuer", { n: gs.kosten, da: Math.floor(sp?.kapital ?? 0) })}>
                      {t("to.sichern", { n: gs.noetig })} <b>{gs.kosten}</b>
                    </button>
                  )}
                  {g && (
                    <button type="button" className="pd-btn quiet" onClick={() => tun(zieheGesetzZurueck(world, g.id))}>
                      {t("to.zurueck", { n: Math.floor(g.pk * REGELN.rueckzugAnteil) })}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
