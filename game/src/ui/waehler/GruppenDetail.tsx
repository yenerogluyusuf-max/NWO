// Eine Wählergruppe im Einzelnen: Stimmung und Verlauf, Ursachenkette, was sie will und stört, worauf sie achtet, wohin sie wechseln würde,
// was ihr jetzt helfen würde (mit Kosten, Nebenwirkungen und einer Vorschau) und was dazu schon auf dem Tisch liegt.

import { useMemo } from "react";
import type { World } from "../../sim/types";
import { NET } from "../../sim/modell";
import { SCHWELLE_TRAEGER, gruppenDetail, type Praeferenz } from "../../sim/waehler-detail";
import { entscheidungsMarken } from "../../sim/waehler-verlauf";
import { HilfeKarte } from "./HilfeKarte";
import { Kette } from "./Kette";
import { Sparkline } from "./Sparkline";
import { anzeigeName, monatText, nf, prozent, vz } from "./format";
import "../politik/design.css";

import { t } from "../../i18n";
export type DossierZiel = "schreibtisch" | "gespraech" | "parlament" | "programme";

interface Props {
  world: World;
  id: string;
  onMassnahme?: (id: string, richtung: 1 | -1) => void;
  onDossier?: (d: DossierZiel) => void;
}

const knotenName = (id: string) => NET.nodes[NET.index.get(id)!]!.name;

function StufenMesser({ stufe, seitStart }: { stufe: number; seitStart: number }) {
  const start = Math.max(0, Math.min(100, stufe - seitStart));
  return (
    <span className="wa-stufen" title={t("wd.stufenTitel", { s: Math.round(stufe), start: Math.round(start) })} aria-hidden>
      <i style={{ width: `${Math.max(0, Math.min(100, stufe))}%` }} />
      <b style={{ left: `${start}%` }} />
    </span>
  );
}

function PraeferenzListe({ titel, liste, richtung, onMassnahme }: { titel: string; liste: Praeferenz[]; richtung: 1 | -1; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  return (
    <div className="wa-pref">
      <h5>{titel}</h5>
      {liste.length === 0 ? (
        <p className="wa-leer">{t("ui.waehler.GruppenDetail.2f73695")}</p>
      ) : (
        <ul>
          {liste.map((p) => (
            <li key={p.id}>
              <div className="wa-pref-zeile">
                <button type="button" className="pd-btn quiet klein" onClick={() => onMassnahme?.(p.id, richtung)} title={t("ui.waehler.GruppenDetail.3c5dc86")}>
                  {p.name}
                </button>
                <StufenMesser stufe={p.stufe} seitStart={p.seitStart} />
                <span className="wa-pref-stufe">{Math.round(p.stufe)}</span>
              </div>
              {p.wirkt !== 0 && (
                <em className={p.wirkt > 0 ? "gut" : "schlecht"}>
                  {t(p.wirkt > 0 ? "wd.prefPlus" : "wd.prefMinus", { d: vz(p.seitStart, 0) })}
                </em>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GruppenDetail({ world, id, onMassnahme, onDossier }: Props) {
  const spiel = world.spiel!;
  const signatur = `${id}|${world.date.slice(0, 7)}|${Math.floor(spiel.kapital)}|${Object.keys(world.net.targets).length}|${Object.keys(world.net.ziele ?? {}).length}|${spiel.gesetze.length}|${spiel.ereignisse.length}|${spiel.zusagen.length}`;
  const d = useMemo(() => gruppenDetail(world, id), [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const marken = useMemo(() => entscheidungsMarken(world), [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const k = d.kurz;
  const knoten = NET.nodes[NET.index.get(id)!]!;
  const ueberTag = Math.round(d.tendenz.abstand);
  const gut = k.laune >= 50;
  const ohneTreiber = d.kette.length === 0;
  const w = d.wanderung;
  return (
    <div className="wa-detail">
      <header className="wa-kopf">
        <div className="wa-kopf-text">
          <h3>{k.name}</h3>
          <p className="wa-absicht">{d.absicht.charAt(0).toUpperCase() + d.absicht.slice(1)}.</p>
          <p className="wa-beschreibung">{knoten.text}</p>
        </div>
        <div className={`wa-zahl ${gut ? "gut" : "schlecht"}`}>
          <strong>{Math.round(k.laune)}</strong>
          <span>{d.wort}</span>
          {k.trend !== null && Math.abs(k.trend) >= 0.4 && (
            <em title={t("ui.waehler.GruppenDetail.a260d8a")}>
              {k.trend > 0 ? "▲" : "▼"} {t("wd.dreiMonate", { d: nf(Math.abs(k.trend)) })}
            </em>
          )}
        </div>
      </header>

      <p className="wa-fakten">
        {t(k.beitrag >= 0 ? "wd.faktenTraegt" : "wd.faktenKostet", { a: prozent(k.anteil), p: nf(Math.abs(k.beitrag), 1) })}
      </p>

      <div className="wa-verlauf">
        <Sparkline monate={d.verlauf.monate} werte={d.verlauf.werte} marken={marken} ziel={d.tendenz.ziel} beschriftung={t("wd.verlaufBeschriftung", { name: k.name })} />
        <p className="wa-verlauf-text">
          {Math.abs(ueberTag) < 2 ? t("wd.tendenz.bleibt") : t(ueberTag < 0 ? (ohneTreiber ? "wd.tendenz.faelltAbklingen" : "wd.tendenz.faellt") : ohneTreiber ? "wd.tendenz.steigtAbklingen" : "wd.tendenz.steigt", { ziel: nf(d.tendenz.ziel, 0) })}{" "}
          <span>{t("ui.waehler.GruppenDetail.060bd18")}</span>
        </p>
      </div>

      <section className="wa-abschnitt">
        <h4>{t("ui.waehler.GruppenDetail.050c8a6")}</h4>
        <p className="wa-unter">
          {t("ui.waehler.GruppenDetail.41851d6")}
        </p>
        {ohneTreiber ? (
          <p className="wa-leer">{t("ui.waehler.GruppenDetail.59ee3ac")}</p>
        ) : (
          <Kette glieder={d.kette} eltern={t("wd.kette.eltern")} {...(onMassnahme ? { onMassnahme } : {})} />
        )}
      </section>

      <section className="wa-abschnitt">
        <h4>{t("ui.waehler.GruppenDetail.4cd3541")}</h4>
        <div className="wa-pref-paar">
          <PraeferenzListe titel={t("wd.pref.mehr")} liste={d.praeferenzen.will} richtung={1} {...(onMassnahme ? { onMassnahme } : {})} />
          <PraeferenzListe titel={t("wd.pref.weniger")} liste={d.praeferenzen.hasst} richtung={-1} {...(onMassnahme ? { onMassnahme } : {})} />
        </div>
        <p className="wa-unter">{t("ui.waehler.GruppenDetail.4cb8bf4")}</p>
      </section>

      {d.sorgen.length > 0 && (
        <details className="wa-abschnitt wa-zu">
          <summary>
            <h4>{t("wd.sorgen.kopf")}</h4>
          </summary>
          <ul className="wa-sorgen">
            {d.sorgen.map((s) => (
              <li key={s.id} className={s.wirkt > 0 ? "gut" : s.wirkt < 0 ? "schlecht" : ""} title={s.text}>
                <span className="wa-sorge-pfeil" aria-hidden>
                  {s.wirkt === 0 ? "·" : s.wirkt > 0 ? "▲" : "▼"}
                </span>
                <span className="wa-sorge-name">
                  {anzeigeName(s.name, s.art)}
                  {s.art === "problem" && s.akutIn > 0 && <em className="wa-akut">{t("wd.sorgen.akut", { n: s.akutIn })}</em>}
                </span>
                <span className="wa-sorge-wert">
                  {t(s.vorzeichen > 0 ? "wd.sorgen.mehrGut" : "wd.sorgen.wenigerGut")} · {t("wd.sorgen.seitBeginn", { d: vz(s.seitStart) })}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <details className="wa-abschnitt wa-zu">
        <summary>
          <h4>{t("ui.waehler.GruppenDetail.9697ca8")}</h4>
        </summary>
        {w.neigung < 0.04 ? (
          <p className="wa-leer">{t("ui.waehler.GruppenDetail.1f0c475")}</p>
        ) : (
          <>
            <div className="wa-neigung">
              <span>{t("wd.wechselneigung")}</span>
              <span className="wa-neigung-balken" aria-hidden>
                <i style={{ width: `${Math.round(w.neigung * 100)}%` }} />
              </span>
              <strong>{prozent(w.neigung)}</strong>
            </div>
            <ul className="wa-ziele">
              {w.ziele.map((z) => (
                <li key={z.partei}>
                  <div className="wa-ziel-kopf">
                    <strong>{z.name}</strong>
                    {z.imLager && <em>{t("wa.wanderung.imLager")}</em>}
                    <span className={z.naehe >= 0.3 ? "gut" : z.naehe <= -0.3 ? "schlecht" : ""}>{t(z.naehe >= 0.3 ? "wd.naehe" : z.naehe <= -0.3 ? "wd.ferne" : "wd.neutral")} {vz(z.naehe)}</span>
                  </div>
                  {z.passt.length > 0 && <em className="wa-ziel-passt">{t("wd.passt", { liste: z.passt.join("; ") })}</em>}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="wa-unter">
          {t("wd.wechselErklaerung", { s: SCHWELLE_TRAEGER })}
        </p>
      </details>

      <section className="wa-abschnitt">
        <h4>{t("ui.waehler.GruppenDetail.6f22828")}</h4>
        <p className="wa-unter">
          {d.hilfen[0] ? t("wd.hilfenErklaerungIn", { m: d.hilfen[0].horizont }) : t("wd.hilfenErklaerung")}
        </p>
        {d.hilfen.length === 0 ? (
          <p className="wa-leer">{t("ui.waehler.GruppenDetail.3107378")}</p>
        ) : (
          <ul className="wa-hilfen">
            {d.hilfen.map((h) => (
              <HilfeKarte key={h.massnahme} h={h} world={world} ziel={{ id, name: k.name }} {...(onMassnahme ? { onMassnahme } : {})} />
            ))}
          </ul>
        )}
      </section>

      {d.regionen.spanne >= 1.5 && (
        <details className="wa-abschnitt wa-zu">
          <summary>
            <h4>{t("ui.waehler.GruppenDetail.c917748")}</h4>
          </summary>
          <ul className="wa-regionen">
            {d.regionen.regionen.map((r) => (
              <li key={r.region}>
                <span>{r.name}</span>
                <span className="wa-region-balken" aria-hidden>
                  <b />
                  <i className={r.abstand >= 0 ? "plus" : "minus"} style={{ width: `${Math.min(50, Math.abs(r.abstand) * 6)}%`, [r.abstand >= 0 ? "left" : "right"]: "50%" }} />
                </span>
                <strong className={r.abstand >= 0 ? "gut" : "schlecht"}>{vz(r.abstand)}</strong>
              </li>
            ))}
          </ul>
          {d.regionen.schlechteste && d.regionen.beste && (
            <p className="wa-unter">
              {t("wd.regionenSatz", { beste: d.regionen.beste.name, b: nf(d.regionen.beste.laune, 0), schlechteste: d.regionen.schlechteste.name, s: nf(d.regionen.schlechteste.laune, 0) })}
            </p>
          )}
        </details>
      )}

      {(d.handlungen.zusagen.length > 0 || d.handlungen.ereignisse.length > 0 || d.handlungen.berichte.length > 0) && (
        <section className="wa-abschnitt">
          <h4>{t("ui.waehler.GruppenDetail.862a8af")}</h4>
          <ul className="wa-tisch">
            {d.handlungen.zusagen.map((z) => (
              <li key={z.id}>
                <b>{t("wd.zusageAn", { von: z.von })}</b> {t("wd.zusageText", { text: z.text, massnahme: knotenName(z.massnahme), tage: Math.max(0, z.faellig - world.day) })}
                <button type="button" className="pd-btn quiet klein" onClick={() => onMassnahme?.(z.massnahme, z.richtung >= 0 ? 1 : -1)}>
                  {" "}
                  {t("wd.einloesen")}
                </button>
              </li>
            ))}
            {d.handlungen.ereignisse.map((e) => (
              <li key={e.id}>
                <b>{t("wd.offenesEreignis")}</b> {t("wd.ereignisText", { titel: e.titel, massnahme: knotenName(e.massnahme) })}
                {onDossier && (
                  <button type="button" className="pd-btn quiet klein" onClick={() => onDossier("schreibtisch")}>
                    {" "}
                    {t("wd.amSchreibtisch")}
                  </button>
                )}
              </li>
            ))}
            {d.handlungen.berichte.map((b) => (
              <li key={`${b.datum}-${b.titel}`}>
                <b>{t("wd.berichtKopf", { monat: monatText(b.datum.slice(0, 7)) })}</b> {b.titel} ({t(`wd.urteil.${b.urteil === "gut" || b.urteil === "schwach" || b.urteil === "gemischt" ? b.urteil : "ohne"}`)}): {b.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {onDossier && (
        <div className="wa-aktionen">
          <button type="button" className="pd-btn" onClick={() => onDossier("gespraech")}>
            {t("ui.waehler.GruppenDetail.862e943")}
          </button>
          <button type="button" className="pd-btn" onClick={() => onDossier("parlament")}>
            {t("wd.zumParlament")}
          </button>
          <button type="button" className="pd-btn" onClick={() => onDossier("programme")}>
            {t("wd.regierungsprogramm")}
          </button>
        </div>
      )}
    </div>
  );
}
