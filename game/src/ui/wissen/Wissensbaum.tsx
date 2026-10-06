// Der Wissensbaum (sim/wissensbaum.ts): sechs Zweige, Knoten nach Spalten, Zustand auf einen Blick, Grund in einem Satz.
// Ein Klick auf einen Knoten zeigt Voraussetzungen, Preis und die Wege: selbst forschen, Lizenz, bei Werken der Träger.
// Ein frischer Durchbruch erscheint als Stempel.

import { useMemo, useState } from "react";
import { t } from "../../i18n";
import { BAUM, WERK_VON, ZWEIGE, type Lizenzgeber, type Traeger, type ZweigId } from "../../data/wissensbaum";
import { baumSicht, beginnPreis, beginneKnoten, kaufeLizenz, knotenName, setzeSchwerpunkt, standortSichten, type KnotenSicht } from "../../sim/wissensbaum";
import type { TempoTeile } from "../../sim/wissensbaum-kern";
import { PROVINZEN } from "../../sim/regional";
import { partnerGesperrt } from "../../sim/wissensbaum-kern";
import type { World } from "../../sim/types";
import "./wissensbaum.css";

const TRAEGER: Traeger[] = ["staat", "firma", "ausland"];
const TEILE = ["forschung", "abwanderung", "schwerpunkt", "lizenz", "traeger", "standort", "heureka"] as const;

/** Tempozeile: nur die Faktoren, die vom Normalfall abweichen. */
function tempoText(tp: TempoTeile): string {
  const teile = TEILE.filter((k) => {
    const x = (tp as unknown as Record<string, number | undefined>)[k];
    return x !== undefined && Math.abs(x - 1) >= 0.005;
  }).map((k) => t(`wissen.ui.tempoTeil.${k}`, { x: (tp as unknown as Record<string, number>)[k]! }));
  return teile.length ? `${t("wissen.ui.tempoGesamt", { gesamt: tp.gesamt })}: ${teile.join(" · ")}` : t("wissen.ui.tempoNurLand", { gesamt: tp.gesamt });
}

function Knoten({ k, auf, onWahl }: { k: KnotenSicht; auf: boolean; onWahl: () => void }) {
  return (
    <button
      type="button"
      className={`wb-knoten wb-${k.zustand}${auf ? " auf" : ""}${k.vorgaenger.length ? " wb-folgt" : ""}`}
      onClick={onWahl}
      aria-pressed={auf}
      title={k.grund ?? t(`wissen.n.${k.id}.satz`)}
    >
      <span className="wb-knoten-name">{knotenName(k.id)}</span>
      <span className="wb-knoten-zeile">
        <span className="wb-marke">{t(`wissen.ui.zustand.${k.zustand}`)}</span>
        {k.werk && <span className="wb-werk-marke">{t("wissen.ui.werk")}</span>}
        {k.lizenz && <span className="wb-lizenz-marke">{t(`wissen.partner.${k.lizenz}`)}</span>}
        {k.heureka?.ausgeloest && k.zustand !== "fertig" && <span className="wb-heureka-marke">{t("wissen.ui.heureka")}</span>}
        {k.zustand === "gesperrt" && k.hindernis && <span className={`wb-hindernis wb-h-${k.hindernis}`}>{t(`wissen.ui.h.${k.hindernis}`)}</span>}
      </span>
      {k.zustand === "laeuft" && (
        <span className="wb-fortschritt" aria-hidden>
          <i style={{ width: `${Math.round(k.fortschritt * 100)}%` }} />
        </span>
      )}
      {k.durchbruch && <span className="wb-stempel-klein">{t("wissen.ui.durchbruch")}</span>}
    </button>
  );
}

export function Detail({ w, k, onGetan, onZu }: { w: World; k: KnotenSicht; onGetan: (r: { ok: boolean; text: string }) => void; onZu: () => void }) {
  const werk = WERK_VON[k.id];
  const [traeger, setTraeger] = useState<Traeger>("staat");
  const [partner, setPartner] = useState<Lizenzgeber | undefined>(k.lizenzgeber[0]);
  const orte = k.zustand === "moeglich" ? standortSichten(w, k.id) : [];
  const [ort, setOrt] = useState<number | undefined>(werk?.standorte[0]?.plaka);
  const anderer = k.vorgaenger.filter((v) => !ZWEIGE.find((z) => z.id === k.zweig)!.knoten.includes(v));
  const optTraeger = werk ? { traeger, ...(traeger === "ausland" && partner ? { partner } : {}), ...(ort !== undefined ? { standort: ort } : {}) } : {};
  const selbst = beginnPreis(w, k.id, optTraeger);
  return (
    <section className="wb-detail" aria-live="polite">
      <header className="wb-detail-kopf">
        <div>
          <h3>{knotenName(k.id)}</h3>
          <p className="wb-detail-zweig">{t(`wissen.z.${k.zweig}.name`)} · {t(`wissen.ui.zustand.${k.zustand}`)}</p>
        </div>
        <button type="button" className="wb-zu" onClick={onZu} aria-label={t("wissen.ui.schliessen")}>×</button>
      </header>
      <p className="wb-detail-satz">{t(`wissen.n.${k.id}.satz`)}</p>
      {k.grund && <p className={`wb-grund wb-grund-${k.hindernis ?? "sonst"}`}>{k.grund}</p>}
      {k.zustand !== "fertig" && (
        <p className="wb-kosten">
          {k.zustand === "laeuft" && k.restMonate !== undefined ? t("wissen.ui.rest", { n: k.restMonate }) : t("wissen.ui.kosten", { pk: k.pk, monate: k.monate })}
        </p>
      )}
      {k.heureka && k.zustand !== "fertig" && (
        <p className={`wb-hinweis wb-heureka${k.heureka.ausgeloest ? " ja" : ""}`}>
          {t("wissen.ui.heurekaZeile", { bedingung: k.heureka.text, tempo: BAUM.heurekaTempo })}{" "}
          {k.heureka.ausgeloest ? <b>{t("wissen.ui.heurekaJa")}</b> : k.heureka.erfuellt ? <b>{t("wissen.ui.heurekaBereit")}</b> : null}
        </p>
      )}
      {k.ungewiss && k.zustand !== "fertig" && <p className="wb-hinweis">{t("wissen.ui.ungewiss")}</p>}
      {k.wunder && k.zustand !== "fertig" && <p className="wb-hinweis">{t("wissen.ui.wunder")}</p>}
      {werk && (
        <p className="wb-werk">
          {werk.gut && t("wissen.ui.werkGut", { gut: t(`gueter.gut.${werk.gut.id}`) })}{" "}
          {werk.militaer?.length ? t("wissen.ui.werkMilitaer", { liste: werk.militaer.map((g) => t(`militaer.gattung.${g}`)) }) : null}
        </p>
      )}
      {k.lizenz && <p className="wb-hinweis">{t("wissen.ui.mitLizenz", { land: t(`wissen.partner.${k.lizenz}`) })}{partnerGesperrt(w, k.lizenz) ? ` ${t("wissen.ui.gesperrtPartner", { land: t(`wissen.partner.${k.lizenz}`) })}` : ""}</p>}
      {werk && k.zustand !== "moeglich" && k.standort !== undefined && <p className="wb-hinweis">{t("wissen.ui.standortIst", { ort: PROVINZEN[k.standort - 1]?.name ?? String(k.standort) })}</p>}
      {k.traeger && <p className="wb-hinweis">{t(`wissen.traeger.${k.traeger.art}.kurz`)}{k.traeger.partner ? ` (${t(`wissen.partner.${k.traeger.partner}`)})` : ""}</p>}
      {k.tempo && (
        <p className="wb-tempozeile">{tempoText(k.tempo)}</p>
      )}
      <details className="wb-voraus" open={k.zustand === "gesperrt"}>
        <summary>{t("wissen.ui.voraus")}</summary>
        <ul>
          {k.voraus.map((v, i) => (
            <li key={i} className={v.erfuellt ? "ja" : "nein"}>
              <span aria-hidden>{v.erfuellt ? "✓" : "✗"}</span> {v.text}
            </li>
          ))}
        </ul>
        {anderer.length > 0 && <p className="wb-hinweis">{t("wissen.ui.anderer", { liste: anderer.map(knotenName) })}</p>}
      </details>

      {k.zustand === "moeglich" && (
        <div className="wb-wege">
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
                      ].filter(Boolean).join(" · ")}
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
              <p className="wb-hinweis">{t("wissen.ui.standortText")}</p>
            </fieldset>
          )}
          {werk && (
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
                      <option key={p} value={p}>{t(`wissen.partner.${p}`)}</option>
                    ))}
                  </select>
                </label>
              )}
            </fieldset>
          )}
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
    </section>
  );
}

export function Wissensbaum({ world: w, onGeaendert }: { world: World; onGeaendert?: () => void }) {
  const [stand, setStand] = useState(0);
  const [wahl, setWahl] = useState<string | null>(null);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [stempelZu, setStempelZu] = useState<string | null>(null);
  const sicht = useMemo(() => (w.spiel ? baumSicht(w) : null), [w, w.day, stand]);
  if (!w.spiel || !sicht) return null;
  const alle = sicht.zweige.flatMap((z) => z.knoten);
  const gewaehlt = wahl ? alle.find((k) => k.id === wahl) : undefined;
  const frisch = alle.find((k) => k.durchbruch && k.id !== stempelZu);
  const heurekaFrisch = frisch ? undefined : alle.find((k) => k.heureka?.frisch && k.zustand !== "fertig" && `h:${k.id}` !== stempelZu);
  const getan = (r: { ok: boolean; text: string }) => {
    setMeldung(r);
    setStand((x) => x + 1);
    if (r.ok) onGeaendert?.();
  };

  return (
    <div className="wb">
      <p className="wb-zweck">{t("wissen.ui.zweck")}</p>
      <div className="wb-lage">
        <div className={`wb-tempo${sicht.tempo.gesamt >= 1.15 ? " gut" : sicht.tempo.gesamt <= 0.85 ? " schlecht" : ""}`}>
          <span className="wb-tempo-wert">{t("wissen.ui.tempoWert", { tempo: sicht.tempo.gesamt })}</span>
          <span className="wb-tempo-name">{t("wissen.ui.tempo")}</span>
        </div>
        <div className="wb-lage-text">
          <p className="wb-satz">{sicht.satz}</p>
          <p className="wb-etat">
            {t("wissen.ui.etat", { budget: sicht.etat.budget, grenze: sicht.etat.grenze })}
            {sicht.abwanderung && <span className="wb-chip schlecht">{t("wissen.ui.abwanderung")}</span>}
          </p>
        </div>
      </div>

      <div className="wb-schwerpunkt" role="group" aria-label={t("wissen.ui.schwerpunkt")}>
        <span className="wb-schwerpunkt-name">{t("wissen.ui.schwerpunkt")}</span>
        {(["keiner", ...ZWEIGE.map((z) => z.id)] as ("keiner" | ZweigId)[]).map((id) => {
          const an = id === "keiner" ? sicht.schwerpunkt === null : sicht.schwerpunkt === id;
          return (
            <button
              key={id}
              type="button"
              className={`wb-chip${an ? " an" : ""}`}
              aria-pressed={an}
              disabled={an || sicht.schwerpunktSperre > 0}
              onClick={() => getan(setzeSchwerpunkt(w, id === "keiner" ? null : id))}
            >
              {id === "keiner" ? t("wissen.ui.keiner") : t(`wissen.z.${id}.name`)}
            </button>
          );
        })}
        <small className="wb-schwerpunkt-preis">
          {sicht.schwerpunktSperre > 0 ? t("wissen.ui.schwerpunktSperre", { tage: sicht.schwerpunktSperre }) : t("wissen.ui.schwerpunktPreis", { pk: BAUM.schwerpunktPk })}
        </small>
      </div>

      {meldung && <p className={`wb-meldung ${meldung.ok ? "ok" : "nein"}`}>{meldung.text}</p>}

      {frisch && (
        <div className="wb-durchbruch" role="status">
          <span className="wb-stempel">{t("wissen.ui.durchbruch")}</span>
          <span className="wb-durchbruch-text">{t("wissen.ui.durchbruchText", { name: knotenName(frisch.id) })}</span>
          <button type="button" className="wb-zu" onClick={() => setStempelZu(frisch.id)} aria-label={t("wissen.ui.schliessen")}>×</button>
        </div>
      )}

      {heurekaFrisch && (
        <div className="wb-durchbruch wb-heureka-banner" role="status">
          <span className="wb-stempel">{t("wissen.ui.heureka")}</span>
          <span className="wb-durchbruch-text">{t("wissen.ui.heurekaText", { name: knotenName(heurekaFrisch.id) })}</span>
          <button type="button" className="wb-zu" onClick={() => setStempelZu(`h:${heurekaFrisch.id}`)} aria-label={t("wissen.ui.schliessen")}>×</button>
        </div>
      )}

      <p className="wb-legende">{t("wissen.ui.legende")} · {t("wissen.ui.auswahl")}</p>
      <div className="wb-baum" aria-label={t("wissen.ui.zweige")}>
        {sicht.zweige.map((z) => {
          const spalten = Math.max(0, ...z.knoten.map((k) => k.spalte)) + 1;
          const nachSpalte = Array.from({ length: spalten }, (_, s) => z.knoten.filter((k) => k.spalte === s));
          return (
            <section key={z.id} className={`wb-zweig${z.schwerpunkt ? " schwerpunkt" : ""}`}>
              <header className="wb-zweig-kopf" title={t(`wissen.z.${z.id}.satz`)}>
                <h3>{t(`wissen.z.${z.id}.name`)}</h3>
                <span>{t("wissen.ui.fertigVon", { fertig: z.fertig, gesamt: z.knoten.length })}</span>
              </header>
              <div className="wb-scroll">
                <div className="wb-reihe">
                  {nachSpalte.map((ks, s) => (
                    <div key={s} className="wb-spalte">
                      {ks.map((k) => (
                        <Knoten key={k.id} k={k} auf={wahl === k.id} onWahl={() => { setWahl(wahl === k.id ? null : k.id); setMeldung(null); }} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {gewaehlt?.zweig === z.id && <Detail key={gewaehlt.id} w={w} k={gewaehlt} onGetan={getan} onZu={() => setWahl(null)} />}
            </section>
          );
        })}
      </div>

    </div>
  );
}
