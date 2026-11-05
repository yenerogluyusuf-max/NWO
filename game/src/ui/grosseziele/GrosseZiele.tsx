// Ansicht „Große Ziele“ (ENTSCHEIDUNGEN Q, GROSSE_ZIELE_2026-11-04): je Ziel eine Bildkarte mit Stufe, Chance als Wort und Band,
// Gründen dafür und dagegen, Voraussetzungen, Wegen mit Preis, dem Versuch und den Botschaften bei den Partnern.

import { useState } from "react";
import { t, zahl } from "../../i18n";
import type { World } from "../../sim/types";
import {
  GROSSE_ZIELE, WEGE, ZIELE, chanceVon, geheWeg, grosseZiele, schwelleSicht, verfolge, verfolgeGrund, versuche, versuchGrund,
  vertretungAusbauen, vertretungGrund, vertretungVon, wegGrund, type WegId, type ZielDef,
} from "../../sim/grosseziele";
import { akteurName } from "../../sim/welt-modell";
import { WunderBild } from "../reich/WunderBild";
import { Preis } from "../akte/Zeichen";
import "../akte/zeichen.css";
import "./grosseziele.css";

const WEG_IDS: WegId[] = ["gipfel", "fonds", "kampagne"];

function ZielKarte({ w, z, geaendert, melde }: { w: World; z: ZielDef; geaendert: () => void; melde: (s: string) => void }) {
  const g = grosseZiele(w);
  const st = g.stand[z.id] ?? { stufe: 0, vorbereitung: 0, versuche: 0 };
  const verfolgt = g.verfolgt.includes(z.id);
  const fertig = st.stufe >= z.stufen.length;
  const stufe = z.stufen[st.stufe];
  const chance = fertig ? null : chanceVon(w, z.id);
  const schwelle = stufe ? schwelleSicht(w, stufe) : [];
  const tue = (r: { text: string }) => { melde(r.text); geaendert(); };
  const vGrund = verfolgeGrund(w, z.id), xGrund = versuchGrund(w, z.id);
  return (
    <article className={`gzz-karte${verfolgt ? " verfolgt" : ""}${fertig ? " fertig" : ""}`} aria-label={t(`gz2.ziel.${z.id}.titel`)}>
      <div className="gzz-bild">
        <WunderBild art={z.bild} zustand={fertig ? "fertig" : st.stufe > 0 ? "bau" : "entwurf"} fortschritt={st.stufe / z.stufen.length} />
        <span className="gz-klasse">{t(`gz2.bereich.${z.bereich}`)}</span>
        <ol className="gzz-stufen" aria-label={t("gz2.ui.stufe", { n: Math.min(st.stufe + 1, z.stufen.length), von: z.stufen.length })}>
          {z.stufen.map((s, i) => <li key={s.id} className={i < st.stufe ? "erreicht" : i === st.stufe ? "jetzt" : ""} title={t(`gz2.ziel.${z.id}.${s.id}`)} />)}
        </ol>
      </div>
      <div className="gzz-inhalt">
        <h3>{t(`gz2.ziel.${z.id}.titel`)}</h3>
        <p className="gzz-text">{t(`gz2.ziel.${z.id}.text`)}</p>
        {fertig ? <p className="gzz-fertig">{t("gz2.ui.erreicht")}</p> : (
          <>
            <p className="gzz-naechste">{t("gz2.ui.naechste", { stufe: t(`gz2.ziel.${z.id}.${stufe!.id}`) })}{st.abgeschwaecht ? ` · ${t("gz2.ui.abgeschwaecht")}` : ""}</p>
            {chance && (
              <div className={`gzz-chance ${chance.wort}`}>
                <strong>{t("gz2.ui.chance", { wort: t(`gz2.wort.${chance.wort}`), von: chance.von, bis: chance.bis })}</strong>
                <i aria-hidden><s style={{ left: `${chance.von}%`, width: `${chance.bis - chance.von}%` }} /></i>
                <div className="gzz-gruende">
                  {chance.dafuer.length > 0 && <p><b>{t("gz2.ui.dafuer")}:</b> {chance.dafuer.join(" · ")}</p>}
                  {chance.dagegen.length > 0 && <p><b>{t("gz2.ui.dagegen")}:</b> {chance.dagegen.join(" · ")}</p>}
                </div>
              </div>
            )}
            <details className="gzz-schwelle" open={verfolgt}>
              <summary>{t("gz2.ui.schwelle")}</summary>
              <ul>{schwelle.map((x) => <li key={x.text} className={x.erfuellt ? "ok" : "offen"}>{x.erfuellt ? "✓" : "○"} {x.text}</li>)}</ul>
            </details>
          </>
        )}
        {verfolgt && !fertig && (
          <div className="gzz-wege">
            <span className="gzz-kicker">{t("gz2.ui.wege")}{st.vorbereitung > 0 ? ` · ${t("gz2.ui.vorbereitung", { n: Math.round(st.vorbereitung) })}` : ""}</span>
            <div className="gzz-wegknoepfe">
              {WEG_IDS.map((weg) => {
                const grund = wegGrund(w, z.id, weg), def = WEGE[weg];
                return (
                  <button key={weg} type="button" className="gzz-weg" disabled={!!grund} title={grund ?? undefined} onClick={() => tue(geheWeg(w, z.id, weg))}>
                    <span>{t(`gz2.ui.weg.${weg}`)} <small>{t("gz2.ui.wegPlus", { n: def.vorbereitung })}</small></span>
                    <span className="gz-preise"><Preis r="pk" wert={String(def.pk)} /><Preis r="aufmerksamkeit" wert={String(def.aufmerksamkeit)} />{def.bip > 0 && <Preis r="geld" wert={zahl(def.bip, 1)} einheit={t("gz2.ui.bip")} />}</span>
                  </button>
                );
              })}
            </div>
            <div className="gzz-vertretungen">
              <span className="gzz-kicker">{t("gz2.ui.vertretungen")}</span>
              <ul>
                {z.partner.map((l) => {
                  const stufeV = vertretungVon(w, l), grund = vertretungGrund(w, l);
                  return (
                    <li key={l}>
                      <span>{akteurName(l)} · {t(`gz2.ui.vertretung.${stufeV}`)}</span>
                      {stufeV < GROSSE_ZIELE.vertretungMax && <button type="button" className="gz-knopf" disabled={!!grund} title={grund ?? undefined} onClick={() => tue(vertretungAusbauen(w, l))}>{t("gz2.ui.ausbauen")} · {GROSSE_ZIELE.vertretungPk} Kapital</button>}
                    </li>
                  );
                })}
              </ul>
            </div>
            {z.gegenspieler.length > 0 && <p className="gzz-gegen">{t("gz2.ui.gegenspieler", { laender: z.gegenspieler.map((l) => akteurName(l)).join(", ") })}</p>}
            <button type="button" className="leather-button gzz-versuch" disabled={!!xGrund} title={xGrund ?? undefined} onClick={() => tue(versuche(w, z.id))}>
              {t("gz2.ui.versuch")} · {stufe!.pk} Kapital
            </button>
            {xGrund && <p className="gz-hinweis">{xGrund}</p>}
          </div>
        )}
        <div className="gzz-aktion">
          {!fertig && (verfolgt
            ? <button type="button" className="gz-knopf" onClick={() => tue(verfolge(w, z.id, false))}>{t("gz2.ui.loslassen")}</button>
            : <button type="button" className="gz-knopf" disabled={!!vGrund} title={vGrund ?? undefined} onClick={() => tue(verfolge(w, z.id, true))}>{t("gz2.ui.verfolgen")} →</button>)}
          {!verfolgt && vGrund && <span className="gz-hinweis">{vGrund}</span>}
        </div>
      </div>
    </article>
  );
}

export function GrosseZiele({ world, geaendert }: { world: World; geaendert: () => void }) {
  const [meldung, setMeldung] = useState<string>();
  const [, neu] = useState(0);
  if (!world.spiel) return null;
  const g = grosseZiele(world);
  const fertig = () => { neu((n) => n + 1); geaendert(); };
  // Verfolgte Ziele zuerst
  const liste = ZIELE.slice().sort((a, b) => Number(g.verfolgt.includes(b.id)) - Number(g.verfolgt.includes(a.id)));
  return (
    <section className="gzz" aria-label={t("gz2.ui.titel")}>
      <p className="gzz-einleitung">{t("gz2.ui.einleitung", { max: GROSSE_ZIELE.maxVerfolgt, n: g.verfolgt.length })}</p>
      {meldung && <p role="status" className="rueckmeldung ok">{meldung}</p>}
      <div className="gzz-raster">
        {liste.map((z) => <ZielKarte key={z.id} w={world} z={z} geaendert={fertig} melde={setMeldung} />)}
      </div>
    </section>
  );
}
