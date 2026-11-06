// Stätten pflegen (Befund F-1, Nacht N6): oben die Karte aller Stätten, gefärbt nach Zustand; darunter Filter und ein Raster kleiner Kacheln,
// rechts die volle Karte der gewählten Stätte mit Restaurieren. Vorher standen 53 große Karten untereinander (9,4 Bildschirme), und jede nannte
// „Kulturerbe in dieser Provinz: 55 von 100“, in jeder Provinz derselbe Wert (F-5); diese Zeile entfällt.
// Voreingestellt sind die gefährdeten Stätten; die Karte zeigt immer alle und lässt jede anklicken.

import { useState } from "react";
import type { World } from "../../sim/types";
import { ERBE, KIRCHEN_DER_OFFENBARUNG, type Erbe } from "../../data/erbe";
import { beginne, erhaltung, reichZustand, STAETTE_AKUT, vorhabenDef, wirkungsVorschau, type Platz } from "../../sim/reich";
import { PROV, BREITE, HOEHE } from "../atlas/Karte2D";
import { Zeilen } from "./Pflege";
import { PlatzWahl } from "./Platz";
import { t, zahl } from "../../i18n";
import "./staetten.css";

// Dieselbe Projektion wie die 2D-Karte (ui/atlas/Karte2D.tsx), damit die Punkte auf den Provinzflächen liegen
const LON0 = 25.4, LAT0 = 42.4, K = 40, KY = K * 1.27;
const px = (lon: number, lat: number): [number, number] => [(lon - LON0) * K, (LAT0 - lat) * KY];

const SERIEN = ["gefaehrdet", "alle", "welterbe", "kirchen7", "seldschuken", "sinan", "tas_tepeler", "byzanz", "vielvoelker"] as const;
type Serie = (typeof SERIEN)[number];

const ton = (z: number): string => (z < 30 ? "verfall" : z < STAETTE_AKUT ? "schlecht" : z < 70 ? "maessig" : "gut");

function Detail({ world, e, refresh }: { world: World; e: Erbe; refresh: () => void }) {
  const z = reichZustand(world);
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string } | null>(null);
  const [platz, setPlatz] = useState<Platz>("ende");
  const st = z.staetten[e.id]!;
  const id = `restaurierung_${e.id}`;
  const def = vorhabenDef(id);
  const lauf = z.laufend.find((l) => l.id === id);
  const hub = def?.abschluss.find((x) => x.t === "staette");
  const nach = hub && hub.t === "staette" ? Math.min(100, st.zustand + hub.d) : undefined;
  const vor = def ? wirkungsVorschau(world, id) : null;
  const folgen = (vor?.sofort ?? []).filter((x) => !x.text.startsWith(e.name));
  const restauriere = () => {
    const r = beginne(world, id, "ausschreibung", platz);
    setAntwort({ ok: r.ok, text: r.why ? `${r.text}` : r.text });
    refresh();
  };
  return (
    <article className={`st-detail ${ton(st.zustand)}`}>
      <header>
        <h4>{e.name}</h4>
        <span className="st-ort">{e.ort}</span>
        <span className="st-plaketten">
          {e.unesco.status === "welterbe" && st.lage !== "gestrichen" && <span className="rr-plakette" title={t("ui2.ui.Reich.2e2e824", { p0: e.unesco.jahr ?? "" })}>{t("ui2.ui.Reich.8c5c22e")}</span>}
          {st.lage && <span className={`rr-plakette st-lage ${st.lage}`} title={t(`welle_h3.st.lage.${st.lage}.titel`)}>{t(`welle_h3.st.lage.${st.lage}`)}</span>}
          {e.kirche7 && <span className="rr-plakette kirche" title={t("ui.Reich.b39ebe5")}>{t("ui2.ui.Reich.b2c752c")}</span>}
        </span>
      </header>
      <p className="st-satz">{e.satz}</p>
      <div className="rr-zustand">
        <span>{t("ui2.ui.Reich.97574a9")}</span>
        <span className="rr-balken" aria-hidden>
          <i style={{ width: `${st.zustand}%` }} className={st.zustand < 40 ? "schwach" : ""} />
          {nach !== undefined && !lauf && <b className="st-ziel" style={{ left: `${nach}%` }} />}
        </span>
        <b>{Math.round(st.zustand)}</b>
      </div>
      <p className="rp-satz">{st.zustand < 30 ? t("ui2.ui.Reich.64becd1") : st.zustand < 50 ? t("ui2.ui.Reich.628669a") : st.zustand < 70 ? t("ui2.ui.Reich.8db82ca") : t("ui2.ui.Reich.1ba54c0")}</p>
      {lauf ? (
        <p className="rp-satz">{t("ui.Reich.b1cebac")}</p>
      ) : st.zustand > 82 ? (
        <p className="rp-satz rp-nicht">{t("ui.Reich.27320b7")}</p>
      ) : (
        def && (
          <div className="rp-eingriff">
            <p className="rp-satz">
              {t("ui2.ui.Reich.b2936db", { p0: Math.round(st.zustand) })} {nach !== undefined ? Math.round(nach) : "?"}.{folgen.length > 0 ? t("ui2.ui.Reich.2d8fdd0") : ""}
            </p>
            <Zeilen zeilen={folgen} />
            <p className="st-preis">{t("reich.pflege.kosten", { pk: zahl(def.kosten.pk), bau: zahl(def.kosten.bau), monate: def.kosten.monate })}</p>
            <PlatzWahl world={world} v={def} platz={platz} onPlatz={setPlatz} />
            <button type="button" className="aktion-knopf rr-beginnen" onClick={restauriere} title={def.kehrseite}>
              {t("ui2.ui.Reich.e0e3ae0")}
            </button>
            <p className="rr-kehrseite"><b>{t("ui2.ui.reich.Pflege.0289c3f")}</b> {def.kehrseite}</p>
          </div>
        )
      )}
      {antwort && <p className={`rr-ergebnis ${antwort.ok ? "ok" : "nein"}`} role="status">{antwort.text}</p>}
    </article>
  );
}

export function StaettenAtlas({ world, refresh, start }: { world: World; refresh: () => void; /** Vorgewählte Stätte (ein Vorgang führt dorthin, Welle H3) */ start?: string }) {
  const z = reichZustand(world);
  const zustandVon = (e: Erbe) => z.staetten[e.id]?.zustand ?? 0;
  const gefaehrdet = ERBE.filter((e) => zustandVon(e) < STAETTE_AKUT);
  const startE = start ? ERBE.find((e) => e.id === start) : undefined;
  const [serie, setSerie] = useState<Serie>(startE ? (zustandVon(startE) < STAETTE_AKUT ? "gefaehrdet" : "alle") : gefaehrdet.length ? "gefaehrdet" : "alle");
  const sortiert = [...ERBE].sort((a, b) => zustandVon(a) - zustandVon(b));
  const [gewaehlt, setGewaehlt] = useState<string>(startE?.id ?? sortiert[0]?.id ?? "");
  const inSerie = (e: Erbe, s: Serie) =>
    s === "alle" ? true : s === "gefaehrdet" ? zustandVon(e) < STAETTE_AKUT : s === "welterbe" ? e.unesco.status === "welterbe" : (e.serien ?? []).includes(s as never);
  const liste = sortiert.filter((e) => inSerie(e, serie));
  const detail = ERBE.find((e) => e.id === gewaehlt) ?? liste[0];
  const sieben = KIRCHEN_DER_OFFENBARUNG.map((k) => z.staetten[k.id]?.zustand ?? 0);
  const laeuft = new Set(z.laufend.map((l) => l.id));
  return (
    <section className="rr-abschnitt st-atlas">
      <h4>
        {t("ui2.ui.Reich.51ae0fa")} <em>{t("ui2.ui.Reich.9219dc0", { p0: Math.round(erhaltung(world)) })} · {t("n6.st.gefaehrdetZahl", { n: gefaehrdet.length })}</em>
      </h4>
      <div className="st-unten">
        <div className="st-liste">
      <div className="st-oben">
        <svg className="st-karte" viewBox={`-10 -10 ${BREITE + 20} ${HOEHE + 20}`} role="img" aria-label={t("n6.st.karteAria")}>
          {PROV.map((p) => (
            <path key={p.plaka} d={p.d} className={detail?.plaka === p.plaka ? "gewaehlt" : ""}>
              <title>{p.name}</title>
            </path>
          ))}
          {sortiert.map((e) => {
            const [x, y] = px(e.lon, e.lat);
            const zz = zustandVon(e);
            return (
              <g key={e.id} className={`st-punkt ${ton(zz)}${e.id === detail?.id ? " on" : ""}${inSerie(e, serie) ? "" : " aus"}`} transform={`translate(${x.toFixed(1)},${y.toFixed(1)})`} onClick={() => setGewaehlt(e.id)}>
                <circle r={e.id === detail?.id ? 10 : 7} />
                {laeuft.has(`restaurierung_${e.id}`) && <circle className="bau" r={13} />}
                <title>{`${e.name}: ${Math.round(zz)}`}</title>
              </g>
            );
          })}
        </svg>
        <ul className="st-legende" aria-hidden>
          {(["verfall", "schlecht", "maessig", "gut"] as const).map((k) => <li key={k} className={k}><i />{t(`n6.st.ton.${k}`)}</li>)}
        </ul>
      </div>
          <div className="rr-filter rr-themen" role="group" aria-label={t("ui.Reich.4825f35")}>
            {SERIEN.map((s) => {
              const n = ERBE.filter((e) => inSerie(e, s)).length;
              if (!n) return null;
              return (
                <button key={s} type="button" className={serie === s ? "on" : ""} aria-pressed={serie === s} onClick={() => setSerie(s)}>
                  {t(`n6.st.serie.${s}`)} <b>{n}</b>
                </button>
              );
            })}
          </div>
          {serie === "kirchen7" && <p className="rr-hinweis">{t("ui2.ui.Reich.171fd85", { p0: Math.round(Math.min(...sieben)) })}</p>}
          <ul className="st-raster">
            {liste.map((e) => {
              const zz = zustandVon(e);
              return (
                <li key={e.id}>
                  <button type="button" className={`st-kachel ${ton(zz)}${e.id === detail?.id ? " on" : ""}`} aria-pressed={e.id === detail?.id} onClick={() => setGewaehlt(e.id)}>
                    <span className="st-name">{e.name}</span>
                    <span className="st-mini" aria-hidden><i style={{ width: `${zz}%` }} /></span>
                    <span className="st-wert">{laeuft.has(`restaurierung_${e.id}`) ? t("n6.st.laeuft") : Math.round(zz)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <aside className="st-seite" aria-live="polite">{detail && <Detail key={detail.id} world={world} e={detail} refresh={refresh} />}</aside>
      </div>
    </section>
  );
}
