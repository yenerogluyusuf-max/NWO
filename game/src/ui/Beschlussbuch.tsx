// Zwei Ansichten: „parlament“ (Fraktionen, Verhandlungen, Abstimmungen) und „beschluesse“ (Rechnung, Umsetzung, Beschlussbuch).

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { NET } from "../sim/world";
import { nationalAverage, PROVINCES, policyCost, startAverage } from "../sim/netz";
import { formatDateDe } from "../sim/dates";
import { gesetzSicht, provinzenText, setPolicy, stimmenKaufen, stimmenSicht, zieheGesetzZurueck, REGELN } from "../sim/handeln";
import { fraktionsUebersicht, verhandle, type Verhandlung } from "../sim/verhandeln";
import { Rng } from "../sim/rng";
import { addDays } from "../sim/dates";
import { PARTY_COLORS } from "./Parliament";
import { ParlamentKopf } from "./parlament/ParlamentKopf";
import { zeigeImHalbrund } from "./parlament/abstimmung";
import { PARTEI_NAME } from "../sim/fraktionen";
import { geaenderteArtikel, verfassungStand } from "../sim/verfassung";
import type { Bericht } from "../sim/berichte";
import { UmsetzungAkte } from "./politik/UmsetzungAkte";
import "./politik/design.css";

import { t } from "../i18n";
import { t as tx } from "../i18n";
const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export function Beschlussbuch({
  world,
  refresh,
  teil = "parlament",
  onBerichtOeffnen,
}: {
  world: World;
  refresh: () => void;
  teil?: "parlament" | "beschluesse";
  onBerichtOeffnen?: (b: Bericht) => void;
}) {
  const spiel = world.spiel;
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const fraktionen = fraktionsUebersicht(world);

  function verhandeln(partei: string, aktion: Verhandlung) {
    const r = verhandle(world, partei, aktion, new Rng(world.rngState ^ world.day));
    world.rngState = (world.rngState + 1) | 0;
    setAntwort(r);
    refresh();
  }
  const beschluesse = useMemo(() => [...world.log].reverse().filter((l) => l.kind === "entscheidung"), [world.log.length]);

  const offen = useMemo(() => {
    const out: { id: string; name: string; now: number; target: number; months: number; ort?: number[] }[] = [];
    for (const [id, target] of Object.entries(world.net.targets)) {
      const i = NET.index.get(id);
      if (i === undefined) continue;
      const now = nationalAverage(NET, world.net, id);
      if (Math.abs(now - target) > 1) out.push({ id, name: NET.nodes[i]!.name, now, target, months: NET.nodes[i]!.months ?? 1 });
    }
    for (const [id, arr] of Object.entries(world.net.ziele ?? {})) {
      const i = NET.index.get(id);
      if (i === undefined) continue;
      const ort: number[] = [];
      let now = 0;
      let target = 0;
      arr.forEach((t, p) => {
        if (t >= 0) {
          ort.push(p + 1);
          now += world.net.values[i * PROVINCES + p]!;
          target += t;
        }
      });
      if (ort.length) out.push({ id: `${id}@`, name: NET.nodes[i]!.name, now: now / ort.length, target: target / ort.length, months: NET.nodes[i]!.months ?? 1, ort });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.net.targets, world.net.ziele, world.net.values, world.day]);

  // Beschlossene Kosten: was die Beschlüsse kosten, sobald sie durchgelaufen sind
  const beschlossen = NET.nodes.reduce((sum, n) => {
    if (n.kind !== "massnahme" || !n.cost) return sum;
    const ziel = world.net.targets[n.id] ?? nationalAverage(NET, world.net, n.id);
    return sum + ((ziel - startAverage(NET, world.net, n.id)) / 100) * n.cost;
  }, 0);
  const wirksam = policyCost(NET, world.net);
  const sicht = stimmenSicht(world);
  const teile = [world.player?.partei.kurz, ...(spiel?.lager ?? [])].filter(Boolean).map((k) => `${k} ${world.parliament?.seats[k!] ?? 0}`).join(" + ");

  return (
    <div className="beschlussbuch">
      {teil === "parlament" && spiel && (
        <>
          <ParlamentKopf world={world} />
          <section className="par-lage">
            <p>
              {tx("ui2.ui.Beschlussbuch.d2be9ba")} <strong>{sicht.lager}</strong> {tx("ui2.ui.Beschlussbuch.e711bb3", { p0: teile, p1: REGELN.mehrheit })} <strong>{sicht.erwartet}</strong> {tx("ui2.ui.Beschlussbuch.aeef1bf", { p0: sicht.low, p1: sicht.high })}
            </p>
            {sicht.luecke > 0 ? (
              <p className="weg-warnung">{tx("ui2.ui.Beschlussbuch.d8d9742", { p0: sicht.luecke })}</p>
            ) : (
              <p className="subtitle">{t("ui.Beschlussbuch.3411c1e")}</p>
            )}
          </section>
        </>
      )}


      {teil === "parlament" && spiel && fraktionen.length > 0 && (
        <section className="par-block">
          <h3>{t("ui.Beschlussbuch.da7a61a")}</h3>
          <p className="pd-lead">{t("ui.Beschlussbuch.6701709")}</p>
          {antwort && (
            <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
              {antwort.text}
              {antwort.why && <em> {antwort.why}</em>}
            </p>
          )}
          <ul className="fraktion-liste">
            {fraktionen.map((f) => (
              <li key={f.partei} className={`fraktion status-${f.status}`}>
                <div className="fraktion-kopf">
                  <i className="party-dot" style={{ background: PARTY_COLORS[f.partei] ?? "#777" }} />
                  <strong>{f.name}</strong>
                  <span className="fraktion-sitze">{tx("ui2.ui.Beschlussbuch.b9a0f7a", { p0: f.sitze })}</span>
                  <span className="fraktion-status">
                    {f.status === "lager" ? tx("ui2.ui.Beschlussbuch.357a160") : f.status === "duldung" ? tx("ui2.ui.Beschlussbuch.ca2716e", { p0: formatDateDe(addDays(world.date, (f.duldungBis ?? world.day) - world.day)) }) : tx("ui2.ui.Beschlussbuch.bcf3982")}
                  </span>
                </div>
                <p className="fraktion-info">
                  <span className="subtitle">{f.ausrichtung}</span>
                  <span className="bereit" title={tx("ui2.ui.Beschlussbuch.56e5813", { p0: Math.round(f.bereitschaft) })}>
                    <span className="bereit-bar" aria-hidden>
                      <i style={{ width: `${f.bereitschaft}%` }} />
                    </span>
                    <em>{f.wort}</em>
                  </span>
                </p>
                <p className="fraktion-will">
                  <b>{tx("ui2.ui.Beschlussbuch.3e3e580")}</b> {f.forderung}
                </p>
                <div className="fraktion-aktionen">
                  {f.aktionen.map((a) => (
                    <button key={a.id} className={`pd-btn${a.id === "abwerben" ? " quiet" : ""}`} disabled={!a.moeglich} onClick={() => verhandeln(f.partei, a.id)} title={a.moeglich ? a.hinweis : `${a.grund ?? ""} ${a.hinweis}`.trim()}>
                      {a.label} <b>{a.pk}</b>
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {teil === "parlament" && spiel && spiel.gesetze.length > 0 && (
        <section className="par-block">
          <h3>{tx("ui2.ui.Beschlussbuch.cd38076")}</h3>
          <ul className="gesetz-liste">
            {spiel.gesetze.map((g) => {
              const gs = gesetzSicht(world, g);
              const ja = gs.ja;
              const zurueck = Math.floor(g.pk * REGELN.rueckzugAnteil);
              return (
                <li key={g.id}>
                  <div className="offen-kopf">
                    <strong>{g.name}</strong>
                    <span className="subtitle">
                      {tx("ui2.ui.Beschlussbuch.42b4e5e", { p0: provinzenText(g.provinzen), p1: g.stufe, p2: Math.max(0, g.abstimmung - world.day), p3: formatDateDe(addDays(world.date, g.abstimmung - world.day)) })}
                    </span>
                  </div>
                  <div className="stimmen-bar" aria-label={tx("ui2.ui.Beschlussbuch.4a67f56", { p0: ja, p1: REGELN.mehrheit })}>
                    <div className="stimmen-ja" style={{ width: `${Math.min(100, (ja / 600) * 100)}%` }} />
                    <div className="stimmen-marke" style={{ left: `${(REGELN.mehrheit / 600) * 100}%` }} title={tx("ui2.ui.Beschlussbuch.086dccd")} />
                  </div>
                  <div className="stimmen-zeile">
                    <span>
                      erwartet <strong>{ja}</strong> Ja{g.absprachen > 0 ? tx("ui2.ui.Beschlussbuch.3f16660", { p0: g.absprachen }) : ""} {tx("ui2.ui.Beschlussbuch.7591f1b", { p0: REGELN.mehrheit })}
                    </span>
                    <button className="pd-btn quiet klein" onClick={() => zeigeImHalbrund(g.id)} title={t("ui.Beschlussbuch.cdcd617")}>
                      {tx("ui2.ui.Beschlussbuch.4b870cf")}
                    </button>
                    <span className={`stimmen-urteil urteil-${gs.urteil}`}>
                      {gs.urteil === "sicher" ? tx("ui2.ui.Beschlussbuch.61a0cfe") : gs.urteil === "knapp" ? tx("ui2.ui.Beschlussbuch.0086e7c", { p0: gs.luecke }) : tx("ui2.ui.Beschlussbuch.464867b", { p0: gs.luecke })}
                    </span>
                  </div>
                  {gs.sachParteien.length > 0 && (
                    <p className="stimmen-sach">
                      {gs.sachParteien.map((k) => PARTEI_NAME[k] ?? k).join(" und ")} stimm{gs.sachParteien.length === 1 ? "t" : "en"} {tx("ui2.ui.Beschlussbuch.3ed93b4")} {gs.sachParteien.length === 1 ? "ihre" : "ihre"} {tx("ui2.ui.Beschlussbuch.6f9cc11")}
                    </p>
                  )}
                  <div className="stimmen-steuerung">
                    {gs.noetig > 0 && gs.bezahlbar && (
                      <button
                        className="pd-btn primary"
                        onClick={() => {
                          setAntwort(stimmenKaufen(world, g.id, gs.noetig));
                          refresh();
                        }}
                        title={t("ui.Beschlussbuch.3140c33")}
                      >
                        {tx("ui2.ui.Beschlussbuch.bb20535", { p0: gs.noetig })} <b>{gs.kosten}</b>
                      </button>
                    )}
                    {gs.aussichtslos && (
                      <p className="weg-warnung">
                        {tx("ui2.ui.Beschlussbuch.3bd8b02", { p0: gs.kosten, p1: Math.floor(spiel.kapital) })}
                      </p>
                    )}
                    <button
                      className="pd-btn quiet"
                      onClick={() => {
                        setAntwort(zieheGesetzZurueck(world, g.id));
                        refresh();
                      }}
                      title={t("ui.Beschlussbuch.81b4686")}
                    >
                      {tx("ui2.ui.Beschlussbuch.dfaa501")} <b>+{zurueck}</b>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {teil === "beschluesse" && (
        <UmsetzungAkte world={world} refresh={refresh} offen={offen} beschlossen={beschlossen} wirksam={wirksam} {...(onBerichtOeffnen ? { onBerichtOeffnen } : {})} />
      )}
    </div>
  );
}
