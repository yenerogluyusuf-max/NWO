// Das Konflikt-Dossier (MIL-1 „Krieg als Vorgang“) in der Welt-Ansicht: Phase, Eskalation, Frontlage mit
// Trend, Erschöpfungsuhr, Lagebild mit ehrlichen Unsicherheits-Stufen (bekannt/vermutet/unsicher) und alle
// verfügbaren Handlungen mit Preisen. Der Präsident bestellt und verantwortet hier — er kommandiert nicht.

import type { World } from "../../sim/types";
import {
  KRIEG,
  PHASEN_NAME,
  RAHMUNG,
  aktiveKriege,
  demobSperreBis,
  doktrinPassung,
  eigenStaerke,
  fuehreKriegHandlungAus,
  gegnerStaerke,
  handlungenFuer,
  kriegMit,
  lagebild,
} from "../../sim/krieg";
import { addDays, formatDateDe } from "../../sim/dates";
import { land } from "../../sim/laender";

import { t } from "../../i18n";
import { Schauplatz } from "../krieg/Schauplatz";
import { Besatzung } from "../krieg/Besatzung";
const nf = (x: number) => String(Math.round(x));

/** Wort für die gegnerische Stärke, wenn das Lagebild nur eine grobe Einordnung hergibt. */
function einordnung(eigen: number, gegner: number): string {
  const d = gegner - eigen;
  if (d <= -15) return t("krieg.d.schwaecher");
  if (d <= 15) return t("krieg.d.ebenbuertig");
  return t("krieg.d.staerker");
}

export function KriegDossier({ world, landId, refresh }: { world: World; landId: string; refresh: () => void }) {
  const k = kriegMit(world, landId);
  if (!k) return <Besatzung world={world} onTat={() => refresh()} nurLand={landId} />;
  const l = land(landId);
  const handlungen = handlungenFuer(world, k.id);
  const bild = lagebild(world);
  const dok = doktrinPassung(world);
  const eigen = eigenStaerke(world, k);
  const gegner = gegnerStaerke(world, landId);
  const imKrieg = k.phase === "krieg" || k.phase === "waffenruhe";
  const trend = k.front > k.frontVorher + 0.5 ? "steigend" : k.front < k.frontVorher - 0.5 ? "fallend" : "stabil";
  const sperre = demobSperreBis(world);

  return (
    <section className="kd" aria-label={t("krieg.d.aria", { land: l.name })}>
      <header className={`kd-kopf kd-phase-${k.phase}`}>
        <b>{t("krieg.d.kopf", { phase: PHASEN_NAME[k.phase] })}</b>
        <span>
          {t("krieg.d.seit", { datum: formatDateDe(addDays(world.date, k.seit - world.day)) })}
          {k.rahmung ? ` · ${t("krieg.d.rahmung", { name: RAHMUNG[k.rahmung].name })}` : ""}
        </span>
      </header>

      <div className="kd-zeile" title={t("ui.welt.KriegDossier.c4f3a82")}>
        <span>{t("krieg.d.eskalation")}</span>
        <span className="we-balken" aria-hidden>
          <i style={{ width: `${k.eskalation}%` }} />
        </span>
        <b>{nf(k.eskalation)}</b>
      </div>

      {imKrieg && (
        <>
          <div className="kd-zeile" title={t("krieg.d.front.titel", { woche: k.woche })}>
            <span>{t("krieg.d.front")}</span>
            <span className="we-balken" aria-hidden>
              <i style={{ width: `${k.front}%` }} />
            </span>
            <b>
              {nf(k.front)} <em className={`kd-trend kd-trend-${trend}`}>{trend === "steigend" ? "↑" : trend === "fallend" ? "↓" : "→"} {t(`krieg.d.trend.${trend}`)}</em>
            </b>
          </div>
          <div className="kd-zeile" title={t("ui.welt.KriegDossier.fb1d897")}>
            <span>{t("ui.welt.KriegDossier.7c1b834")}</span>
            <span className="we-balken" aria-hidden>
              <i style={{ width: `${Math.max(0, k.uhr)}%` }} />
            </span>
            <b>{nf(k.uhr)}</b>
          </div>
          <p className="subtitle">
            {t("krieg.d.woche", { woche: k.woche, verluste: nf(k.verluste), mobil: t(k.mobilmachung === 2 ? "krieg.k.x.voll" : k.mobilmachung === 1 ? "krieg.k.x.teil" : "krieg.d.keine_mobil") })}
            {k.gefallene ? ` · ${t("krieg.d.gefallene", { zahl: k.gefallene })}` : ""}
          </p>
        </>
      )}

      <div className="kd-lagebild">
        <b>{t("krieg.d.lagebild", { stufe: t(`krieg.d.stufe.${bild.stufe}`) })}</b>
        <ul>
          <li>
            {t("krieg.d.eigen")} <b>{nf(eigen)}</b> <em>({t("krieg.d.stufe.bekannt")})</em>
          </li>
          <li>
            {t("krieg.d.gegner")}{" "}
            {bild.stufe === "bekannt" ? (
              <>
                <b>{nf(gegner)}</b> <em>({t("krieg.d.stufe.bekannt")})</em>
              </>
            ) : bild.stufe === "vermutet" ? (
              <>
                <b>
                  {nf(gegner - 10)}–{nf(gegner + 10)}
                </b>{" "}
                <em>({t("krieg.d.stufe.vermutet")})</em>
              </>
            ) : (
              <>
                <b>{t("krieg.d.unbekannt")}</b> <em>({t("krieg.d.stufe.unsicher")}: {einordnung(eigen, gegner)})</em>
              </>
            )}
          </li>
          <li>
            {t("krieg.d.erschoepfung")} <em>{t(k.uhrGegner >= 70 ? "krieg.d.ersch.gering" : k.uhrGegner >= 40 ? "krieg.d.ersch.wachsend" : "krieg.d.ersch.hoch")} ({t("krieg.d.ersch.vermutet")})</em>
          </li>
        </ul>
        <p className="subtitle">{bild.text}</p>
      </div>

      {dok.doktrin && (
        <p className={`kd-doktrin ${dok.konsistent ? "ok" : "warn"}`}>
          {t("krieg.d.doktrin", { name: dok.name ?? "" })} {dok.konsistent ? t("krieg.d.doktrin.ok") : t("krieg.d.doktrin.fehlt", { fehlt: dok.fehlt.join("; ") })}
        </p>
      )}

      <Schauplatz world={world} k={k} onTat={() => refresh()} />
      <Besatzung world={world} onTat={() => refresh()} nurLand={landId} />

      {sperre > world.day && <p className="kd-demob">{t("krieg.d.demob", { datum: formatDateDe(addDays(world.date, sperre - world.day)) })}</p>}

      <ul className="we-aktionen kd-handlungen">
        {handlungen.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              className="aktion-knopf"
              disabled={!h.moeglich}
              onClick={() => {
                fuehreKriegHandlungAus(world, k.id, h.id);
                refresh();
              }}
            >
              {h.label} <b>{h.pk}</b>
            </button>
            <span>{h.moeglich ? h.hinweis : h.grund}</span>
          </li>
        ))}
        {handlungen.length === 0 && <li className="subtitle">{t("ui.welt.KriegDossier.c605cdb")}</li>}
      </ul>
      {aktiveKriege(world).length >= KRIEG.maxAktiv && <p className="subtitle">{t("ui.welt.KriegDossier.66712ad")}</p>}
    </section>
  );
}
