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
              Ihr Lager hat <strong>{sicht.lager}</strong> von 600 Sitzen ({teile}). Für ein Gesetz braucht es {REGELN.mehrheit}. Bei einer Abstimmung werden etwa <strong>{sicht.erwartet}</strong> Ja-Stimmen erwartet (Spanne {sicht.low}–{sicht.high}).
            </p>
            {sicht.luecke > 0 ? (
              <p className="weg-warnung">Es fehlen etwa {sicht.luecke} Stimmen. Ohne Partner scheitern Gesetze: Verhandeln Sie unten mit den Fraktionen, das ist billiger als Stimmen zu kaufen.</p>
            ) : (
              <p className="subtitle">Die Mehrheit steht, solange kein Partner das Lager verlässt.</p>
            )}
          </section>
        </>
      )}


      {teil === "parlament" && spiel && fraktionen.length > 0 && (
        <section className="par-block">
          <h3>Fraktionen und Verhandlungen</h3>
          <p className="pd-lead">Jede Fraktion will etwas. Wer ihr entgegenkommt, bekommt Stimmen: auf Zeit (Duldung) oder auf Dauer (Bündnis). Wer Zusagen bricht, verliert sie.</p>
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
                  <span className="fraktion-sitze">{f.sitze} Sitze</span>
                  <span className="fraktion-status">
                    {f.status === "lager" ? "im Regierungslager" : f.status === "duldung" ? `duldet bis ${formatDateDe(addDays(world.date, (f.duldungBis ?? world.day) - world.day))}` : "Opposition"}
                  </span>
                </div>
                <p className="fraktion-info">
                  <span className="subtitle">{f.ausrichtung}</span>
                  <span className="bereit" title={`Offenheit für Sie: ${Math.round(f.bereitschaft)} von 100`}>
                    <span className="bereit-bar" aria-hidden>
                      <i style={{ width: `${f.bereitschaft}%` }} />
                    </span>
                    <em>{f.wort}</em>
                  </span>
                </p>
                <p className="fraktion-will">
                  <b>Will</b> {f.forderung}
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
          <h3>Zur Abstimmung</h3>
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
                      {provinzenText(g.provinzen)} · Stufe {g.stufe} · Abstimmung in {Math.max(0, g.abstimmung - world.day)} Tagen ({formatDateDe(addDays(world.date, g.abstimmung - world.day))})
                    </span>
                  </div>
                  <div className="stimmen-bar" aria-label={`Erwartet ${ja} Ja-Stimmen, nötig ${REGELN.mehrheit}`}>
                    <div className="stimmen-ja" style={{ width: `${Math.min(100, (ja / 600) * 100)}%` }} />
                    <div className="stimmen-marke" style={{ left: `${(REGELN.mehrheit / 600) * 100}%` }} title="301: Mehrheit" />
                  </div>
                  <div className="stimmen-zeile">
                    <span>
                      erwartet <strong>{ja}</strong> Ja{g.absprachen > 0 ? ` (davon ${g.absprachen} durch Absprachen)` : ""} · nötig {REGELN.mehrheit}
                    </span>
                    <button className="pd-btn quiet klein" onClick={() => zeigeImHalbrund(g.id)} title="Die erwartete Abstimmung im Halbrund oben zeigen">
                      Im Halbrund zeigen
                    </button>
                    <span className={`stimmen-urteil urteil-${gs.urteil}`}>
                      {gs.urteil === "sicher" ? "Mehrheit steht" : gs.urteil === "knapp" ? `Knapp: es fehlen ${gs.luecke} Stimmen` : `Aussichtslos: es fehlen ${gs.luecke} Stimmen`}
                    </span>
                  </div>
                  {gs.sachParteien.length > 0 && (
                    <p className="stimmen-sach">
                      {gs.sachParteien.map((k) => PARTEI_NAME[k] ?? k).join(" und ")} stimm{gs.sachParteien.length === 1 ? "t" : "en"} mit, weil das Gesetz {gs.sachParteien.length === 1 ? "ihre" : "ihre"} Forderung erfüllt.
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
                        title="Absprachen mit Fraktionen; später wird eine Gegenleistung fällig"
                      >
                        Mehrheit sichern: +{gs.noetig} Stimmen <b>{gs.kosten}</b>
                      </button>
                    )}
                    {gs.aussichtslos && (
                      <p className="weg-warnung">
                        Stimmen zu kaufen würde {gs.kosten} Kapital kosten, Sie haben {Math.floor(spiel.kapital)}. Verhandeln Sie mit den Fraktionen oder ziehen Sie das Gesetz zurück.
                      </p>
                    )}
                    <button
                      className="pd-btn quiet"
                      onClick={() => {
                        setAntwort(zieheGesetzZurueck(world, g.id));
                        refresh();
                      }}
                      title="Gekaufte Stimmen sind verloren; ein Teil des Kapitals kommt zurück"
                    >
                      Zurückziehen <b>+{zurueck}</b>
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
