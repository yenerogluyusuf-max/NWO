// Die Wahlkampf-Zentrale (INN-5): Aktionspunkte-Konto, Karte mit besuchten Provinzen, Reisen mit
// Ortsbezug, Auslandstouren zur Diaspora, die Versprechen mit ihrer Glaubwürdigkeit, der Stand des
// TV-Duells, das Profil des Gegners (gesehen durch das Bias der eigenen Umfragen) und der
// Umfrage-Ticker der Kampagnenwochen. Außerhalb der Phase zeigt die Seite den Countdown.

import { useState } from "react";
import type { World } from "../sim/types";
import { Rng } from "../sim/rng";
import {
  TOUR_LAENDER,
  WAHLKAMPF,
  auslandstour,
  duellVorbereiten,
  nachfolgerAuftritt,
  reise,
  reiseKosten,
  reiseVorschau,
  regionenMitProvinzen,
  verspreche,
  wahlkampfSicht,
  type AktionErgebnis,
  type AuftrittArt,
  type TourLand,
} from "../sim/wahlkampf";
import { t } from "../i18n";
import { GRUPPEN } from "../sim/gruppen";
import { NET } from "../sim/modell";
import { AtlasMap } from "./atlas/AtlasMap";
import { nf, prozent, vz } from "./waehler/format";
import { t as tx } from "../i18n";
import "./politik/design.css";
import "./wahlkampf.css";

const GRUPPEN_NAME = new Map(GRUPPEN.map((g) => [g.id, NET.nodes[NET.index.get(g.id)!]!.name]));

/** Aktionen verbrauchen den Zufallsstrom wie Entscheidungen im Ereignisfenster (gleiche Regel wie `entscheide`). */
function handeln(w: World, aktion: (rng: Rng) => AktionErgebnis): AktionErgebnis {
  const rng = new Rng(w.rngState ^ w.day);
  const r = aktion(rng);
  if (r.ok) w.rngState = (w.rngState + 1) | 0;
  return r;
}

function ApPunkte({ ap, max }: { ap: number; max: number }) {
  return (
    <span className="kampf-ap" role="img" aria-label={tx("ui2.ui.Wahlkampf.9336c8d", { p0: nf(ap, 0), p1: max })}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={i < Math.round(ap) ? "voll" : ""} />
      ))}
    </span>
  );
}

export function WahlkampfZentrale({ world, refresh }: { world: World; refresh: () => void }) {
  const s = wahlkampfSicht(world);
  const [meldung, setMeldung] = useState<string | null>(null);

  const tue = (aktion: (rng: Rng) => AktionErgebnis) => {
    const r = handeln(world, aktion);
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
          <strong className={s.effekte.gesamt >= 0 ? "gut" : "schlecht"}>{vz(s.effekte.gesamt)}</strong>
          <span className="kampf-klein">{s.effekte.teile.map((t) => `${t.name} ${vz(t.punkte)}`).join(" · ") || tx("ui2.ui.Wahlkampf.06d81f3")}</span>
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

      <div className="kampf-grid">
        <section className="kampf-reisen" aria-label={tx("ui2.ui.Wahlkampf.a1bd152")}>
          <h3>{tx("ui2.ui.Wahlkampf.21e26aa")}</h3>
          <p className="kampf-unter">
            {tx("ui2.ui.Wahlkampf.af38990", { p0: s.besuchte })}
          </p>
          <div className="kampf-karte">
            <AtlasMap className="kampf-atlas" fill={fill} interactive={false} />
          </div>
          <div className="kampf-regionen">
            {regionenMitProvinzen().map((r) => (
              <details key={r.region}>
                <summary>
                  {r.name} <em>{r.provinzen.filter((p) => (besuche[String(p.plaka)] ?? 0) > 0).length}/{r.provinzen.length}</em>
                </summary>
                <ul className="kampf-provliste">
                  {r.provinzen.map((p) => {
                    const kosten = reiseKosten(p.plaka);
                    const v = reiseVorschau(world, p.plaka);
                    const n = besuche[String(p.plaka)] ?? 0;
                    return (
                      <li key={p.plaka}>
                        <button
                          className={`kampf-prov${n > 0 ? " besucht" : ""}${v.probleme.length > 0 ? " brennt" : ""}`}
                          disabled={s.ap < kosten}
                          title={tx("ui2.ui.Wahlkampf.a7fea85", { p0: v.probleme.length > 0 ? `Brennt: ${v.probleme.join(", ")} — Risiko ${prozent(v.risiko, 0)}${v.relevant ? ", archätyp-relevant" : ""}. ` : "", p1: vz(v.staerke * v.abnutzung), p2: n > 0 ? ` (schon ${n}× besucht, abnehmender Ertrag)` : "" })}
                          onClick={() => tue((rng) => reise(world, p.plaka, rng))}
                        >
                          <span className="kampf-prov-name">{p.name}</span>
                          {v.probleme.length > 0 && <span className="kampf-prov-brand" aria-label={tx("ui2.ui.Wahlkampf.3253986", { p0: v.probleme.length })}>!</span>}
                          {n > 0 && <span className="kampf-prov-zahl">{n}×</span>}
                          <span className="kampf-prov-kosten">{kosten} AP</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </div>
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
                        {v.ap} AP
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
              {tx("ui2.ui.Wahlkampf.83246dd")} {s.diaspora.lagerAnteil > 0 ? tx("ui2.ui.Wahlkampf.f38f63c", { p0: nf(s.diaspora.lagerAnteil) }) : "fest"} {tx("ui2.ui.Wahlkampf.8851220", { p0: prozent(s.diaspora.beteiligung, 0), p1: vz(s.diaspora.beitrag), p2: WAHLKAMPF.tourAp })}
            </p>
            <ul className="kampf-tourliste">
              {TOUR_LAENDER.map((t) => {
                const touren = s.touren.filter((x) => x.land === t.land);
                return (
                  <li key={t.land}>
                    <div className="kampf-tour-text">
                      <strong>{t.name}</strong>
                      <span>
                        Lager-Modifikator {t.modifikatorPp >= 0 ? "+" : "−"}{tx("ui2.ui.Wahlkampf.e34ddf2", { p0: nf(Math.abs(t.modifikatorPp), 0), p1: prozent(t.anteilWaehler, 0) })}
                        {touren.length > 0 ? ` · ${touren.length}× bereist${touren.some((x) => x.verbot) ? ", ein Auftrittsverbot" : ""}` : ""}
                      </span>
                    </div>
                    <button className="pd-btn primary" disabled={s.ap < WAHLKAMPF.tourAp} onClick={() => tue((rng) => auslandstour(world, t.land as TourLand, rng))}>
                      {WAHLKAMPF.tourAp} AP
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="kampf-duell" aria-label="TV-Duell">
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

          <section className="kampf-gegner" aria-label={tx("ui2.ui.Wahlkampf.35d0259")}>
            <h3>{tx("ui2.ui.Wahlkampf.35d0259")}</h3>
            <p className="kampf-gegner-profil">
              <strong>{s.gegner.name}</strong> ({s.gegner.parteiName})
            </p>
            <p className="kampf-unter">
              {s.gegner.staerkeSicht !== null
                ? tx("ui2.ui.Wahlkampf.1663da3", { p0: nf(s.gegner.staerkeSicht), p1: s.gegner.institut, p2: vz(s.gegner.hausBias ?? 0) })
                : tx("ui2.ui.Wahlkampf.5819f97")}
            </p>
            {s.angriffeLog.length > 0 && (
              <ul className="kampf-angriffe">
                {s.angriffeLog.slice(-4).reverse().map((a, i) => (
                  <li key={`${a.tag}-${i}`}>
                    <span>{a.thema}</span>
                    <strong className="schlecht">−{nf(a.staerke)}</strong>
                  </li>
                ))}
              </ul>
            )}
            <p className="kampf-unter">{tx("ui2.ui.Wahlkampf.1963a80", { p0: vz(s.angriffe) })}</p>
          </section>

          <section className="kampf-ticker" aria-label="Umfrage-Ticker">
            <h3>Umfrage-Ticker</h3>
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
          <ul className="kampf-vliste">
            {s.versprechen.map(({ def, gegeben }) => (
              <li key={def.id} className={gegeben ? "gegeben" : ""}>
                <div className="kampf-v-text">
                  <strong>{def.titel}</strong>
                  <span>{def.text}</span>
                  <em>
                    {tx("ui2.ui.Wahlkampf.a781f62", { p0: def.zielgruppen.map((g) => GRUPPEN_NAME.get(g) ?? g).join(", ") })}
                    {def.verlierer?.length ? ` · verliert: ${def.verlierer.map((g) => GRUPPEN_NAME.get(g) ?? g).join(", ")}` : ""}
                  </em>
                </div>
                {gegeben ? (
                  <span className="kampf-v-gegeben">{tx("ui2.ui.Wahlkampf.dfb8f52")}</span>
                ) : (
                  <button className="pd-btn primary" disabled={s.ap < WAHLKAMPF.versprechenAp} onClick={() => tue(() => verspreche(world, def.id))}>
                    {WAHLKAMPF.versprechenAp} AP
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
