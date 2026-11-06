// Die Wahlkampf-Zentrale (INN-5): Aktionspunkte-Konto, Karte mit besuchten Provinzen, Reisen mit
// Ortsbezug, Auslandstouren zur Diaspora, die Versprechen mit ihrer Glaubwürdigkeit, der Stand des
// TV-Duells, das Profil des Gegners (gesehen durch das Bias der eigenen Umfragen) und der
// Umfrage-Ticker der Kampagnenwochen. Außerhalb der Phase zeigt die Seite den Countdown.

import { useState } from "react";
import type { World } from "../sim/types";
import type { Rng } from "../sim/rng";
import {
  TOUR_LAENDER,
  WAHLKAMPF,
  angriffAntworten,
  angriffBeantworten,
  angriffOffen,
  auslandstour,
  duellVorbereiten,
  nachfolgerAuftritt,
  reise,
  reiseWirkungVorschau,
  tourVorschau,
  wahlkampfAktion,
  regionenMitProvinzen,
  wahlkampfSicht,
  type AktionErgebnis,
  type AngriffAntwort,
  type AuftrittArt,
  type TourLand,
} from "../sim/wahlkampf";
import { t } from "../i18n";
import { PROVINZEN } from "../sim/regional";
import { Wahlversprechen } from "./Wahlversprechen";
import { NET } from "../sim/modell";
import { AtlasMap } from "./atlas/AtlasMap";
import { nf, prozent, vz } from "./waehler/format";
import { t as tx } from "../i18n";
import type { Ziel } from "./schreibtisch/briefing";
import "./politik/design.css";
import "./wahlkampf.css";


function ApPunkte({ ap, max }: { ap: number; max: number }) {
  return (
    <span className="kampf-ap" role="img" aria-label={tx("ui2.ui.Wahlkampf.9336c8d", { p0: nf(ap, 0), p1: max })}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={i < Math.round(ap) ? "voll" : ""} />
      ))}
    </span>
  );
}

export function WahlkampfZentrale({ world, refresh, onGehe }: { world: World; refresh: () => void; onGehe?: (z: Ziel) => void }) {
  const s = wahlkampfSicht(world);
  const [provinz, setProvinz] = useState(6);
  const [meldung, setMeldung] = useState<string | null>(null);

  const tue = (aktion: (rng: Rng) => AktionErgebnis) => {
    const r = wahlkampfAktion(world, aktion);
    setMeldung(r.text);
    if (r.ok) refresh();
  };

  if (!s.aktiv) {
    return (
      <div className="kampf-root">
        <section className="kampf-warte">
          <h3>{t("ui.Wahlkampf.2d60007")}</h3>
          <p>
            {tx("ui2.ui.Wahlkampf.75f5f5c", { p0: Math.round(s.tageBisWahl / 30.4) })}
            {s.beginntIn !== undefined ? tx("ui2.ui.Wahlkampf.14d1f30", { p0: Math.round(s.beginntIn / 30.4), p1: t("reste.monat", { n: Math.round(s.beginntIn / 30.4) }) }) : ""}.
          </p>
          <p className="kampf-unter">
            {tx("ui2.ui.Wahlkampf.921af9e")}{" "}
            {tx("ui2.ui.Wahlkampf.c0b48fe", { p0: s.gegner.name, p1: WAHLKAMPF.apProWoche })}
          </p>
          <p className="kampf-unter">
            {t("ui.Wahlkampf.86c14a1")}
          </p>
        </section>
      </div>
    );
  }

  const fill: Record<number, string> = {};
  for (const r of s.reisen) fill[r.plaka] = "rgba(196, 146, 42, 0.35)";
  const besuche = world.spiel?.wahlkampf?.besuche ?? {};
  for (const [plaka, n] of Object.entries(besuche)) fill[Number(plaka)] = `rgba(196, 146, 42, ${Math.min(0.95, 0.3 + 0.25 * n)})`;

  return (
    <div className="kampf-root">
      <section className="kampf-kopf" aria-label={t("ui.Wahlkampf.b95c4f8")}>
        <div className="kampf-kopf-block">
          <span className="kampf-kicker">{t("ui.Wahlkampf.7363869")}</span>
          <strong>{s.tageBisWahl} {s.tageBisWahl === 1 ? tx("ui2.ui.Wahlkampf.982963c") : tx("ui2.ui.Wahlkampf.e94f59f")}</strong>
        </div>
        <div className="kampf-kopf-block">
          <span className="kampf-kicker">{tx("ui2.ui.Wahlkampf.33d606a")}</span>
          <ApPunkte ap={s.ap} max={s.apMax} />
          <span className="kampf-klein">{tx("ui2.ui.Wahlkampf.4204223", { p0: s.resetIn })} {s.resetIn === 1 ? tx("ui2.ui.Wahlkampf.982963c") : tx("ui2.ui.Wahlkampf.8c3427b")}</span>
        </div>
        <div className="kampf-kopf-block">
          <span className="kampf-kicker">{tx("ui2.ui.Wahlkampf.97b7e24")}</span>
          <strong>×{nf(WAHLKAMPF.aufmerksamkeitFaktor)}</strong>
          <span className="kampf-klein">{t("ui.Wahlkampf.537a223")}</span>
        </div>
        <div className="kampf-kopf-block">
          <span className="kampf-kicker">{tx("ui2.ui.Wahlkampf.7e090e3")}</span>
          <strong className={s.effekte.gesamt + s.reisenZustimmung >= 0 ? "gut" : "schlecht"}>{vz(s.effekte.gesamt + s.reisenZustimmung)}</strong>
          <span className="kampf-klein">
            {[
              ...(s.reisenZustimmung !== 0 ? [`${t("nacht_n2.wk.reisen")} ${vz(s.reisenZustimmung, 2)} (${t("nacht_n2.wk.reisen_hinweis")})`] : []),
              ...s.effekte.teile.map((e) => `${e.name} ${vz(e.punkte)}`),
            ].join(" · ") || tx("ui2.ui.Wahlkampf.06d81f3")}
          </span>
        </div>
      </section>

      {s.rolle === "nachfolger" && s.nachfolger && (
        <section className="kampf-nachfolger" aria-label={t("enden.wk.ui.titel", { name: s.nachfolger.name })}>
          <h3>{t("enden.wk.ui.titel", { name: s.nachfolger.name })}</h3>
          <p className="kampf-unter">{t("enden.wk.ui.untertitel", { rolle: s.nachfolger.rolle, name: s.nachfolger.name, staerke: s.nachfolger.staerke })}</p>
        </section>
      )}

      {meldung && (
        <p className="kampf-meldung" role="status">
          {meldung}
        </p>
      )}

      <section className="kampf-gegner kampf-gegner-oben" aria-label={tx("ui2.ui.Wahlkampf.35d0259")}>
        <h3>{tx("ui2.ui.Wahlkampf.35d0259")}</h3>
        <p className="kampf-gegner-profil">
          <strong>{s.gegner.name}</strong> ({s.gegner.parteiName})
        </p>
        <p className="kampf-unter">
          {s.gegner.staerkeSicht !== null
            ? tx("ui2.ui.Wahlkampf.1663da3", { p0: nf(s.gegner.staerkeSicht), p1: s.gegner.institut, p2: vz(s.gegner.hausBias ?? 0) })
            : tx("ui2.ui.Wahlkampf.5819f97")}
        </p>
        <h4 className="kampf-h4">{t("nacht_n2.angriff.kopf")}</h4>
        <p className="kampf-unter">{t("nacht_n2.angriff.summe", { d: vz(s.angriffe), n: s.aussicht.wochen, summe: vz(s.aussicht.summe) })}</p>
        {s.angriffeLog.length > 0 && (
          <ul className="kampf-angriffe">
            {s.angriffeLog
              .map((a, index) => ({ a, index }))
              .slice(-4)
              .reverse()
              .map(({ a, index }) => (
                <AngriffKarte key={`${a.tag}-${index}`} world={world} index={index} tue={tue} />
              ))}
          </ul>
        )}
        {s.aussicht.themaId && onGehe && (
          <p className="kampf-unter">
            {t("nacht_n2.angriff.problem_text")}{" "}
            <button type="button" className="pd-btn quiet klein" onClick={() => onGehe({ art: "politik", theme: NET.nodes[NET.index.get(s.aussicht.themaId!)!]!.theme })}>
              {t("nacht_n2.angriff.problem", { thema: s.aussicht.thema ?? "" })}
            </button>
          </p>
        )}
      </section>
      <div className="kampf-grid">
        <section className="kampf-reisen" aria-label={tx("ui2.ui.Wahlkampf.a1bd152")}>
          <h3>{tx("ui2.ui.Wahlkampf.21e26aa")}</h3>
          <p className="kampf-unter">
            {tx("ui2.ui.Wahlkampf.af38990", { p0: s.besuchte })}
          </p>
          <div className="kampf-karte">
            <AtlasMap className="kampf-atlas" fill={fill} interactive={false} />
          </div>
          <label className="kampf-reiseziel">
            <span>{t("wahlreise.auswahl")}</span>
            <select value={provinz} onChange={e => setProvinz(Number(e.target.value))}>
              {regionenMitProvinzen().map(r => <optgroup key={r.region} label={r.name}>
                {r.provinzen.map(p => <option key={p.plaka} value={p.plaka}>{p.name} · {besuche[String(p.plaka)] ?? 0}×</option>)}
              </optgroup>)}
            </select>
          </label>
          <ReisePlan world={world} plaka={provinz} tue={tue} />
        </section>

        <div className="kampf-spalte">
          {s.rolle === "nachfolger" && s.auftritte && (
            <section className="kampf-auftritte" aria-label={t("enden.wk.ui.auftritte_titel")}>
              <h3>{t("enden.wk.ui.auftritte_titel")}</h3>
              <p className="kampf-unter">{t("enden.wk.ui.auftritte_text")}</p>
              <ul className="kampf-tourliste">
                {(["gemeinsam", "allein"] as AuftrittArt[]).map((art) => {
                  const v = s.auftritte!.vorschau[art];
                  return (
                    <li key={art}>
                      <div className="kampf-tour-text">
                        <strong>{t(art === "gemeinsam" ? "enden.wk.ui.gemeinsam" : "enden.wk.ui.allein")}</strong>
                        <span className={v.punkte >= 0 ? "gut" : "schlecht"}>{t("enden.wk.ui.kosten", { ap: v.ap, uebrig: v.uebrig, max: v.max, punkte: v.punkte })}</span>
                      </div>
                      <button className="pd-btn primary" disabled={s.ap < v.ap || v.uebrig <= 0} onClick={() => tue(() => nachfolgerAuftritt(world, art))}>
                        {t("nacht_n2.antwort.ap", { ap: v.ap })}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="kampf-unter">{t("enden.wk.ui.bilanz", { punkte: s.auftritte.punkte })}</p>
            </section>
          )}

          <section className="kampf-touren" aria-label={tx("ui2.ui.Wahlkampf.9744596")}>
            <h3>{t("ui.Wahlkampf.3a7a840")}</h3>
            <p className="kampf-unter">
              {tx("ui2.ui.Wahlkampf.83246dd")} {s.diaspora.lagerAnteil > 0 ? tx("ui2.ui.Wahlkampf.f38f63c", { p0: nf(s.diaspora.lagerAnteil) }) : t("nacht_n2.wk.fest")} {tx("ui2.ui.Wahlkampf.8851220", { p0: prozent(s.diaspora.beteiligung, 0), p1: vz(s.diaspora.beitrag), p2: WAHLKAMPF.tourAp })}
            </p>
            <div className="kampf-tourplaene">
              {TOUR_LAENDER.map(ziel => <TourPlan key={ziel.land} world={world} land={ziel.land} tue={tue} />)}
            </div>
          </section>

          <section className="kampf-duell" aria-label={t("nacht_n2.wk.duell")}>
            <h3>{s.rolle === "nachfolger" ? t("enden.wk.ui.duell_nachfolger") : tx("ui2.ui.Wahlkampf.8235cca")}</h3>
            {s.duell.effekt === undefined ? (
              <>
                <p className="kampf-unter">
                  {s.rolle === "nachfolger" && s.nachfolger
                    ? t("enden.wk.ui.duell_text", { datum: s.duell.datum, name: s.nachfolger.name, gegner: s.gegner.name, partei: s.gegner.parteiName, ap: WAHLKAMPF.duellAp })
                    : tx("ui2.ui.Wahlkampf.db02503", { p0: s.duell.datum, p1: s.gegner.name, p2: s.gegner.parteiName, p3: WAHLKAMPF.duellAp })}
                </p>
                {s.duell.vorbereitet ? (
                  <p className="kampf-status gut">{t("ui.Wahlkampf.8ba73fa")}</p>
                ) : (
                  <button className="pd-btn primary" disabled={s.ap < WAHLKAMPF.duellAp} onClick={() => tue(() => duellVorbereiten(world))}>
                    {tx("ui2.ui.Wahlkampf.2651068", { p0: WAHLKAMPF.duellAp })}
                  </button>
                )}
              </>
            ) : (
              <>
                <p className={`kampf-status ${s.duell.effekt >= 0 ? "gut" : "schlecht"}`}>
                  {tx("ui2.ui.Wahlkampf.74c11fe", { p0: vz(s.duell.effekt) })}
                </p>
                {s.duell.szene && <p className="kampf-unter">{s.duell.szene}</p>}
              </>
            )}
          </section>


          <section className="kampf-ticker" aria-label={t("nacht_n2.wk.ticker")}>
            <h3>{t("nacht_n2.wk.ticker")}</h3>
            <ul>
              {s.ticker.slice().reverse().map((tk) => (
                <li key={tk.tag}>
                  <strong>{nf(tk.wert)} %</strong>
                  <span>{tk.institut}</span>
                  <em title={t("ui.Wahlkampf.be569cb")}>
                    {tx("ui2.ui.Wahlkampf.b55036a", { p0: vz(tk.hausBias) })}
                  </em>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="kampf-versprechen" aria-label={tx("ui2.ui.Wahlkampf.aa05a80")}>
          <h3>{tx("ui2.ui.Wahlkampf.aa05a80")}</h3>
          <p className="kampf-unter">
            {s.rolle === "nachfolger"
              ? t("enden.wk.ui.versprechen_text", { glaub: Math.round(s.glaubwuerdigkeit), faktor: s.glaubFaktor })
              : tx("ui2.ui.Wahlkampf.fdf71b5", { p0: nf(s.glaubwuerdigkeit, 0), p1: nf(s.glaubFaktor) })}
          </p>
          <Wahlversprechen world={world} tue={tue} />
        </section>
      </div>
    </div>
  );
}


type ReisePlanProps = { world: World; tue: (aktion: (rng: Rng) => AktionErgebnis) => void };

/** Ein Angriff der Gegenseite mit den drei Antworten, ihrem Preis in Aktionspunkten und ihrer Wirkung (E-2). */
function AngriffKarte({ world, index, tue }: ReisePlanProps & { index: number }) {
  const a = world.spiel!.wahlkampf!.angriffeLog[index]!;
  const offen = angriffOffen(world, a);
  const antworten = angriffAntworten(world, index);
  const text = (x: (typeof antworten)[number]) =>
    x.id === "gegendarstellung"
      ? t("nacht_n2.antwort.gegendarstellung.text", { anteil: prozent(x.hausmedien ?? 0, 0), d: vz(x.zurueck, 2) })
      : x.id === "ortstermin"
        ? t("nacht_n2.antwort.ortstermin.text", { d: vz(x.zurueck, 2), risiko: prozent(x.risiko, 0), rueckschlag: vz(x.rueckschlag, 2) })
        : t("nacht_n2.antwort.gegenangriff.text", { d: vz(x.zurueck, 2), pol: nf(x.polarisierung) });
  return (
    <li className={`kampf-angriff${a.antwort ? " beantwortet" : offen ? " offen" : ""}`}>
      <div className="kampf-angriff-kopf">
        <span>{a.thema}</span>
        <strong className="schlecht">−{nf(a.staerke)}</strong>
      </div>
      {a.antwort ? (
        <p className={`kampf-angriff-stand ${(a.zurueck ?? 0) >= 0 ? "gut" : "schlecht"}`}>
          {t("nacht_n2.angriff.beantwortet", { antwort: t(`nacht_n2.antwort.${a.antwort}.name`), d: vz(a.zurueck ?? 0, 2) })}
        </p>
      ) : offen ? (
        <>
          <p className="kampf-angriff-stand">{t("nacht_n2.angriff.offen", { tage: Math.max(0, WAHLKAMPF.antwortFristTage - (world.day - a.tag)) })}</p>
          <div className="kampf-antworten">
            {antworten.map((x) => (
              <button key={x.id} type="button" className="kampf-antwort" disabled={!x.moeglich} title={x.grund ?? ""} onClick={() => tue((rng) => angriffBeantworten(world, index, x.id as AngriffAntwort, rng))}>
                <strong>{t(`nacht_n2.antwort.${x.id}.name`)}</strong>
                <span className="kampf-antwort-ap">{t("nacht_n2.antwort.ap", { ap: x.ap })}</span>
                <span>{text(x)}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="kampf-angriff-stand">{t("nacht_n2.angriff.vorbei")}</p>
      )}
    </li>
  );
}
export function ReisePlan({ world, plaka, tue }: ReisePlanProps & { plaka: number }) {
  const p = reiseWirkungVorschau(world, plaka), name = PROVINZEN[plaka - 1]!.name;
  const gruppe = p.gruppe ? NET.nodes[NET.index.get(p.gruppe)!]!.name : "";
  return <article className="kampf-entscheid" aria-label={t("wahlreise.plan", { name })}>
    <header><div><span className="kampf-kicker">{t("wahlreise.vorOrt")}</span><h4>{name}</h4></div><strong>{t("nacht_n2.antwort.ap", { ap: p.kosten })}</strong></header>
    <div className="kampf-ausgaenge">
      <div><span>{t("wahlreise.erfolg", { chance: prozent(1 - p.risiko, 0) })}</span><strong className="gut">{vz(p.erfolg)}</strong><small>{t("wahlreise.lokal")}</small></div>
      <div><span>{t("wahlreise.risiko", { chance: prozent(p.risiko, 0) })}</span><strong className="schlecht">{p.risiko > 0 ? vz(p.rueckschlag) : "—"}</strong><small>{t("wahlreise.lokal")}</small></div>
    </div>
    {p.gruppe && <p>{t("wahlreise.gruppe", { name: gruppe, plus: vz(p.gruppenErfolg), minus: p.risiko > 0 ? vz(p.gruppenRueckschlag) : "—" })}</p>}
    <p className="kampf-wahltag"><b>{p.risiko > 0 ? t("nacht_n2.reise.wahltag", { erfolg: vz(p.wahlErfolg, 2), rueckschlag: vz(p.wahlRueckschlag, 2) }) : t("nacht_n2.reise.wahltag_ruhig", { erfolg: vz(p.wahlErfolg, 2) })}</b></p>
    <p>{p.probleme.length ? t("wahlreise.probleme", { namen: p.probleme.join(", ") }) : t("wahlreise.ruhig")}</p>
    <p className="kampf-hinweis">{t("wahlreise.wirkung", { anteil: prozent(p.abnutzung, 0) })}</p>
    <button className="pd-btn primary" disabled={!world.spiel?.wahlkampf || !!world.spiel.ende || world.spiel.wahlkampf.ap < p.kosten} onClick={() => tue(rng => reise(world, plaka, rng))}>{t("wahlreise.start", { name, ap: p.kosten })}</button>
  </article>;
}

export function TourPlan({ world, land, tue }: ReisePlanProps & { land: TourLand }) {
  const p = tourVorschau(world, land), name = t(`wahlreise.land.${land}`);
  const bereich = (min: number, max: number) => `${vz(min, 2)} … ${vz(max, 2)}`;
  return <article className="kampf-entscheid" aria-label={t("wahlreise.plan", { name })}>
    <header><h4>{name}</h4><strong>{t("nacht_n2.antwort.ap", { ap: p.kosten })}</strong></header>
    <p>{t("wahlreise.heimisch", { vertrauen: vz(p.vertrauen), nationalisten: vz(p.nationalisten) })} <b>{t("nacht_n2.tour.inland", { d: vz(p.wahlInland, 2) })}</b></p>
    <p>{t("wahlreise.ausland", { beitrag: bereich(p.min.beitrag, p.max.beitrag), beteiligung: bereich(p.min.beteiligung, p.max.beteiligung) })}</p>
    <details><summary>{t("wahlreise.verbot", { chance: prozent(p.risiko, 0) })}</summary>
      <p>{t("wahlreise.diplomatie", { min: p.euMin, max: p.euMax, konflikt: p.konflikt, beitrag: bereich(p.verbotMin.beitrag, p.verbotMax.beitrag) })}</p>
    </details>
    <p className="kampf-hinweis">{t("wahlreise.wiederholung", { n: p.bisher, anteil: prozent(p.abnutzung, 0) })}</p>
    <button className="pd-btn primary" disabled={!world.spiel?.wahlkampf || !!world.spiel.ende || world.spiel.wahlkampf.ap < p.kosten} onClick={() => tue(rng => auslandstour(world, land, rng))}>{t("wahlreise.start", { name, ap: p.kosten })}</button>
  </article>;
}
