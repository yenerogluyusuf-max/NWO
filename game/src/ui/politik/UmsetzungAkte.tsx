// Umsetzung: Was beschlossen ist, was es kostet, was gerade umgesetzt wird und was die Beschlüsse bewirkt haben.
// Die Wirkungsberichte erscheinen hier nur als kurze Karten; die ganze Analyse steht im Reiter „Berichte“.

import { useState } from "react";
import type { World } from "../../sim/types";
import { formatDateDe } from "../../sim/dates";
import { provinzenText, setPolicy } from "../../sim/handeln";
import { geaenderteArtikel, verfassungStand } from "../../sim/verfassung";
import type { Bericht } from "../../sim/berichte";
import "./design.css";

import { t } from "../../i18n";
export interface OffeneUmsetzung {
  id: string;
  name: string;
  now: number;
  target: number;
  months: number;
  ort?: number[];
}

const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/** Kurzurteil eines Berichts: das feinere Urteil (`phase`), sonst das alte (`urteil`). */
function urteilVon(b: Bericht): { wort: string; klasse: "gut" | "warn" | "schlecht" | "still" } {
  switch (b.phase) {
    case "wirkt":
      return { wort: "wirkt", klasse: "gut" };
    case "gemischt":
      return { wort: "gemischt", klasse: "warn" };
    case "schwach":
      return { wort: "bisher schwach", klasse: "warn" };
    case "gegenlaeufig":
      return { wort: "wirkt gegenläufig", klasse: "schlecht" };
    case "zu_frueh":
      return { wort: "noch zu früh", klasse: "still" };
    default:
      return b.urteil === "gut" ? { wort: "wirkt", klasse: "gut" } : b.urteil === "gemischt" ? { wort: "gemischt", klasse: "warn" } : b.urteil === "schwach" ? { wort: "bisher schwach", klasse: "warn" } : { wort: "wirkt nicht", klasse: "schlecht" };
  }
}

export function UmsetzungAkte({
  world,
  refresh,
  offen,
  beschlossen,
  wirksam,
  onBerichtOeffnen,
}: {
  world: World;
  refresh: () => void;
  offen: OffeneUmsetzung[];
  /** Laufende Politikkosten nach allen Beschlüssen, Prozent des BIP je Jahr (negativ = Mehreinnahmen) */
  beschlossen: number;
  /** Davon schon wirksam */
  wirksam: number;
  onBerichtOeffnen?: (b: Bericht) => void;
}) {
  const spiel = world.spiel;
  const [alleBeschluesse, setAlleBeschluesse] = useState(false);
  const beschluesse = [...world.log].reverse().filter((l) => l.kind === "entscheidung");
  const berichte = [...(spiel?.berichte ?? [])].reverse();
  const beobachtet = spiel?.beobachtungen?.length ?? 0;
  const sichtBeschluesse = alleBeschluesse ? beschluesse : beschluesse.slice(0, 10);

  return (
    <div className="pd-umsetzung">
      {spiel?.verfassungsvorgang?.laufend && (
        <section className="pd-hinweiskarte">
          <p className="pd-ueber">{t("ui2.ui.politik.UmsetzungAkte.3e0a5c5")}</p>
          <p>{t("ui2.ui.politik.UmsetzungAkte.0f41c01", { p0: verfassungStand(world).zeile })}</p>
          <p className="pd-leise">{t("ui2.ui.politik.UmsetzungAkte.5418888", { p0: geaenderteArtikel(spiel.verfassungsvorgang.laufend.paket).map((x) => `„${x.artikel.name}: ${x.variante.name}“`).join(", ") })}</p>
        </section>
      )}

      <header className="pd-seitenkopf">
        <div>
          <p className="pd-ueber">{t("ui2.ui.politik.UmsetzungAkte.d9c0cc7")}</p>
          <h3>{t("ui2.ui.politik.UmsetzungAkte.7bb6605")}</h3>
          <p className="pd-lead">{t("ui.politik.UmsetzungAkte.2ea8b02")}</p>
        </div>
        <ul className="pd-zaehler" aria-label={t("ui2.ui.politik.UmsetzungAkte.426eea4")}>
          <li>
            <b>
              {beschlossen >= 0 ? "" : "+"}
              {nf(Math.abs(beschlossen))}
              <small> % BIP</small>
            </b>
            <span>{wirksam === 0 ? t("ui2.ui.politik.UmsetzungAkte.1e68ece") : t("ui2.ui.politik.UmsetzungAkte.b1c11a3", { p0: nf(Math.abs(wirksam)) })}</span>
          </li>
          <li>
            <b>{beschluesse.length}</b>
            <span>{t("ui.politik.UmsetzungAkte.00c5907")}</span>
          </li>
          <li className={offen.length > 0 ? "hell" : ""}>
            <b>{offen.length}</b>
            <span>{offen.length === 1 ? t("ui2.ui.politik.UmsetzungAkte.21675b8") : t("ui2.ui.politik.UmsetzungAkte.745b21d")}</span>
          </li>
        </ul>
      </header>

      <section className="pd-block">
        <h4>{t("ui2.ui.politik.UmsetzungAkte.c348a5c")}</h4>
        {offen.length === 0 ? (
          <p className="pd-leise">{t("ui.politik.UmsetzungAkte.a6d211a")}</p>
        ) : (
          <ul className="pd-um-liste">
            {offen.map((o) => (
              <li key={o.id} className="pd-um">
                <div className="pd-um-kopf">
                  <strong>
                    {o.name}
                    {o.ort ? ` ${provinzenText(o.ort)}` : ""}
                  </strong>
                  <button
                    className="pd-btn quiet klein"
                    onClick={() => {
                      setPolicy(world, o.id.replace("@", ""), Math.round(o.now), o.ort ?? null);
                      refresh();
                    }}
                    title={t("ui.politik.UmsetzungAkte.9a5129a")}
                  >
                    {t("ui2.ui.politik.UmsetzungAkte.d08e4cb")}
                  </button>
                </div>
                <div className="pd-um-zahlen">
                  <span>
                    {t("ui2.ui.politik.UmsetzungAkte.cedb067")} <b>{Math.round(o.now)}</b>
                  </span>
                  <span aria-hidden>→</span>
                  <span>
                    {t("ui2.ui.politik.UmsetzungAkte.44d1262")} <b>{Math.round(o.target)}</b>
                  </span>
                  <em>
                    {t("ui2.ui.politik.UmsetzungAkte.2ff812a", { p0: o.months })}{o.months === 1 ? "" : "e"}
                  </em>
                </div>
                <span className="pd-skala breit" aria-hidden>
                  <i style={{ width: `${Math.max(0, Math.min(100, o.now))}%` }} />
                  <b style={{ left: `${Math.max(0, Math.min(100, o.target))}%` }} title={t("ui2.ui.politik.UmsetzungAkte.44d1262")} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pd-block">
        <h4>{t("ui.politik.UmsetzungAkte.daf599e")}</h4>
        {berichte.length === 0 ? (
          <p className="pd-leise">
            {beobachtet > 0
              ? t("ui2.ui.politik.UmsetzungAkte.b65a475", { p0: beobachtet, p1: beobachtet === 1 ? "Beschluss wird" : "Beschlüsse werden" })
              : t("ui2.ui.politik.UmsetzungAkte.406517e")}
          </p>
        ) : (
          <ul className="pd-bericht-liste">
            {berichte.slice(0, 6).map((b, i) => {
              const u = urteilVon(b);
              const text = b.kurz ?? b.hinweis;
              return (
                <li key={`${b.tag}-${i}`} className={`pd-bericht ${u.klasse}`}>
                  <div className="pd-bericht-kopf">
                    <strong>{b.name ?? b.titel}</strong>
                    <span className={`pd-pill ${u.klasse}`}>{u.wort}</span>
                  </div>
                  <p className="pd-bericht-text">{text}</p>
                  <footer>
                    <span className="pd-leise">
                      {t("ui2.ui.politik.UmsetzungAkte.367b7c9", { p0: b.monate, p1: formatDateDe(b.datum) })}
                    </span>
                    {onBerichtOeffnen && (
                      <button className="pd-btn quiet klein" onClick={() => onBerichtOeffnen(b)}>
                        {t("ui.politik.UmsetzungAkte.46af725")}
                      </button>
                    )}
                  </footer>
                </li>
              );
            })}
          </ul>
        )}
        {berichte.length > 6 && <p className="pd-legende">{t("ui2.ui.politik.UmsetzungAkte.fbf11c6", { p0: berichte.length - 6 })}</p>}
      </section>

      <section className="pd-block">
        <h4>{t("ui.politik.UmsetzungAkte.55a1fdc")}</h4>
        {beschluesse.length === 0 ? (
          <p className="pd-leise">{t("ui.politik.UmsetzungAkte.250c953")}</p>
        ) : (
          <>
            <ol className="pd-zeitleiste">
              {sichtBeschluesse.map((l, i) => (
                <li key={i}>
                  <time>{formatDateDe(l.date)}</time>
                  <div>
                    <p>{l.text}</p>
                    {l.why && <p className="pd-leise">{l.why}</p>}
                  </div>
                </li>
              ))}
            </ol>
            {beschluesse.length > 10 && (
              <button className="pd-btn quiet" onClick={() => setAlleBeschluesse(!alleBeschluesse)}>
                {alleBeschluesse ? t("ui2.ui.politik.UmsetzungAkte.34a01ce") : t("ui2.ui.politik.UmsetzungAkte.b4645e8", { p0: beschluesse.length })}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
