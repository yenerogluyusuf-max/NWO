import { useState } from "react";
import type { World } from "../../sim/types";
import { staatsfinanzen } from "../../sim/staatsfinanzen";
import { t, zahl } from "../../i18n";
import { formatDateDe, formatMonthDe } from "../../sim/dates";
import { geld } from "../bausteine/zahlformat";
import "./staatsfinanzen.css";

export function Staatsfinanzen({ world, details = false }: { world: World; details?: boolean }) {
  const f = staatsfinanzen(world);
  const abschluss = world.economy.schuldenAbschluss;
  const [monatlich, setMonatlich] = useState(false);
  // Welle B1: Beträge wie im Haushaltskopf (ab 1.000 Mrd. in Bio.), damit Kopf und Rechnung dieselbe Zahl zeigen
  const betrag = (mrd: number) => geld(mrd / (monatlich ? 12 : 1));
  return <section className="sf-finanzbuch" aria-label={t("sf.titel")}>
    <header className="sf-kopf">
      <div><small>{t("sf.kicker")}</small><h3>{t("sf.titel")}</h3></div>
      <div className="sf-zeit" role="group" aria-label={t("sf.zeitraum")}>
        <button type="button" aria-pressed={!monatlich} onClick={() => setMonatlich(false)}>{t("sf.jahr")}</button>
        <button type="button" aria-pressed={monatlich} onClick={() => setMonatlich(true)}>{t("sf.monat")}</button>
      </div>
    </header>
    <dl className="sf-summen">
      <div><dt>{t("sf.einnahmen")}</dt><dd>{betrag(f.einnahmenMrd)}<small>{t("sf.einnahmenHinweis")}</small></dd></div>
      <div><dt>{t("sf.ausgaben")}</dt><dd>{betrag(f.ausgabenMrd)}<small>{t("sf.ausgabenHinweis")}</small></dd></div>
      <div className={f.kreditMrd > 0 ? "sf-kredit" : "sf-plus"}><dt>{t(f.kreditMrd > 0 ? "sf.kredit" : "sf.ueberschuss")}</dt><dd>{betrag(Math.abs(f.kreditMrd))}<small>{t(f.kreditMrd > 0 ? "sf.kreditHinweis" : "sf.plusHinweis")}</small></dd></div>
    </dl>
    <p className="sf-laufend">{t(monatlich ? "sf.monatsrate" : "sf.jahresrate")}</p>
    {/* Welle B1: Wachstum und Preise als zwei Kennzahlen statt Satz und Belehrung */}
    <dl className="sf-wachstum">
      <div><dt>{t("welle_b1.sf.real", { datum: formatDateDe(f.basis.seit) })}</dt><dd>{zahl(f.realesWachstum, 1)} %</dd></div>
      <div><dt>{t("welle_b1.sf.preise")}</dt><dd>{zahl(f.preisAnstieg, 1)} %</dd></div>
      {details && <div><dt>{t("welle_b1.sf.realEinnahmen", { datum: formatDateDe(f.basis.seit) })}</dt><dd>{betrag(f.realeEinnahmenMrd)}</dd></div>}
    </dl>
    {details && <>
      <div className="sf-rechnung">{(["einnahmen", "ausgaben"] as const).map(seite => <section key={seite} aria-label={t(`sf.${seite}`)}>
        <h4>{t(`sf.${seite}`)}</h4><dl>{f[seite].filter(z => Math.abs(z.quote) > 1e-9).map(z => <div key={z.id}><dt>{t(`sf.zeile.${z.id}`)}</dt><dd>{betrag(z.mrd)}</dd></div>)}
        <div className="sf-total"><dt>{t("sf.summe")}</dt><dd>{betrag(seite === "einnahmen" ? f.einnahmenMrd : f.ausgabenMrd)}</dd></div></dl>
      </section>)}</div>
      <section className="sf-schulden" aria-label={t("sf.schuldenTitel")}>
        <h4>{t("sf.schuldenTitel")}</h4>
        <dl className="sf-kz">
          <div><dt>{t("welle_b1.sf.bestand")}</dt><dd>{geld(f.schuldenMrd)}</dd><small>{t("welle_b1.sf.quote", { n: zahl(world.economy.debtRatio, 2) })}</small></div>
          <div><dt>{t("welle_b1.sf.kasse")}</dt><dd>{geld(f.kasseMrd)}</dd><small>{t("welle_b1.sf.kasseRegel")}</small></div>
        </dl>
        {abschluss ? <details>
          <summary>{t("sf.schuldenAbschluss", { monat: formatMonthDe(abschluss.monat) })}</summary>
          <dl>{([
            ["sf.schuldenVorher", abschluss.vorherMrd], ["sf.schuldenFluss", abschluss.defizitMrd],
            ["sf.schuldenFx", abschluss.wechselkursMrd],
            ...((abschluss.kasseEntnahmeMrd ?? 0) > 0 ? [["sf.kasseEntnahme", -abschluss.kasseEntnahmeMrd!] as const] : []),
            ...(abschluss.restUeberschussMrd > 0 ? [["sf.restUeberschuss", abschluss.restUeberschussMrd] as const] : []),
            ["sf.schuldenNachher", abschluss.nachherMrd],
          ] as const).map(([key, wert]) => <div key={key}><dt>{t(key)}</dt><dd>{t("sf.betrag", { n: zahl(wert, 2) })}</dd></div>)}
            <div><dt>{t("welle_b1.sf.bip")}</dt><dd>{t("welle_b1.sf.vonBis", { vorher: geld(abschluss.bipVorherMrd), nachher: geld(abschluss.bipNachherMrd) })}</dd></div>
            {abschluss.kasseNachherMrd !== undefined && <div><dt>{t("welle_b1.sf.kasse")}</dt><dd>{t("welle_b1.sf.vonBis", { vorher: geld(abschluss.kasseVorherMrd ?? 0), nachher: geld(abschluss.kasseNachherMrd) })}</dd></div>}
          </dl>
          {abschluss.restUeberschussMrd > 0 && <p className="sf-zeile">{t(abschluss.kasseNachherMrd === undefined ? "sf.restAltText" : "sf.restText")}</p>}
        </details> : <p>{t("sf.schuldenNochOffen")}</p>}
      </section>
      <dl className="sf-ressourcen">
        <div><dt>{t("sf.geld")}</dt><dd>{t("sf.geldText")}</dd></div>
        <div><dt>{t("sf.politik")}</dt><dd>{t("sf.politikText")}</dd></div>
        <div><dt>{t("sf.zeit")}</dt><dd>{t("sf.zeitText")}</dd></div>
      </dl>
    </>}
  </section>;
}
