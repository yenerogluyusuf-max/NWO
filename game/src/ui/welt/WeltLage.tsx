// Die Lage eines Staates aus dem Weltmodell: Wirtschaft, Politik, Wahl und das, was sich zuletzt geändert hat. Alle Zahlen stammen aus dem
// Zustand; die Startwerte nennen ihre Herkunft (Weltbank, Dossier oder Spielparameter). Kleine Verläufe zeigen nur echte Monatswerte.

import type { World } from "../../sim/types";
import { lage, jungeNachrichten, nf } from "../../sim/welt-modell";
import { wahlSicht, letzteWahl } from "../../sim/welt-sicht";
import { addDays, formatDateDe } from "../../sim/dates";
import type { Code } from "../../data/welt-daten";

import { t } from "../../i18n";
function Verlauf({ werte, einheit, titel }: { werte: number[]; einheit: string; titel: string }) {
  if (werte.length < 3) return <span className="we-linie leer" title={t("ui.welt.WeltLage.a26a17b")}>{t("ui.welt.WeltLage.621f42c")}</span>;
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const spanne = max - min || 1;
  const pts = werte.map((v, i) => `${((i / (werte.length - 1)) * 100).toFixed(1)},${(22 - ((v - min) / spanne) * 18 - 2).toFixed(1)}`).join(" ");
  return (
    <svg className="we-linie" viewBox="0 0 100 24" preserveAspectRatio="none" role="img" aria-label={t("ui2.ui.welt.WeltLage.b6e0075", { p0: titel, p1: werte.length, p2: nf(werte[0]!), p3: nf(werte[werte.length - 1]!), p4: einheit })}>
      <title>{t("ui2.ui.welt.WeltLage.19679c4", { p0: titel, p1: nf(werte[0]!), p2: nf(werte[werte.length - 1]!), p3: einheit, p4: werte.length })}</title>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function Zahl({ label, wert, einheit, verlauf, gut }: { label: string; wert: string; einheit: string; herkunft?: string; verlauf?: number[]; gut?: "hoch" | "niedrig" | null }) {
  return (
    <div className={`we-zahl${gut ? ` gut-${gut}` : ""}`}>
      <span className="we-zahl-label">{label}</span>
      <strong>
        {wert} <em>{einheit}</em>
      </strong>
      {verlauf && <Verlauf werte={verlauf} einheit={einheit} titel={label} />}
    </div>
  );
}

function Balken({ label, wert, wort, schlecht }: { label: string; wert: number; wort?: string; schlecht?: boolean }) {
  return (
    <div className={`we-lagebalken${schlecht ? " schlecht" : ""}`}>
      <span>
        {label}
        <em>{wort ?? Math.round(wert)}</em>
      </span>
      <i style={{ ["--w" as string]: `${Math.max(0, Math.min(100, wert))}%` }} aria-hidden />
    </div>
  );
}

export function WeltLage({ world, id, onDienst }: { world: World; id: string; onDienst?: (ziel: string) => void }) {
  const l = lage(world, id);
  const wahl = wahlSicht(world, id);
  const letzte = letzteWahl(world, id);
  const news = jungeNachrichten(world, id, 4);
  const h = l.herkunft as Record<Code, string>;
  return (
    <section className="we-lage" aria-label={t("ui.welt.WeltLage.40ff8af")}>
      {l.krise && (
        <p className="we-krise" role="status">
          {t("ui2.ui.welt.WeltLage.b1a0571", { p0: l.krise.name, p1: formatDateDe(addDays(world.date, l.krise.bisTag - world.day)) })}
        </p>
      )}
      <div className="we-zahlen-raster">
        <Zahl label={t("ui2.ui.welt.WeltLage.f133e3f")} wert={nf(l.wachstum)} einheit="%" herkunft={h.wachstum} verlauf={l.verlauf.map((v) => v[0])} gut="hoch" />
        <Zahl label={t("ui2.ui.welt.WeltLage.5b4e842")} wert={nf(l.inflation)} einheit="%" herkunft={h.inflation} verlauf={l.verlauf.map((v) => v[1])} gut={"niedrig"} />
        <Zahl label={t("ui2.ui.welt.WeltLage.b845c55")} wert={nf(l.schulden, 0)} einheit="% BIP" herkunft={h.schulden} gut={"niedrig"} />
        <Zahl label={t("ui2.ui.welt.WeltLage.a81d742")} wert={nf(l.defizit)} einheit="% BIP" herkunft={h.defizit} gut="hoch" />
        <Zahl label={t("ui.welt.WeltLage.219669d")} wert={nf(l.ruestung)} einheit="% BIP" herkunft={h.ruestung} />
      </div>
      <div className="we-balken-raster">
        <Balken label={t("ui.welt.WeltLage.5f64955")} wert={l.stabilitaet} wort={l.stabilitaetWort} schlecht={l.stabilitaet < 35} />
        <Balken label={t("ui.welt.WeltLage.1520bcc")} wert={l.rueckhalt} schlecht={l.rueckhalt < 35} />
        <Balken label={t("ui2.ui.welt.WeltLage.13b4814")} wert={l.bedrohung} schlecht={l.bedrohung > 65} />
        {l.krieg >= 5 && <Balken label={t("ui2.ui.welt.WeltLage.c7f02c9")} wert={l.krieg} schlecht={l.krieg > 50} />}
      </div>
      <p className="we-regierung">
        <b>{l.regierungsform}</b> · {l.wahlText}
        {l.verlauf.length >= 3 && <span className="we-hinweis"> {t("ui2.ui.welt.WeltLage.b3a4ef7")} <Verlauf werte={l.verlauf.map((v) => v[2])} einheit="Punkte" titel={t("ui2.ui.welt.WeltLage.5f64955")} /></span>}
      </p>

      {wahl && (
        <div className="we-wahl">
          <b>
            {t("ui2.ui.welt.WeltLage.03d2e63", { p0: wahl.art, p1: wahl.datumDe })}
            <em> {t("ui2.ui.welt.WeltLage.5452636")} {wahl.monate <= 0 ? t("ui2.ui.welt.WeltLage.ffb9e15") : wahl.monate === 1 ? t("ui2.ui.welt.WeltLage.6480eaf") : t("ui2.ui.welt.WeltLage.6086276", { p0: wahl.monate })}</em>
          </b>
          <ul>
            <li>
              {t("ui2.ui.welt.WeltLage.2417b5d")} <span className={`we-haltung-chip k${wahl.fuehrung.kurs}`}>{wahl.fuehrung.wort}</span>
            </li>
            {wahl.herausforderer ? (
              <li>
                {t("ui2.ui.welt.WeltLage.9a2c876")} <span className={`we-haltung-chip k${wahl.herausforderer.kurs}`}>{wahl.herausforderer.wort}</span>, {wahl.herausforderer.staerke}
              </li>
            ) : wahl.monate > 5 ? (
              <li className="we-hinweis">{t("ui.welt.WeltLage.75f35d6")}</li>
            ) : null}
            <li>
              {t("ui2.ui.welt.WeltLage.947e23c")}{" "}
              {wahl.lagebild ? (
                <b>{t("ui2.ui.welt.WeltLage.9c6ac6c", { p0: wahl.lagebild.prozent })}</b>
              ) : (
                <span className="we-hinweis">{t("ui.welt.WeltLage.6ba8692")}</span>
              )}
              {wahl.lagebild && <span className="we-hinweis"> {t("ui2.ui.welt.WeltLage.c7a7688", { p0: wahl.lagebild.tage })}</span>}
            </li>
          </ul>
          {onDienst && wahl.offen && (
            <button type="button" className="link" onClick={() => onDienst(id)}>
              {t("ui2.ui.welt.WeltLage.55a2100")}
            </button>
          )}
        </div>
      )}
      {letzte && (
        <p className="we-letzte-wahl">
          <b>{t("ui.welt.WeltLage.568b1e8")}</b> {letzte.fakt}
        </p>
      )}

      {news.length > 0 && (
        <div className="we-geaendert">
          <b>{t("ui.welt.WeltLage.1d6b531")}</b>
          <ul>
            {news.map((n, i) => (
              <li key={`${n.tag}-${i}`}>
                <span className="we-datum">{formatDateDe(n.datum)}</span> <strong>{n.titel}</strong>
                <br />
                <span>{n.fakt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
