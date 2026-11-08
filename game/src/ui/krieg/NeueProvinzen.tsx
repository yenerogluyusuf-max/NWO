// Welle 3, K5: Die neuen Provinzen und die besetzten Regionen erscheinen dort, wo man Provinzen und Geld liest (krieg.md Schritt 9):
// im Haushalt als eigener Posten und in der Provinzliste (Gesellschaft › Kommunen) als eigene Gruppe. Rechnet nichts selbst:
// `besatzungHaushalt` ist dieselbe Summe, die der Monatsabschluss bucht (sim/besatzung.ts).

import type { World } from "../../sim/types";
import { datum, t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import { besatzungHaushalt } from "../../sim/besatzung";
import { aktiveProvinzen, wahlberechtigte } from "../../sim/provinzen-neu";
import { bipWertMrd } from "../../sim/staatsgeld";
import { addDays } from "../../sim/dates";
import "./besatzung.css";

/** Im Haushalt: Kosten der Besatzung und Steuern der neuen Provinzen im Jahr (in Mrd. Lira und % des BIP). */
export function BesatzungsPosten({ world }: { world: World }) {
  useSprache();
  const h = besatzungHaushalt(world);
  if (!h.regionen) return null;
  const bip = bipWertMrd(world.economy);
  const mrd = (pBip: number) => zahl(Math.round(((pBip * 12 * bip) / 100) * 10) / 10, 1);
  return (
    <section className="bz-posten" aria-label={t("welle_k5.hh.titel")}>
      <h6>{t("welle_k5.hh.titel")}</h6>
      <dl className="bz-zahlen">
        <div className="schlecht"><dt>{t("welle_k5.hh.kosten")}</dt><dd>{t("welle_k5.ui.mrd", { n: mrd(h.kosten) })}<small>{t("welle_k5.hh.bip", { p: zahl(Math.round(h.kosten * 12 * 100) / 100, 2) })}</small></dd></div>
        {h.provinzen > 0 && <div><dt>{t("welle_k5.hh.steuern")}</dt><dd>{t("welle_k5.ui.mrd", { n: mrd(h.einnahmen) })}<small>{t("welle_k5.hh.bip", { p: zahl(Math.round(h.einnahmen * 12 * 1000) / 1000, 3) })}</small></dd></div>}
        <div><dt>{t("welle_k5.ui.regionen")}</dt><dd>{h.regionen}<small>{t("welle_k5.hh.provinzen", { n: h.provinzen })}</small></dd></div>
      </dl>
      <p className="bz-hinweis">{t("welle_k5.hh.kredit")}</p>
    </section>
  );
}

/** In der Provinzliste: die neuen Provinzen mit Kennziffer, Gouverneur, Eingliederung und Wahlkreis. */
export function NeueProvinzenListe({ world }: { world: World }) {
  useSprache();
  const liste = aktiveProvinzen(world);
  if (!liste.length) return null;
  return (
    <section className="bz-provinzliste" aria-label={t("welle_k5.liste.titel")}>
      <h4>{t("welle_k5.liste.titel")} <span>{liste.length}</span></h4>
      <ul>
        {liste.map((p) => (
          <li key={p.plaka}>
            <b>{p.plaka}</b>
            <span className="name">{t(`krieg.region.${p.region}`)}</span>
            <span className="partei">{t("welle_k5.liste.vali")}</span>
            <small>
              {t("welle_k5.liste.zeile", {
                ew: zahl(Math.round(p.einwohner / 1000) * 1000, 0),
                waehler: zahl(Math.round(wahlberechtigte(p) / 1000) * 1000, 0),
                bis: datum(addDays(world.date, p.eingliederungBis - world.day), "monat"),
              })}{" "}
              {p.sitze !== undefined ? t("welle_k5.liste.sitze", { n: p.sitze }) : t("welle_k5.liste.sitze_ab")}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
