import { useState } from "react";
import type { World } from "../../sim/types";
import { staatsfinanzen } from "../../sim/staatsfinanzen";
import { t, zahl } from "../../i18n";
import { formatDateDe, formatMonthDe } from "../../sim/dates";
import "./staatsfinanzen.css";

export function Staatsfinanzen({ world, details = false }: { world: World; details?: boolean }) {
  const f = staatsfinanzen(world);
  const abschluss = world.economy.schuldenAbschluss;
  const [monatlich, setMonatlich] = useState(false);
  const betrag = (mrd: number) => t("sf.betrag", { n: zahl(mrd / (monatlich ? 12 : 1), 1) });
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
    <p className="sf-wachstum">{t("sf.wachstum", { datum: formatDateDe(f.basis.seit), real: zahl(f.realesWachstum, 1), preise: zahl(f.preisAnstieg, 1) })} <strong>{t("sf.wachstumHinweis")}</strong></p>
    {details && <>
      <div className="sf-rechnung">{(["einnahmen", "ausgaben"] as const).map(seite => <section key={seite} aria-label={t(`sf.${seite}`)}>
        <h4>{t(`sf.${seite}`)}</h4><dl>{f[seite].filter(z => Math.abs(z.quote) > 1e-9).map(z => <div key={z.id}><dt>{t(`sf.zeile.${z.id}`)}</dt><dd>{betrag(z.mrd)}</dd></div>)}
        <div className="sf-total"><dt>{t("sf.summe")}</dt><dd>{betrag(seite === "einnahmen" ? f.einnahmenMrd : f.ausgabenMrd)}</dd></div></dl>
      </section>)}</div>
      <p>{t("sf.rechnungHinweis")}</p><p>{t("sf.anteileHinweis")}</p>
      <p>{t("sf.realEinnahmen", { betrag: betrag(f.realeEinnahmenMrd), datum: formatDateDe(f.basis.seit) })}</p>
      <section className="sf-schulden" aria-label={t("sf.schuldenTitel")}>
        <h4>{t("sf.schuldenTitel")}</h4>
        <p>{t("sf.schuldenHeute", { betrag: zahl(f.schuldenMrd, 1), quote: zahl(world.economy.debtRatio, 2) })}</p>
        <p>{t("sf.kasseHeute", { betrag: zahl(f.kasseMrd, 2) })}</p>
        <p>{t("sf.kasseRegel")}</p>
        {abschluss ? <details>
          <summary>{t("sf.schuldenAbschluss", { monat: formatMonthDe(abschluss.monat) })}</summary>
          <dl>{([
            ["sf.schuldenVorher", abschluss.vorherMrd], ["sf.schuldenFluss", abschluss.defizitMrd],
            ["sf.schuldenFx", abschluss.wechselkursMrd],
            ...((abschluss.kasseEntnahmeMrd ?? 0) > 0 ? [["sf.kasseEntnahme", -abschluss.kasseEntnahmeMrd!] as const] : []),
            ...(abschluss.restUeberschussMrd > 0 ? [["sf.restUeberschuss", abschluss.restUeberschussMrd] as const] : []),
            ["sf.schuldenNachher", abschluss.nachherMrd],
          ] as const).map(([key, wert]) => <div key={key}><dt>{t(key)}</dt><dd>{t("sf.betrag", { n: zahl(wert, 2) })}</dd></div>)}</dl>
          <p>{t("sf.schuldenBelegText", { vorher: zahl(abschluss.bipVorherMrd, 1), nachher: zahl(abschluss.bipNachherMrd, 1) })}</p>
          {abschluss.kasseNachherMrd !== undefined && <p>{t("sf.kasseBeleg", { vorher: zahl(abschluss.kasseVorherMrd ?? 0, 2), nachher: zahl(abschluss.kasseNachherMrd, 2) })}</p>}
          {abschluss.restUeberschussMrd > 0 && <p>{t(abschluss.kasseNachherMrd === undefined ? "sf.restAltText" : "sf.restText")}</p>}
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
