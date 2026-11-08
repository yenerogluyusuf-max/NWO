// Die Lage eines laufenden Krieges als Karte (Welle 3, K3; ENTSCHEIDUNGEN Z: Zahlen statt Sätze). Vorbild ist der Kopf von Wirtschaft › Haushalt:
// große Kennzahlen mit kleinem Etikett, ein schmaler Balken, darunter eine Zeile mit Operation, Tempo, Mobilmachung und Wendepunkten.
// Dieselbe Karte steht in der Kriegsakte und, kleiner, auf dem Schreibtisch. Alle Zahlen kommen aus dem Vorgang (sim/krieg.ts).

import type { KriegVorgang } from "../../sim/krieg-typen";
import { RUECKHALT_MAX } from "../../sim/krieg";
import { WENDEPUNKT } from "../../sim/ereignisse-wendepunkte";
import { schauplatzFuer, tempoVon, zielRegionen } from "../../sim/kriegsschauplatz";
import { operationsTiefe } from "../../sim/operationen";
import { istFernkonflikt } from "../../sim/fernkonflikt";
import { t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import "./operation.css";

const n0 = (x: number) => zahl(Math.round(x), 0);
const vz = (x: number) => (x > 0 ? "+" : x < 0 ? "−" : "±") + zahl(Math.abs(Math.round(x)), 0);

/** Wie zermürbt der Gegner wirkt; die genaue Zahl kennt das Lagebild nur vermutet (wie in der Akte). */
const gegnerWort = (uhr: number) => t(uhr >= 70 ? "welle_k3.lage.gegner_wort.gering" : uhr >= 40 ? "welle_k3.lage.gegner_wort.wachsend" : "welle_k3.lage.gegner_wort.hoch");

export function Lagekarte({ k, klein = false }: { k: KriegVorgang; klein?: boolean }) {
  useSprache();
  const fern = istFernkonflikt(k.land);
  const ziel = schauplatzFuer(k.land) ? zielRegionen(k).filter((r) => r.tiefe <= operationsTiefe(k)) : [];
  const genommen = ziel.filter((r) => k.regionen?.[r.id] === "eigen").length;
  const trend = k.front - k.frontVorher;
  const uhr = Math.max(0, Math.min(RUECKHALT_MAX, k.uhr));
  const wp = Object.keys(k.wendepunkte ?? {}).filter((id) => id.startsWith("krieg_wp_")).length;
  const schlecht = (b: boolean) => (b ? "schlecht" : undefined);
  return (
    <section className={`kl3${klein ? " klein" : ""}`} aria-label={t("welle_k3.lage.kopf", { woche: k.woche })}>
      {!klein && <h5 className="kl3-titel">{t("welle_k3.lage.kopf", { woche: k.woche })}</h5>}
      <dl className="kl3-kern">
        <div className={schlecht(k.front < 50)}>
          <dt>{fern ? t("welle_k1.fern.lage") : t("welle_k3.lage.front")}</dt>
          <dd>
            {n0(k.front)}
            <small>{t("welle_k3.lage.trend", { d: vz(trend) })}</small>
          </dd>
          <span className="kl3-balken" aria-hidden><i style={{ width: `${Math.max(0, Math.min(100, k.front))}%` }} /><u /></span>
        </div>
        <div className={schlecht(uhr < 40)}>
          <dt>{t("welle_k3.lage.rueckhalt")}</dt>
          <dd>{n0(uhr)}</dd>
          <span className="kl3-balken" aria-hidden><i style={{ width: `${uhr}%` }} /></span>
        </div>
        <div className={schlecht((k.gefallene ?? 0) >= WENDEPUNKT.gefalleneAb)}>
          <dt>{t("welle_k3.lage.gefallene")}</dt>
          <dd>{n0(k.gefallene ?? 0)}</dd>
        </div>
        {ziel.length > 0 && (
          <div>
            <dt>{t("welle_k3.lage.regionen")}</dt>
            <dd>{t("welle_k3.lage.regionen_wert", { n: genommen, m: ziel.length })}</dd>
          </div>
        )}
        <div>
          <dt>{t("welle_k3.lage.gegner")}</dt>
          <dd className="kl3-wort">{gegnerWort(k.uhrGegner)}</dd>
        </div>
        {klein && (
          <div>
            <dt>{t("welle_k3.lage.woche")}</dt>
            <dd>{k.woche}</dd>
          </div>
        )}
      </dl>
      {!klein && (
        <ul className="kl3-zeile">
          <li><span>{t("welle_k3.lage.form")}</span> <b>{k.operation ? t(`welle_k3.op.${k.operation}.name`) : t("welle_k3.lage.form_keine")}{k.verbuendete === "sna" ? ` · ${t("welle_k3.lage.sna")}` : ""}</b></li>
          <li><span>{t("krieg.ui.tempo")}</span> <b>{t(`krieg.tempo.${tempoVon(k)}.name`)}</b></li>
          <li><span>{t("welle_k3.lage.mobil")}</span> <b>{t(k.mobilmachung === 2 ? "krieg.k.x.voll" : k.mobilmachung === 1 ? "krieg.k.x.teil" : "krieg.d.keine_mobil")}</b></li>
          <li><span>{t("welle_k3.lage.wendepunkte")}</span> <b>{t("welle_k3.lage.wendepunkte_wert", { n: wp, m: WENDEPUNKT.maxJeKrieg })}</b></li>
        </ul>
      )}
    </section>
  );
}
