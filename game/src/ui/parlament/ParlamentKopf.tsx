// Kopf des Parlament-Fensters: Halbrund mit Mehrheitslinie, Fraktionsliste, erwartetes Abstimmungsverhalten je Gesetz und die letzten Abstimmungen.

import { useEffect, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { REGELN, stimmenSicht } from "../../sim/handeln";
import { VERFASSUNG_REGELN } from "../../sim/verfassung";
import { formatDateDe } from "../../sim/dates";
import { parlamentsLage, ROLLEN_WORT } from "./lage";
import { amAnsichtBeobachten, letzteAbstimmungen, spieleAbstimmungAb } from "./abstimmung";
import { FARBEN_PAPIER, Sitzplan, zustandFarbe } from "./Halbrund";
import { verteileErwartung, vorgabeFuer, zaehleZustaende, zustandJeSitz, ZUSTAENDE, type Zustand } from "./stimmen";
import { t } from "../../i18n";
import "../politik/design.css";
import "./parlament.css";
import { gesetzName, massnahmenName } from "../../sim/gesetz-name";

const ZUSTAND_KURZ: Record<Zustand, string> = { fest: "Lager", zusage: "Zusage", wackelig: "wackelig", offen: "offen", nein: "Nein" };
const ZUSTAND_HILFE: Record<Zustand, string> = {
  fest: "Sitze des eigenen Lagers: stimmen mit Ja",
  zusage: "Duldung, Sachbündnis oder gekaufte Absprache",
  wackelig: "Übertritte aus der Opposition, die vom Ansehen des Präsidenten abhängen",
  offen: "Liegt in der Spanne der Schätzung: kann kippen",
  nein: "Stimmen mit Nein",
};
const zahl = (x: number) => x.toLocaleString("de-DE");

export function ParlamentKopf({ world }: { world: World }) {
  // Das Parlament ändert sich durch Verhandlungen mitten am Tag; die Rechnung ist klein, deshalb ohne Zwischenspeicher
  const lage = parlamentsLage(world);
  const [ansicht, setAnsicht] = useState<string>("sitze");
  const [hervor, setHervor] = useState<string | null>(null);
  const kopf = useRef<HTMLElement>(null);
  useEffect(
    () =>
      amAnsichtBeobachten((id) => {
        setAnsicht(id);
        kopf.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    [],
  );
  const gesetze = world.spiel?.gesetze ?? [];
  // Ein Gesetz, über das schon abgestimmt wurde, fällt zurück auf die Sitzverteilung
  const g = gesetze.find((x) => x.id === ansicht) ?? null;
  const erwartung = g !== null;
  let berechnet: { vorgabe: ReturnType<typeof vorgabeFuer>; z: ReturnType<typeof verteileErwartung>; sitze: Zustand[]; zahlen: Record<Zustand, number> } | null = null;
  if (lage && erwartung) {
    const vorgabe = vorgabeFuer(world, g);
    const z = verteileErwartung(lage, vorgabe);
    berechnet = { vorgabe, z, sitze: zustandJeSitz(lage, z), zahlen: zaehleZustaende(z) };
  }
  if (!lage) return null;

  const sicht = stimmenSicht(world);
  const ja = g && berechnet ? berechnet.vorgabe.erwartet + g.absprachen : (berechnet?.vorgabe.erwartet ?? sicht.erwartet);
  const fehlt = REGELN.mehrheit - (lage.lager + lage.duldung);
  const letzte = letzteAbstimmungen(world, 5);
  const zusatz = g?.absprachen ?? 0;
  const spanneVon = (berechnet?.vorgabe.niedrig ?? sicht.low) + zusatz;
  const spanneBis = (berechnet?.vorgabe.hoch ?? sicht.high) + zusatz;
  const jaSumme = berechnet ? berechnet.zahlen.fest + berechnet.zahlen.zusage + berechnet.zahlen.wackelig : 0;

  return (
    <section ref={kopf} className="par-kopf">
      <header className="pd-seitenkopf">
        <div>
          <p className="pd-ueber">{t("ui2.ui.parlament.ParlamentKopf.e9f977f")}</p>
          <h3>{t("ui2.ui.parlament.ParlamentKopf.5473a56")}</h3>
          <p className="pd-lead">
            {t("ui2.ui.parlament.ParlamentKopf.418c8d2", { p0: zahl(lage.gesamt), p1: REGELN.mehrheit, p2: VERFASSUNG_REGELN.mehrheit, p3: VERFASSUNG_REGELN.direkt })}
          </p>
        </div>
        <ul className="pd-zaehler" aria-label={t("ui2.ui.parlament.ParlamentKopf.5b4e832")}>
          <li className={lage.lager >= REGELN.mehrheit ? "" : "rot"}>
            <b>{zahl(lage.lager)}</b>
            <span>{fehlt > 0 ? t("ui2.ui.parlament.ParlamentKopf.9c648d0", { p0: fehlt }) : t("ui2.ui.parlament.ParlamentKopf.316c13d")}</span>
          </li>
          {lage.duldung > 0 && (
            <li>
              <b>{zahl(lage.duldung)}</b>
              <span>{t("ui2.ui.parlament.ParlamentKopf.56aedb8")}</span>
            </li>
          )}
          <li>
            <b>{zahl(lage.opposition)}</b>
            <span>{t("ui2.ui.parlament.ParlamentKopf.bcf3982")}</span>
          </li>
        </ul>
      </header>

      {gesetze.length > 0 && (
        <div className="par-ansicht" role="tablist" aria-label={t("ui2.ui.parlament.ParlamentKopf.841429a")}>
          <button role="tab" aria-selected={!g} className={`pd-btn${!g ? " on" : ""}`} onClick={() => setAnsicht("sitze")}>
            {t("ui2.ui.parlament.ParlamentKopf.73d352c")}
          </button>
          {gesetze.map((x) => (
            <button key={x.id} role="tab" aria-selected={g?.id === x.id} className={`pd-btn${g?.id === x.id ? " on" : ""}`} onClick={() => setAnsicht(x.id)} title={t("ui2.ui.parlament.ParlamentKopf.a967b90")}>
              {gesetzName(x)}
            </button>
          ))}
        </div>
      )}

      <div className="par-spalten">
        <div className="par-links">
      <Sitzplan
        lage={lage}
        modus={erwartung ? "erwartung" : "partei"}
        {...(berechnet ? { zustand: berechnet.sitze } : {})}
        hervor={hervor}
        farben={FARBEN_PAPIER}
        onHover={setHervor}
        aria={
          erwartung
            ? t("ui2.ui.parlament.ParlamentKopf.b296019", { p0: zahl(ja), p1: REGELN.mehrheit })
            : t("ui2.ui.parlament.ParlamentKopf.632b22f", { p0: lage.fraktionen.map((f) => `${f.name} ${f.sitze}`).join(", ") })
        }
        mitte={
          erwartung ? (
            <div className="par-mitte-inhalt">
              <strong className={ja >= REGELN.mehrheit ? "gut" : "schlecht"}>{zahl(ja)}</strong>
              <span>
                Ja erwartet
                <em>Spanne {spanneVon}–{spanneBis}</em>
              </span>
            </div>
          ) : (
            <div className="par-mitte-inhalt">
              <strong>{zahl(lage.lager)}</strong>
              <span>{fehlt > 0 ? `es fehlen ${fehlt}` : lage.lager < REGELN.mehrheit ? `mit Duldung ${lage.lager + lage.duldung}` : lage.hatLager ? "Regierungsmehrheit" : "eigene Mehrheit"}</span>
            </div>
          )
        }
      />

      {erwartung && berechnet ? (
        <ul className="par-zustaende" aria-label={t("ui2.ui.parlament.ParlamentKopf.ea62b10")}>
          {ZUSTAENDE.map((k) => (
            <li key={k} title={ZUSTAND_HILFE[k]}>
              <i style={{ background: zustandFarbe(FARBEN_PAPIER, k) }} />
              <span>{ZUSTAND_KURZ[k]}</span>
              <b>{zahl(berechnet.zahlen[k])}</b>
            </li>
          ))}
        </ul>
      ) : null}
      {erwartung && berechnet && (
        <p className="par-lesart">
          {g ? `„${gesetzName(g)}“: ` : ""}
          {ja >= REGELN.mehrheit ? t("ui2.ui.parlament.ParlamentKopf.bca73c3", { p0: zahl(jaSumme), p1: REGELN.mehrheit }) : t("ui2.ui.parlament.ParlamentKopf.d61f1c9", { p0: REGELN.mehrheit - ja })}
          {berechnet.vorgabe.sachParteien.length > 0 ? t("ui2.ui.parlament.ParlamentKopf.4f5a383", { p0: berechnet.vorgabe.sachParteien.join(" und ") }) : ""}
        </p>
      )}

      <div className="par-bilanz" aria-label={t("ui2.ui.parlament.ParlamentKopf.db43ef7")}>
        <div className="par-lager-balken" aria-hidden="true">
          <i className="lager" style={{ width: `${(lage.lager / lage.gesamt) * 100}%` }} />
          <i className="duldung" style={{ width: `${(lage.duldung / lage.gesamt) * 100}%` }} />
          <i className="opposition" style={{ width: `${(lage.opposition / lage.gesamt) * 100}%` }} />
          <s style={{ left: `${(REGELN.mehrheit / lage.gesamt) * 100}%` }} />
        </div>
        <div className="par-lager-zeile">
          <span>
            <i className="lager" />
            {t("ui2.ui.parlament.ParlamentKopf.f6e8cb0")} <b>{zahl(lage.lager)}</b>
          </span>
          {lage.duldung > 0 && (
            <span>
              <i className="duldung" />
              duldet <b>{zahl(lage.duldung)}</b>
            </span>
          )}
          <span>
            <i className="opposition" />
            {t("ui2.ui.parlament.ParlamentKopf.bcf3982")} <b>{zahl(lage.opposition)}</b>
          </span>
          <span className="par-marke">{t("ui2.ui.parlament.ParlamentKopf.8f8dc9b", { p0: REGELN.mehrheit })}</span>
        </div>
      </div>

        </div>
        <div className="par-rechts">
      <ul className="par-fraktionen">
        {lage.fraktionen.map((f) => (
          <li
            key={f.partei}
            className={`rolle-${f.rolle}${hervor === f.partei ? " on" : ""}${hervor && hervor !== f.partei ? " leise" : ""}`}
            onPointerEnter={() => setHervor(f.partei)}
            onPointerLeave={() => setHervor(null)}
          >
            <i className="par-punkt" style={{ background: f.farbe }} />
            <span className="par-name">
              {f.name}
              <em>{ROLLEN_WORT[f.rolle]}</em>
            </span>
            <span className="par-stark" aria-hidden="true">
              <i style={{ width: `${(f.sitze / lage.gesamt) * 100 * 2.2}%`, background: f.farbe }} />
            </span>
            <b>{f.sitze}</b>
            <span className="par-anteil">{f.anteil.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</span>
          </li>
        ))}
      </ul>


      {letzte.length > 0 && (
        <div className="par-letzte">
          <h4>{t("ui2.ui.parlament.ParlamentKopf.fec3800")}</h4>
          <ul>
            {letzte.map((a) => (
              <li key={`${a.tag}-${a.name}`} className={a.angenommen ? "ja" : "nein"}>
                <span className="par-l-stempel">{a.angenommen ? t("ui2.ui.parlament.ParlamentKopf.c2c80ce") : t("ui2.ui.parlament.ParlamentKopf.abgelehnt")}</span>
                <span className="par-l-name">
                  {massnahmenName(a.name)}
                  <em>
                    {t("ui2.ui.parlament.ParlamentKopf.04b6c47", { p0: formatDateDe(a.datum), p1: a.ja, p2: a.nein })}
                  </em>
                </span>
                <button className="pd-btn quiet klein" onClick={() => spieleAbstimmungAb(a)} title={t("ui2.ui.parlament.ParlamentKopf.a405833")}>
                  {t("ui2.ui.parlament.ParlamentKopf.97d7cee")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
        </div>
      </div>
    </section>
  );
}
