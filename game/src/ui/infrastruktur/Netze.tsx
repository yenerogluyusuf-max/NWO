// Die Netze des Landes: Auslastung je Netz, die größten Engpässe, Ausbau mit Preis und Dauer, Großinvestitionsprogramme.
// Gebaut wird über die Vorhaben des Reiches (sim/infrastruktur.ts legt sie an); diese Ansicht zeigt nur Lage und Angebot.

import { useMemo, useState } from "react";
import { t } from "../../i18n";
import {
  AUSBAUTEN,
  PAKETE,
  ausbauAngebot,
  finanzierung,
  investiere,
  netzSichten,
  paketAngebot,
  starteProgramm,
  type NetzId,
} from "../../sim/infrastruktur";
import { SCHWELLE } from "../../data/infrastruktur-netze";
import { VERGABE_NAMEN, type Vergabe } from "../../sim/reich-typen";
import type { World } from "../../sim/types";
import "./netze.css";

const prozent = (a: number): string => `${Math.round(a * 100)} %`;
const ton = (a: number): "gut" | "mittel" | "schlecht" => (a >= SCHWELLE.ueberlast ? "schlecht" : a >= SCHWELLE.voll ? "mittel" : "gut");

/** Balken der Auslastung: Füllung bis zum Wert, Marken bei „ausgelastet“ und „überlastet“ (Skala bis 140 %). */
function Balken({ a, start }: { a: number; start?: number }) {
  const breite = (x: number) => `${Math.min(100, (x / 1.4) * 100)}%`;
  return (
    <span className={`nz-balken nz-${ton(a)}`} aria-hidden>
      <i style={{ width: breite(a) }} />
      <b style={{ left: breite(SCHWELLE.voll) }} />
      <b className="nz-voll" style={{ left: breite(SCHWELLE.ueberlast) }} />
      {start !== undefined && <u style={{ left: breite(start) }} title={t("infra.ui.start")} />}
    </span>
  );
}

export function Netze({ world: w, onGeaendert }: { world: World; onGeaendert?: () => void }) {
  const [offen, setOffen] = useState<NetzId | null>(null);
  const [vergabe, setVergabe] = useState<Vergabe>("ausschreibung");
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [stand, setStand] = useState(0);
  const sichten = useMemo(() => (w.spiel ? netzSichten(w) : []), [w, w.day, stand]);
  if (!w.spiel) return null;
  const leerKosten = w.spiel.infrastruktur?.leerKosten ?? 0;
  const fin = finanzierung(w);
  const fertig = (r: { ok: boolean; text: string }) => {
    setMeldung({ ok: r.ok, text: r.ok ? t("infra.ui.begonnen", { text: r.text }) : r.text });
    setStand((x) => x + 1);
    if (r.ok) onGeaendert?.();
  };

  return (
    <div className="nz">
      <p className="nz-zweck">{t("infra.ui.zweck")}</p>
      <p className="nz-etat">
        {t(`infra.ui.etat.${fin.quelle}`, { stufe: fin.stufe > 0 ? `+${fin.stufe}` : String(fin.stufe) })}{" "}
        {fin.stufe !== 0 && t("infra.ui.etat.wirkung", { pk: Math.round((1 - fin.pk) * 100), schulden: Math.round((1 - fin.schulden) * 100) })}
      </p>
      <label className="nz-vergabe">
        {t("infra.ui.vergabe")}{" "}
        <select value={vergabe} onChange={(e) => setVergabe(e.target.value as Vergabe)}>
          {(Object.keys(VERGABE_NAMEN) as Vergabe[]).map((v) => (
            <option key={v} value={v}>
              {VERGABE_NAMEN[v]}
            </option>
          ))}
        </select>
      </label>
      {meldung && <p className={`nz-meldung ${meldung.ok ? "ok" : "nein"}`}>{meldung.text}</p>}

      <ul className="nz-liste">
        {sichten.map((s) => (
          <li key={s.id} className={`nz-netz ${offen === s.id ? "auf" : ""}`}>
            <button className="nz-kopf" onClick={() => setOffen(offen === s.id ? null : s.id)} aria-expanded={offen === s.id}>
              <span className="nz-name">{s.name}</span>
              <Balken a={s.mittel} start={s.start} />
              <span className={`nz-wert nz-${ton(s.mittel)}`}>{prozent(s.mittel)}</span>
              <span className="nz-zusatz">
                {s.engpaesse[0] && !s.land ? t("infra.ui.engpass", { ort: s.engpaesse[0].name, a: Math.round(s.engpaesse[0].a * 100) }) : ""}
                {s.laufend ? ` · ${t("infra.ui.laufend", { n: s.laufend })}` : ""}
              </span>
            </button>
            {offen === s.id && (
              <div className="nz-auf">
                <p className="nz-quelle">{t("infra.ui.quelle", { quelle: s.quelle })}</p>
                <table className="nz-tabelle">
                  <tbody>
                    {s.engpaesse.map((e) => (
                      <tr key={e.plaka}>
                        <th scope="row">{e.name}</th>
                        <td className={`nz-${ton(e.a)}`}>{prozent(e.a)}</td>
                        <td>
                          {AUSBAUTEN.filter((a) => a.netz === s.id).map((a) => {
                            const an = ausbauAngebot(w, a.id, e.plaka, vergabe);
                            return (
                              <button
                                key={a.id}
                                className="nz-knopf"
                                disabled={!an.ok}
                                title={an.ok ? t("infra.ui.angebot", { pk: an.pk ?? 0, monate: an.monate ?? 0, vorher: Math.round((an.vorher ?? 0) * 100), nachher: Math.round((an.nachher ?? 0) * 100) }) : an.grund}
                                onClick={() => fertig(investiere(w, a.id, e.plaka, vergabe))}
                              >
                                {t(`infra.ausbau.${a.id}.name`)}
                                {an.ok && <small>{t("infra.ui.preis", { pk: an.pk ?? 0, monate: an.monate ?? 0 })}</small>}
                              </button>
                            );
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </li>
        ))}
      </ul>

      <h4 className="nz-titel">{t("infra.ui.programme")}</h4>
      <ul className="nz-pakete">
        {PAKETE.map((p) => {
          const an = paketAngebot(w, p.id, vergabe);
          return (
            <li key={p.id} className="nz-paket">
              <strong>{t(`infra.paket.${p.id}.name`)}</strong>
              <span>{t(`infra.paket.${p.id}.text`)}</span>
              {an.ok ? (
                <span className="nz-paket-preis">
                  {t("infra.ui.paket.preis", { n: an.provinzen.length, pk: an.pk ?? 0, einzeln: an.einzelnPk ?? 0, monate: an.monate ?? 0, risiko: Math.round(p.ueberzug.p * 100) })}
                </span>
              ) : (
                <span className="nz-paket-preis">{an.grund}</span>
              )}
              <button className="nz-knopf" disabled={!an.ok} onClick={() => fertig(starteProgramm(w, p.id, vergabe))}>
                {t("infra.ui.paket.start")}
              </button>
            </li>
          );
        })}
      </ul>
      {leerKosten > 0 && <p className="nz-leer">{t("infra.ui.leer", { x: Math.round(leerKosten * 1200) / 100 })}</p>}
    </div>
  );
}

/** Die eine Zeile für die Land-Akte: größter Engpass und laufende Ausbauten (Fork AKTEN baut die Hülle). */
export function NetzeZeile({ world: w }: { world: World }) {
  if (!w.spiel) return null;
  const s = netzSichten(w);
  const top = s.flatMap((x) => (x.land ? [] : x.engpaesse.slice(0, 1).map((e) => ({ netz: x.name, ...e })))).sort((a, b) => b.a - a.a)[0];
  const laufend = s.reduce((n, x) => n + x.laufend, 0);
  return <span className="nz-zeile">{top ? t("infra.ui.zeile", { netz: top.netz, ort: top.name, a: Math.round(top.a * 100), n: laufend }) : ""}</span>;
}
