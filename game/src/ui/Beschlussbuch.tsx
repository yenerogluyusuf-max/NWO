// Zwei Ansichten: „parlament“ (Fraktionen, Verhandlungen, Abstimmungen) und „beschluesse“ (Rechnung, Umsetzung, Beschlussbuch).

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { NET } from "../sim/world";
import { nationalAverage, PROVINCES, policyCost, startAverage } from "../sim/netz";
import { formatDateDe } from "../sim/dates";
import { fraktionsUebersicht, verhandle, type Verhandlung } from "../sim/verhandeln";
import { Rng } from "../sim/rng";
import { addDays } from "../sim/dates";
import { PARTY_COLORS } from "./Parliament";
import { ParlamentKopf } from "./parlament/ParlamentKopf";
import { FraktionsAbkommen } from "./parlament/FraktionsAbkommen";
import type { Bericht } from "../sim/berichte";
import { UmsetzungAkte } from "./politik/UmsetzungAkte";
import "./politik/design.css";

import { t } from "../i18n";
import { t as tx } from "../i18n";

export function Beschlussbuch({
  world,
  refresh,
  teil = "parlament",
  onBerichtOeffnen,
  onAendern,
  onTagesordnung,
}: {
  world: World;
  refresh: () => void;
  teil?: "parlament" | "beschluesse";
  onBerichtOeffnen?: (b: Bericht) => void;
  /** Öffnet eine laufende Maßnahme in der Politik mit neuem Ziel (weiter ausbauen, Ziel senken) */
  onAendern?: (x: { id: string; level: number; ort: number[] | null }) => void;
  /** Springt in die Tagesordnung (dort stehen die laufenden Gesetze) */
  onTagesordnung?: () => void;
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

  return (
    <div className="beschlussbuch">
      {/* Fraktionen und Abstimmung (befund-B B-3, B-20, B-22): oben das Halbrund mit der Mehrheitszahl (nur dort), darunter eine Zeile je
          Fraktion. Laufende Gesetze stehen nur noch in der Tagesordnung; hier führt ein Verweis dorthin. */}
      {teil === "parlament" && spiel && <ParlamentKopf world={world} />}

      {teil === "parlament" && spiel && spiel.gesetze.length > 0 && (
        <p className="par-verweis">
          {tx("n4.bb.verweis", { n: spiel.gesetze.length })}
          {onTagesordnung && <button type="button" className="pd-btn quiet klein" onClick={onTagesordnung}>{tx("n4.bb.zurTagesordnung")}</button>}
        </p>
      )}

      {teil === "parlament" && spiel && fraktionen.length > 0 && (
        <section className="par-block fr-block">
          <h3 title={t("ui.Beschlussbuch.6701709")}>{t("ui.Beschlussbuch.da7a61a")}</h3>
          {antwort && (
            <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
              {antwort.text}
              {antwort.why && <em> {antwort.why}</em>}
            </p>
          )}
          <ul className="fr-liste">
            {fraktionen.map((f) => (
              <li key={f.partei} className={`fr-zeile status-${f.status}`}>
                <div className="fr-kopf">
                  <i className="party-dot" style={{ background: PARTY_COLORS[f.partei] ?? "#777" }} />
                  <strong title={f.ausrichtung}>{f.name}</strong>
                  <span className="fr-sitze">{tx("ui2.ui.Beschlussbuch.b9a0f7a", { p0: f.sitze })}</span>
                  <span className={`fr-status s-${f.status}`}>
                    {f.status === "lager" ? tx("ui2.ui.Beschlussbuch.357a160") : f.status === "duldung" ? tx("ui2.ui.Beschlussbuch.ca2716e", { p0: formatDateDe(addDays(world.date, (f.duldungBis ?? world.day) - world.day)) }) : tx("ui2.ui.Beschlussbuch.bcf3982")}
                  </span>
                </div>
                <div className="fr-mitte">
                  <span className="bereit" title={tx("ui2.ui.Beschlussbuch.56e5813", { p0: Math.round(f.bereitschaft) })}>
                    <span className="bereit-bar" aria-hidden>
                      <i style={{ width: `${f.bereitschaft}%` }} />
                    </span>
                    <em>{f.wort}</em>
                  </span>
                  <span className="fr-will"><b>{tx("ui2.ui.Beschlussbuch.3e3e580")}</b> {f.forderung}</span>
                </div>
                <div className="fr-knoepfe">
                  {f.aktionen.filter((a) => a.id !== "koalition" && a.id !== "duldung").map((a) => (
                    <button key={a.id} className={`pd-btn klein${a.id === "abwerben" ? " quiet" : ""}`} disabled={!a.moeglich} onClick={() => verhandeln(f.partei, a.id)} title={a.moeglich ? a.hinweis : `${a.grund ?? ""} ${a.hinweis}`.trim()}>
                      {a.label} <b>{a.pk}</b>
                    </button>
                  ))}
                </div>
                {f.aktionen.some((a) => a.id === "koalition" || a.id === "duldung") && (
                  <details className="fr-abkommen">
                    <summary>{tx("n4.bb.abkommen")}</summary>
                    <FraktionsAbkommen world={world} fraktion={f} onVerhandlung={(art) => verhandeln(f.partei, art)} />
                  </details>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {teil === "beschluesse" && (
        <UmsetzungAkte world={world} refresh={refresh} offen={offen} beschlossen={beschlossen} wirksam={wirksam} {...(onBerichtOeffnen ? { onBerichtOeffnen } : {})} {...(onAendern ? { onAendern } : {})} />
      )}
    </div>
  );
}
