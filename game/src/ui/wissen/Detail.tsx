// Das Blatt eines Knotens: kurz vorn (Satz, Hindernis mit Sprung, Preis, Knöpfe), Einzelheiten aufklappbar.
// Jede fehlende Voraussetzung ist ein Sprungziel; eine zu niedrige Maßnahme lässt sich direkt hier anheben.

import { useState } from "react";
import { t } from "../../i18n";
import { BAUM, WERK_VON, ZWEIGE, type Lizenzgeber, type Traeger } from "../../data/wissensbaum";
import { beginnPreis, beginneKnoten, kaufeLizenz, knotenName, standortSichten, type KnotenSicht, type Sprung } from "../../sim/wissensbaum";
import { partnerGesperrt, type TempoTeile } from "../../sim/wissensbaum-kern";
import { bringeEin, pruefeVorhaben } from "../../sim/handeln";
import { PROVINZEN } from "../../sim/regional";
import type { World } from "../../sim/types";
import { Symbol, knotenSymbol } from "./symbole";

const TRAEGER: Traeger[] = ["staat", "firma", "ausland"];
const TEILE = ["forschung", "abwanderung", "schwerpunkt", "lizenz", "traeger", "standort", "heureka", "fokus"] as const;

/** Tempozeile: nur die Faktoren, die vom Normalfall abweichen. */
function tempoText(tp: TempoTeile): string {
  const teile = TEILE.filter((k) => {
    const x = (tp as unknown as Record<string, number | undefined>)[k];
    return x !== undefined && Math.abs(x - 1) >= 0.005;
  }).map((k) => t(`wissen.ui.tempoTeil.${k}`, { x: (tp as unknown as Record<string, number>)[k]! }));
  return teile.length ? `${t("wissen.ui.tempoGesamt", { gesamt: tp.gesamt })}: ${teile.join(" · ")}` : t("wissen.ui.tempoNurLand", { gesamt: tp.gesamt });
}

/** Beschriftung des Sprungs (wohin der Knopf führt). */
function sprungText(s: Sprung): string {
  switch (s.art) {
    case "knoten":
      return t("wissen.civ.sprung.knoten", { name: knotenName(s.id) });
    case "massnahme":
    case "netz":
      return t("wissen.civ.sprung.netz");
    case "bildung":
      return t("wissen.civ.sprung.bildung");
    case "land":
      return t("wissen.civ.sprung.land");
    case "vorhaben":
      return t("wissen.civ.sprung.vorhaben");
    case "kapital":
      return t("wissen.civ.sprung.kapitalKurz");
    case "verwaltung":
      return t("wissen.civ.sprung.verwaltungKurz");
  }
}

/** Direkt anheben: eine zu niedrige Maßnahme mit Preis, über den üblichen Weg (Erlass, wenn möglich und bezahlbar, sonst Gesetz). */
function AnhebenKnopf({ w, s, onGetan }: { w: World; s: Extract<Sprung, { art: "massnahme" }>; onGetan: (r: { ok: boolean; text: string }) => void }) {
  let pr: ReturnType<typeof pruefeVorhaben> | null = null;
  try {
    pr = pruefeVorhaben(w, s.id, s.ziel, null);
  } catch {
    pr = null;
  }
  if (!pr || !pr.ok || pr.aenderung <= 0) return null;
  const weg = pr.erlass.moeglich && pr.erlass.bezahlbar ? "erlass" : "gesetz";
  const pk = weg === "erlass" ? pr.erlass.pk : pr.gesetz.pk;
  const bezahlbar = weg === "erlass" ? pr.erlass.bezahlbar : pr.gesetz.bezahlbar;
  return (
    <button
      type="button"
      className="wb-knopf haupt wbf-anheben"
      disabled={!bezahlbar}
      title={t(`wissen.civ.anhebenWeg.${weg}`)}
      onClick={() => onGetan(bringeEin(w, s.id, s.ziel, null, weg))}
    >
      {t("wissen.civ.anheben", { stufe: s.ziel, pk, bip: pr.kostenBip, weg: t(`wissen.civ.weg.${weg}`) })}
    </button>
  );
}

export function Detail({
  w,
  k,
  onGetan,
  onZu,
  onSprung,
}: {
  w: World;
  k: KnotenSicht;
  onGetan: (r: { ok: boolean; text: string }) => void;
  onZu: () => void;
  onSprung?: (s: Sprung) => void;
}) {
  const werk = WERK_VON[k.id];
  const [traeger, setTraeger] = useState<Traeger>("staat");
  const [partner, setPartner] = useState<Lizenzgeber | undefined>(k.lizenzgeber[0]);
  const orte = k.zustand === "moeglich" ? standortSichten(w, k.id) : [];
  const [ort, setOrt] = useState<number | undefined>(werk?.standorte[0]?.plaka);
  const anderer = k.vorgaenger.filter((v) => !ZWEIGE.find((z) => z.id === k.zweig)!.knoten.includes(v));
  const optTraeger = werk ? { traeger, ...(traeger === "ausland" && partner ? { partner } : {}), ...(ort !== undefined ? { standort: ort } : {}) } : {};
  const selbst = beginnPreis(w, k.id, optTraeger);
  const ortName = (pl: number | undefined) => (pl === undefined ? "" : PROVINZEN[pl - 1]?.name ?? String(pl));
  const offen = k.voraus.filter((v) => !v.erfuellt);
  const mehr =
    !!werk || !!k.lizenz || !!k.traeger || !!k.tempo || (k.ungewiss && k.zustand !== "fertig") || (k.wunder && k.zustand !== "fertig") || (werk && k.zustand !== "moeglich" && k.standort !== undefined);

  return (
    <section className={`wb-detail z-${k.zustand}`} aria-live="polite">
      <header className="wb-detail-kopf">
        <div className="wbf-detail-titel">
          <span className={`wbf-k-rund b-${k.zweig}`}>
            <Symbol name={knotenSymbol(k.id, k.zweig)} gross={24} />
          </span>
          <div>
            <h3>{knotenName(k.id)}</h3>
            <p className="wb-detail-zweig">
              {t(`wissen.z.${k.zweig}.name`)} · {t(`wissen.ui.zustand.${k.zustand}`)}
            </p>
          </div>
        </div>
        <button type="button" className="wb-zu" onClick={onZu} aria-label={t("wissen.ui.schliessen")}>
          ×
        </button>
      </header>
      <p className="wb-detail-satz">{t(`wissen.n.${k.id}.satz`)}</p>

      {k.grund && (
        <div className={`wb-grund wb-grund-${k.hindernis ?? "sonst"}`}>
          <span>{k.grund}</span>
          {k.sprung?.art === "massnahme" && <AnhebenKnopf w={w} s={k.sprung} onGetan={onGetan} />}
          {k.sprung && onSprung && (
            <button type="button" className="wb-sprung" onClick={() => onSprung(k.sprung!)}>
              {sprungText(k.sprung)} →
            </button>
          )}
        </div>
      )}

      {k.zustand !== "fertig" && (
        <p className="wb-kosten">
          {k.zustand === "laeuft" && k.restMonate !== undefined ? t("wissen.ui.rest", { n: k.restMonate }) : t("wissen.ui.kosten", { pk: k.pk, monate: k.monate })}
          {k.zustand === "laeuft" && <span className="wbf-prozent"> · {Math.round(k.fortschritt * 100)} %</span>}
        </p>
      )}

      {k.heureka && k.zustand !== "fertig" && (
        <p className={`wb-hinweis wb-heureka${k.heureka.ausgeloest ? " ja" : ""}`}>
          <Symbol name="heureka" gross={13} /> {t("wissen.ui.heurekaZeile", { bedingung: k.heureka.text, tempo: BAUM.heurekaTempo })}{" "}
          {k.heureka.ausgeloest ? <b>{t("wissen.ui.heurekaJa")}</b> : k.heureka.erfuellt ? <b>{t("wissen.ui.heurekaBereit")}</b> : null}
        </p>
      )}

      {k.zustand === "moeglich" && (
        <div className="wb-wege">
          <div className="wb-knoepfe">
            <button type="button" className="wb-knopf haupt" disabled={!selbst.ok || !!k.grund} title={selbst.grund} onClick={() => onGetan(beginneKnoten(w, k.id, optTraeger))}>
              {t("wissen.ui.selbst", { pk: selbst.pk })}
            </button>
            {k.lizenzgeber.map((p) => {
              const pr = beginnPreis(w, k.id, { ...optTraeger, lizenz: p });
              return (
                <button key={p} type="button" className="wb-knopf" disabled={!pr.ok || !!k.grund} title={pr.grund ?? t("wissen.ui.lizenzText")} onClick={() => onGetan(beginneKnoten(w, k.id, { ...optTraeger, lizenz: p }))}>
                  {t("wissen.ui.lizenz", { land: t(`wissen.partner.${p}`), pk: pr.pk })}
                </button>
              );
            })}
          </div>
          {werk && (
            <details className="wb-aufklapp">
              <summary>
                {t("wissen.civ.werkWahl", {
                  ort: ortName(ort),
                  traeger: t(`wissen.traeger.${traeger}.name`),
                })}
              </summary>
              {orte.length > 1 && (
                <fieldset className="wb-traeger wb-standort">
                  <legend>{t("wissen.ui.standortWahl")}</legend>
                  {orte.map((o) => (
                    <label key={o.plaka} className={ort === o.plaka ? "auf" : ""}>
                      <input type="radio" name={`ort-${k.id}`} checked={ort === o.plaka} onChange={() => setOrt(o.plaka)} />
                      <span>
                        <b>{o.name}</b>
                        {o.hafen ? ` · ${t("wissen.ui.standortHafen")}` : ""} · {t("wissen.ui.standortTempo", { tempo: o.tempo })}
                        <br />
                        <small>
                          {[
                            o.strom !== null ? t("wissen.ui.standortStrom", { a: Math.round(o.strom * 100) }) : null,
                            o.wasser !== null && o.wasserIntensiv ? t("wissen.ui.standortWasser", { a: Math.round(o.wasser * 100) }) : null,
                            t("wissen.ui.standortFach", { fach: o.fach, land: o.fachLand }),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                        {o.engpass && (
                          <>
                            <br />
                            <small className="wb-engpass">{t("wissen.ui.standortEngpass")}</small>
                          </>
                        )}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
              <fieldset className="wb-traeger">
                <legend>{t("wissen.ui.traegerWahl")}</legend>
                {TRAEGER.filter((a) => a !== "ausland" || k.lizenzgeber.length > 0).map((a) => (
                  <label key={a} className={traeger === a ? "auf" : ""}>
                    <input type="radio" name={`tr-${k.id}`} checked={traeger === a} onChange={() => setTraeger(a)} />
                    <span>
                      <b>{t(`wissen.traeger.${a}.name`)}</b>
                      {a === "firma" && werk.firma ? ` · ${t("wissen.traeger.firma.mit", { firma: werk.firma.name })}` : ""}
                      <br />
                      <small>{t(`wissen.traeger.${a}.text`)}</small>
                    </span>
                  </label>
                ))}
                {traeger === "ausland" && (
                  <label className="wb-partner">
                    {t("wissen.ui.partner")}{" "}
                    <select value={partner} onChange={(e) => setPartner(e.target.value as Lizenzgeber)}>
                      {k.lizenzgeber.map((p) => (
                        <option key={p} value={p}>
                          {t(`wissen.partner.${p}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </fieldset>
              <p className="wb-hinweis">{t("wissen.ui.standortText")}</p>
            </details>
          )}
          {k.lizenzgeber.length > 0 && <p className="wb-hinweis">{t("wissen.ui.lizenzText")}</p>}
        </div>
      )}

      {k.zustand === "laeuft" && !k.lizenz && k.lizenzgeber.length > 0 && (
        <div className="wb-knoepfe">
          {k.lizenzgeber.map((p) => (
            <button key={p} type="button" className="wb-knopf" disabled={partnerGesperrt(w, p)} title={t("wissen.ui.lizenzText")} onClick={() => onGetan(kaufeLizenz(w, k.id, p))}>
              {t("wissen.ui.lizenzNach", { land: t(`wissen.partner.${p}`), pk: BAUM.lizenzPk })}
            </button>
          ))}
        </div>
      )}

      {k.voraus.length > 0 && (
        <details className="wb-voraus wb-aufklapp" open={k.zustand === "gesperrt" && offen.length > 1}>
          <summary>
            {t("wissen.ui.voraus")} {offen.length > 0 && <span className="wbf-offen">{t("wissen.civ.offenZahl", { n: offen.length })}</span>}
          </summary>
          <ul>
            {k.voraus.map((v, i) => (
              <li key={i} className={v.erfuellt ? "ja" : "nein"}>
                <span aria-hidden>{v.erfuellt ? "✓" : "✗"}</span>{" "}
                {!v.erfuellt && v.sprung && onSprung ? (
                  <button type="button" className="wb-sprung-zeile" onClick={() => onSprung(v.sprung!)} title={sprungText(v.sprung)}>
                    {v.text} →
                  </button>
                ) : (
                  v.text
                )}
              </li>
            ))}
          </ul>
          {anderer.length > 0 && <p className="wb-hinweis">{t("wissen.ui.anderer", { liste: anderer.map(knotenName) })}</p>}
        </details>
      )}

      {mehr && (
        <details className="wb-aufklapp">
          <summary>{t("wissen.civ.mehr")}</summary>
          {werk && (
            <p className="wb-werk">
              {werk.gut && t("wissen.ui.werkGut", { gut: t(`gueter.gut.${werk.gut.id}`) })}{" "}
              {werk.militaer?.length ? t("wissen.ui.werkMilitaer", { liste: werk.militaer.map((g) => t(`militaer.gattung.${g}`)) }) : null}
            </p>
          )}
          {k.ungewiss && k.zustand !== "fertig" && <p className="wb-hinweis">{t("wissen.ui.ungewiss")}</p>}
          {k.wunder && k.zustand !== "fertig" && <p className="wb-hinweis">{t("wissen.ui.wunder")}</p>}
          {k.lizenz && (
            <p className="wb-hinweis">
              {t("wissen.ui.mitLizenz", { land: t(`wissen.partner.${k.lizenz}`) })}
              {partnerGesperrt(w, k.lizenz) ? ` ${t("wissen.ui.gesperrtPartner", { land: t(`wissen.partner.${k.lizenz}`) })}` : ""}
            </p>
          )}
          {werk && k.zustand !== "moeglich" && k.standort !== undefined && <p className="wb-hinweis">{t("wissen.ui.standortIst", { ort: ortName(k.standort) })}</p>}
          {k.traeger && (
            <p className="wb-hinweis">
              {t(`wissen.traeger.${k.traeger.art}.kurz`)}
              {k.traeger.partner ? ` (${t(`wissen.partner.${k.traeger.partner}`)})` : ""}
            </p>
          )}
          {k.tempo && <p className="wb-tempozeile">{tempoText(k.tempo)}</p>}
        </details>
      )}
    </section>
  );
}
