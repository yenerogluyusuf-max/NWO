// Lage und Vorsorge: oben Bereitschaft und Gefahren als Ringe, die Karte der gefährdeten Provinzen und rechts die Folgen eines Falls
// in der angeklickten Provinz (ohne Vorsorge, heute, ausgebaut); darunter die Hebel der Vorsorge mit Preis und Wirkung. Alles aus dem Modell.

import { useState, type ReactNode } from "react";
import { PROV, BREITE, HOEHE } from "../atlas/Karte2D";
import "./gefahrenbild.css";
import type { World } from "../../sim/types";
import type { KatastrophenArt } from "../../sim/spiel-typen";
import { bringeEin } from "../../sim/handeln";
import {
  bereitSenkung,
  bereitschaft,
  KATASTROPHE,
  risikoUebersicht,
  szenario,
  type RisikoSicht,
} from "../../sim/katastrophe";
import type { Ziel } from "../schreibtisch/briefing";
import { hebel, nf, type HebelZeile } from "./daten";

import { t } from "../../i18n";
// ---------------------------------------------------------------------------

function HebelKarte({ h, w, refresh, melde, onGehe }: { h: HebelZeile; w: World; refresh: () => void; melde: (m: string) => void; onGehe?: (z: Ziel) => void }) {
  const laeuft = h.umsetzung < 100;
  return (
    <article className="kr-hebel">
      <header>
        <h4>{h.name}</h4>
        <span className="kr-chip">{t("ui2.ui.katastrophe.Lage.875014d", { p0: h.stufe })}</span>
      </header>
      <p className="kr-hebel-text">{h.text}</p>
      <div className="kr-hebel-stufen" aria-hidden>
        <div className="kr-balken">
          <i style={{ width: `${h.stufe}%` }} />
        </div>
        {!h.ausgeschoepft && <span className="ziel" style={{ left: `${h.ziel}%` }} />}
      </div>
      <p className="kr-hebel-schritt">
        {h.ausgeschoepft ? t("ui2.ui.katastrophe.Lage.4f775ff") : (
          <>
            {t("ui2.ui.katastrophe.Lage.4a5d07e", { p0: h.stufe })} <span aria-hidden>→</span> <strong>{h.ziel}</strong>
          </>
        )}
      </p>
      <ul className="kr-wirkung">
        {h.wirkung.map((x) => (
          <li key={x.auf}>
            {t("ui2.ui.katastrophe.Lage.67e5184")} <strong>{x.auf}</strong>
            {x.lag > 0 ? t("ui2.ui.katastrophe.Lage.7207a4e", { p0: x.lag, p1: x.lag === 1 ? "Monat" : "Monaten" }) : " sofort"}: {x.warum}
          </li>
        ))}
      </ul>
      {!h.ausgeschoepft && (
        <p className="kr-preis">
          <span>
            <b>{h.pk}</b> {t("ui2.ui.katastrophe.Lage.28d438e")}
          </span>
          <span>
            <b>{nf(h.bip, h.bip < 0.1 ? 3 : 2)}</b> {t("ui2.ui.katastrophe.Lage.fb307c6")}
          </span>
          <span>
            <b>{h.monate}</b> {h.monate === 1 ? t("ui2.ui.katastrophe.Lage.da13625") : t("ui2.ui.katastrophe.Lage.1c561ae")} {t("ui2.ui.katastrophe.Lage.2dd5af2")}
          </span>
        </p>
      )}
      {laeuft && (
        <p className="kr-umsetzung">
          {t("ui2.ui.katastrophe.Lage.964a093", { p0: h.umsetzung })}{h.restMonate ? t("ui2.ui.katastrophe.Lage.829dd4a", { p0: h.restMonate, p1: h.restMonate === 1 ? "Monat" : "Monate" }) : ""}.
        </p>
      )}
      {h.imParlament && <p className="kr-umsetzung">{t("ui2.ui.katastrophe.Lage.4a67db6")}</p>}
      {!h.moeglich && h.grund && <p className="kr-warn">{h.grund}</p>}
      {!h.ausgeschoepft && (
        <div className="kr-aktionen">
          <button
            type="button"
            className="kr-knopf haupt"
            disabled={!h.moeglich || !h.bezahlbar || h.imParlament}
            title={!h.bezahlbar ? t("ui2.ui.katastrophe.Lage.d5ee02f", { p0: h.pk, p1: Math.floor(w.spiel?.kapital ?? 0) }) : undefined}
            onClick={() => {
              const r = bringeEin(w, h.id, h.ziel, null, "gesetz");
              melde(r.why ? `${r.text} ${r.why}` : r.text);
              refresh();
            }}
          >
            {t("ui2.ui.katastrophe.Lage.abaa171")} <em>{t("ui2.ui.katastrophe.Lage.87b52bd", { p0: h.pk })}</em>
          </button>
          {onGehe && (
            <button type="button" className="kr-knopf" onClick={() => onGehe({ art: "politik", massnahme: { id: h.id, level: h.ziel } })}>
              {t("ui2.ui.katastrophe.Lage.d4cfbbf")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Gefahrenbild (Rundgang 05.11.2026, Muster der Netze): Ringe je Gefahr, Karte der gefährdeten Provinzen, rechts die Folgen eines Falls

const STUFEN_STAERKE = [0.5, 0.75, 0.95] as const;
const SZENARIO_ARTEN = new Set<KatastrophenArt>(["erdbeben", "flut", "waldbrand"]);

function Ring({ anteil, ton, children }: { anteil: number; ton: string; children?: ReactNode }) {
  return (
    <span className="kg-ring-feld">
      <svg className={`kg-ring ${ton}`} viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="40" className="grund" pathLength={100} strokeDasharray="75 100" transform="rotate(135 50 50)" />
        <circle cx="50" cy="50" r="40" className="wert" pathLength={100} strokeDasharray={`${Math.max(0, Math.min(1, anteil)) * 75} 100`} transform="rotate(135 50 50)" />
      </svg>
      {children}
    </span>
  );
}

const chanceTon = (p: number) => (p >= 0.1 ? "hoch" : p >= 0.04 ? "mittel" : "niedrig");

function Gefahrenbild({ world, risiken, stand }: { world: World; risiken: RisikoSicht[]; stand: number }) {
  const sortiert = [...risiken].sort((a, b) => b.jahresChance - a.jahresChance);
  const [wahl, setWahl] = useState<string | null>(null);
  // Vorgabe: die wahrscheinlichste Gefahr, für die sich ein einzelner Fall durchrechnen lässt (Dürre wirkt über Monate)
  const r = risiken.find((x) => x.id === wahl) ?? sortiert.find((x) => SZENARIO_ARTEN.has(x.art)) ?? sortiert[0];
  const [plaka, setPlaka] = useState<number | null>(null);
  const [staerke, setStaerke] = useState<number>(0.75);
  if (!r) return null;
  const gebiet = new Map(r.gebiet.map((g, i) => [g.plaka, { g, rang: i }]));
  const ort = (plaka !== null && gebiet.get(plaka)?.g) || r.gebiet[0];
  const farbe = (plakaNr: number): string | undefined => {
    const x = gebiet.get(plakaNr);
    if (!x) return undefined;
    const stufe = x.g.risiko ?? (x.rang < r.gebiet.length / 3 ? 5 : x.rang < (2 * r.gebiet.length) / 3 ? 4 : 3);
    return ["#f1d9a8", "#e8b874", "#dc8f55", "#c0563f", "#8f2a1e"][Math.max(0, Math.min(4, stufe - 1))];
  };
  const kannSzenario = SZENARIO_ARTEN.has(r.art) && !!ort;
  const zeilen = kannSzenario
    ? szenario(world, r.art, [ort!.plaka], staerke, [
        { name: t("kg.ohne"), stand: 0 },
        { name: t("kg.heute"), stand },
        { name: stand >= 80 ? t("kg.voll") : t("kg.bei80"), stand: stand >= 80 ? 100 : 80 },
      ])
    : [];
  const maxTote = Math.max(1, ...zeilen.map((z) => z.tote));
  const prozent = (p: number) => (p <= 0 ? t("kg.ruht") : `${nf(Math.round(p * 1000) / 10, p < 0.1 ? 1 : 0)} %`);
  return (
    <section className="kg">
      <ul className="kg-ringe">
        <li className="kg-bereit" title={t("kg.bereitTitel", { ref: KATASTROPHE.bereitReferenz, senkung: nf(bereitSenkung(stand), 1) })}>
          <Ring anteil={stand / 100} ton={stand >= 60 ? "gut" : stand >= KATASTROPHE.bereitReferenz ? "mittel" : "hoch"}><b>{stand}</b></Ring>
          <strong>{t("kg.bereit")}</strong>
          <small>{t("kg.bereitKurz", { senkung: nf(bereitSenkung(stand), 0) })}</small>
        </li>
        {sortiert.map((x) => (
          <li key={x.id}>
            <button type="button" className={`kg-gefahr${x.id === r.id ? " on" : ""}`} aria-pressed={x.id === r.id} onClick={() => { setWahl(x.id); setPlaka(null); }}>
              <Ring anteil={x.jahresChance / 0.3} ton={chanceTon(x.jahresChance)}><b>{prozent(x.jahresChance)}</b></Ring>
              <strong>{x.titel}</strong>
              <small>{t("kg.provinzen", { n: x.gebiet.length })}</small>
            </button>
          </li>
        ))}
      </ul>

      <div className="kg-buehne">
        <div className="kg-karte-feld">
          <svg className="kg-karte" viewBox={`-10 -10 ${BREITE + 20} ${HOEHE + 20}`} role="img" aria-label={t("kg.karteAria", { gefahr: r.titel })}>
            {PROV.map((p) => {
              const f = farbe(p.plaka);
              return (
                <path key={p.plaka} d={p.d} className={`${f ? "" : "ruhig"}${p.plaka === ort?.plaka ? " gewaehlt" : ""}`} style={f ? { fill: f } : undefined} onClick={() => f && setPlaka(p.plaka)}>
                  <title>{p.name}</title>
                </path>
              );
            })}
          </svg>
          <p className="kg-legende">{t("kg.legende")}</p>
        </div>
        <aside className="kg-akte">
          <span className="kg-kicker">{t("kg.inZwoelf")}</span>
          <h4>{r.titel} <b className={chanceTon(r.jahresChance)}>{prozent(r.jahresChance)}</b></h4>
          <p className="kg-zeile">{t("kg.gebiet", { n: r.gebiet.length, mio: nf(r.bevoelkerung / 1e6, 1) })} · {t("ui2.ui.katastrophe.Lage.5c6f916", { p0: r.saison })}</p>
          {r.kennzahl && <p className="kg-zeile">{t("ui2.ui.katastrophe.Lage.96504fa", { p0: r.kennzahl.name, p1: r.kennzahl.wert })}</p>}
          {kannSzenario && ort ? (
            <>
              <h5>{t("kg.wenn", { ort: ort.name })}</h5>
              <div className="kg-staerke" role="radiogroup" aria-label={t("ui2.ui.katastrophe.Lage.7e752b5")}>
                {STUFEN_STAERKE.map((x) => (
                  <button key={x} type="button" role="radio" aria-checked={staerke === x} className={staerke === x ? "on" : ""} onClick={() => setStaerke(x)}>{t(`kg.st.${x >= 0.85 ? "verheerend" : x >= 0.65 ? "schwer" : "spuerbar"}`)}</button>
                ))}
              </div>
              <ul className="kg-folgen">
                {zeilen.map((z, i) => (
                  <li key={z.name} className={i === 1 ? "heute" : ""}>
                    <span className="kg-folgen-name">{z.name} <small>({z.stand})</small></span>
                    <span className="kg-folgen-balken"><i style={{ width: `${(z.tote / maxTote) * 100}%` }} /></span>
                    <span className="kg-folgen-zahl"><b>{nf(z.tote)}</b> {t("kg.tote")} · {nf(z.obdachlos)} {t("kg.obdachlos")}</span>
                  </li>
                ))}
              </ul>
              <p className="kr-klein">{t("kg.klick")}</p>
            </>
          ) : (
            <p className="kr-klein">{t("kg.keinSzenario")}</p>
          )}
        </aside>
      </div>
    </section>
  );
}

export function Lage({ world, refresh, melde, onGehe }: { world: World; refresh: () => void; melde: (m: string) => void; onGehe?: (z: Ziel) => void }) {
  const stand = Math.round(bereitschaft(world));
  const risiken = risikoUebersicht(world);
  const hebelListe = hebel(world);
  return (
    <div className="kr-lage">
      <Gefahrenbild world={world} risiken={risiken} stand={stand} />

      <section className="kr-abschnitt">
        <h3>{t("ui.katastrophe.Lage.7338818")}</h3>
        <div className="kr-hebel-raster">
          {hebelListe.map((h) => (
            <HebelKarte key={h.id} h={h} w={world} refresh={refresh} melde={melde} {...(onGehe ? { onGehe } : {})} />
          ))}
        </div>
      </section>

    </div>
  );
}
