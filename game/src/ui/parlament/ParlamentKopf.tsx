// Kopf des Parlament-Fensters: Halbrund mit Mehrheitslinie, Fraktionsliste, erwartetes Abstimmungsverhalten je Gesetz und die letzten Abstimmungen.

import { useEffect, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { GESETZ_SCHWELLE, REGELN, gesetzPrognose, gesetzWeltAmVotum, stimmenSicht } from "../../sim/handeln";
import { GesetzesPrognoseHinweis } from "./GesetzesPrognoseHinweis";
import { VERFASSUNG_REGELN } from "../../sim/verfassung";
import { formatDateDe } from "../../sim/dates";
import { parlamentsLage, ROLLEN_WORT } from "./lage";
import { amAnsichtBeobachten, letzteAbstimmungen, spieleAbstimmungAb } from "./abstimmung";
import { FARBEN_PAPIER, Sitzplan, zustandFarbe } from "./Halbrund";
import { verteileErwartung, vorgabeFuer, zaehleZustaende, zustandJeSitz, ZUSTAENDE, type Zustand } from "./stimmen";
import { t, zahl as zahlFmt } from "../../i18n";
import "../politik/design.css";
import "./parlament.css";
import { gesetzName, massnahmenName } from "../../sim/gesetz-name";

// Wörter in der aktuellen Sprache (I-8)
const ZUSTAND_KURZ = (z: Zustand): string => t(`n4.pk.kurz.${z}`);
const ZUSTAND_HILFE = (z: Zustand): string => t(`n4.pk.hilfe.${z}`);
const zahl = (x: number) => zahlFmt(x);

export function ParlamentKopf({ world }: { world: World }) {
  // Das Parlament ändert sich durch Verhandlungen mitten am Tag; die Rechnung ist klein, deshalb ohne Zwischenspeicher
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
  const lage = parlamentsLage(g ? gesetzWeltAmVotum(world,g) : world);
  const prognose = g ? gesetzPrognose(world,g) : null;
  const erwartung = g !== null;
  let berechnet: { vorgabe: ReturnType<typeof vorgabeFuer>; z: ReturnType<typeof verteileErwartung>; sitze: Zustand[]; zahlen: Record<Zustand, number> } | null = null;
  if (lage && erwartung) {
    const vorgabe = vorgabeFuer(world, g);
    const z = verteileErwartung(lage, vorgabe);
    berechnet = { vorgabe, z, sitze: zustandJeSitz(lage, z), zahlen: zaehleZustaende(z) };
  }
  if (!lage) return null;

  const sicht = stimmenSicht(world);
  const ja = prognose?.ja ?? sicht.erwartet;
  const fehlt = REGELN.mehrheit - (lage.lager + lage.duldung);
  const letzte = letzteAbstimmungen(world, 5);
  const zusatz = (g?.absprachen ?? 0) + (g?.stimmenBonus ?? 0);
  const spanneVon = Math.max(0,Math.min(lage.gesamt,(berechnet?.vorgabe.niedrig ?? sicht.low) + zusatz));
  const spanneBis = Math.max(0,Math.min(lage.gesamt,(berechnet?.vorgabe.hoch ?? sicht.high) + zusatz));
  const jaSumme = berechnet ? berechnet.zahlen.fest + berechnet.zahlen.zusage + berechnet.zahlen.wackelig : 0;
  const schwelle = prognose?.schwelle ?? GESETZ_SCHWELLE;

  return (
    <section ref={kopf} className="par-kopf">
      <header className="pd-seitenkopf">
        <div>
          {/* Der Reiter heißt schon „Fraktionen und Abstimmung“; ohne zweite Überschrift beginnt die Seite mit der Regel und dem Halbrund */}
          {/* ENTSCHEIDUNGEN Z: die Regel als Kennzahlen statt als Satz; der volle Satz steht am Titel */}
          <dl className="par-kern" title={t("n4.pk.lead", { sitze: zahl(lage.gesamt), gesetz: GESETZ_SCHWELLE, mitglieder: REGELN.mehrheit, vf: VERFASSUNG_REGELN.mehrheit, direkt: VERFASSUNG_REGELN.direkt })}>
            <div><dt>{t("welle_b2.pk.sitze")}</dt><dd>{zahl(lage.gesamt)}</dd></div>
            <div><dt>{t("welle_b2.pk.gesetz")}</dt><dd>{GESETZ_SCHWELLE}</dd><small>{t("welle_b2.pk.gesetzKlein")}</small></div>
            <div><dt>{t("welle_b2.pk.mehrheit")}</dt><dd>{REGELN.mehrheit}</dd></div>
            <div><dt>{t("welle_b2.pk.verfassung")}</dt><dd>{VERFASSUNG_REGELN.mehrheit} / {VERFASSUNG_REGELN.direkt}</dd><small>{t("welle_b2.pk.verfassungKlein")}</small></div>
          </dl>
        </div>
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

      {prognose && <GesetzesPrognoseHinweis prognose={prognose}/>}
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
              <strong className={ja >= schwelle ? "gut" : "schlecht"}>{zahl(ja)}</strong>
              <span>
                {t("n4.pk.jaErwartet", { schwelle })}
                <em>{t("n4.pk.spanne", { von: spanneVon, bis: spanneBis })}</em>
              </span>
            </div>
          ) : (
            <div className="par-mitte-inhalt">
              <strong>{zahl(lage.lager)}</strong>
              <span>{fehlt > 0 ? t("n4.pk.fehlen", { n: fehlt, mitglieder: REGELN.mehrheit }) : lage.lager < REGELN.mehrheit ? t("n4.pk.mitDuldung", { n: lage.lager + lage.duldung }) : lage.hatLager ? t("n4.pk.regierungsmehrheit") : t("n4.pk.eigeneMehrheit")}</span>
            </div>
          )
        }
      />

      {erwartung && berechnet ? (
        <ul className="par-zustaende" aria-label={t("ui2.ui.parlament.ParlamentKopf.ea62b10")}>
          {ZUSTAENDE.map((k) => (
            <li key={k} title={k === "wackelig" ? t("gp.wackelig") : ZUSTAND_HILFE(k)}>
              <i style={{ background: zustandFarbe(FARBEN_PAPIER, k) }} />
              <span>{ZUSTAND_KURZ(k)}</span>
              <b>{zahl(berechnet.zahlen[k])}</b>
            </li>
          ))}
        </ul>
      ) : null}
      {erwartung && berechnet && (
        <p className="par-lesart">
          {g ? t("n4.pk.gesetzVor", { name: gesetzName(g) }) : ""}
          {ja >= schwelle ? t("ui2.ui.parlament.ParlamentKopf.bca73c3", { p0: zahl(jaSumme), p1: schwelle }) : t("ui2.ui.parlament.ParlamentKopf.d61f1c9", { p0: schwelle - ja })}
          {berechnet.vorgabe.sachParteien.length > 0 ? t("ui2.ui.parlament.ParlamentKopf.4f5a383", { p0: berechnet.vorgabe.sachParteien.join(" und ") }) : ""}
        </p>
      )}
      {erwartung && <p className="par-lesart">{t("gp.verteilung")}</p>}

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
            <span className="par-anteil" title={t("n4.pk.anteilHilfe")}>{t("n4.pk.anteil", { p: zahlFmt(f.anteil, 1) })}</span>
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
