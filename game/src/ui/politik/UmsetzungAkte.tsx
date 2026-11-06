// Umsetzung: Was beschlossen ist, was es kostet, was gerade umgesetzt wird und was die Beschlüsse bewirkt haben.
// Die Wirkungsberichte erscheinen hier nur als kurze Karten; die ganze Analyse steht im Reiter „Berichte“.

import { useState } from "react";
import type { World } from "../../sim/types";
import { formatDateDe } from "../../sim/dates";
import { provinzenText, setPolicy } from "../../sim/handeln";
import { geaenderteArtikel, verfassungStand } from "../../sim/verfassung";
import type { Bericht } from "../../sim/berichte";
import { hatZustaende, skala, skalenArt, stufenName, tunWort } from "../../data/skalen";
import "./design.css";

import { t, zahl } from "../../i18n";
export interface OffeneUmsetzung {
  id: string;
  name: string;
  now: number;
  target: number;
  months: number;
  ort?: number[];
}

/** Kosten mit einer Nachkommastelle in der Sprache des Spielers (befund-B B-23) */
const nf = (x: number) => zahl(x, 1);

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
  onAendern,
}: {
  world: World;
  refresh: () => void;
  offen: OffeneUmsetzung[];
  /** Laufende Politikkosten nach allen Beschlüssen, Prozent des BIP je Jahr (negativ = Mehreinnahmen) */
  beschlossen: number;
  /** Davon schon wirksam */
  wirksam: number;
  onBerichtOeffnen?: (b: Bericht) => void;
  onAendern?: (x: { id: string; level: number; ort: number[] | null }) => void;
}) {
  const spiel = world.spiel;
  const [alleBeschluesse, setAlleBeschluesse] = useState(false);
  const beschluesse = [...world.log].reverse().filter((l) => l.kind === "entscheidung");
  const berichte = [...(spiel?.berichte ?? [])].reverse();
  const beobachtet = spiel?.beobachtungen?.length ?? 0;
  // ENTSCHEIDUNGEN Z: fünf jüngste Beschlüsse sichtbar, der Rest hinter „alle zeigen“
  const sichtBeschluesse = alleBeschluesse ? beschluesse : beschluesse.slice(0, 5);
  // Gezählt wird nur, was in Kraft gesetzt wurde: kein eingebrachter Entwurf, keine „Ziele der Amtszeit“ (B-23)
  const inKraft = beschluesse.filter((l) => l.beschluss || l.abstimmung?.angenommen).length;

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
          {/* ENTSCHEIDUNGEN Z: die Erklärung steht am Titel, die Zahlen rechts daneben */}
          <h3 title={t("ui.politik.UmsetzungAkte.2ea8b02")}>{t("ui2.ui.politik.UmsetzungAkte.7bb6605")}</h3>
        </div>
        <ul className="pd-zaehler" aria-label={t("ui2.ui.politik.UmsetzungAkte.426eea4")}>
          <li>
            <b>
              {beschlossen >= 0 ? "" : "+"}
              {nf(Math.abs(beschlossen))}
              <small> % BIP</small>
            </b>
            <span>{wirksam === 0 ? t("ui2.ui.politik.UmsetzungAkte.1e68ece") : nf(Math.abs(wirksam)) === nf(Math.abs(beschlossen)) ? t("ui2.ui.politik.UmsetzungAkte.voll") : t("ui2.ui.politik.UmsetzungAkte.b1c11a3", { p0: nf(Math.abs(wirksam)) })}</span>
          </li>
          <li>
            <b>{inKraft}</b>
            <span>{t("n4.bb.beschluesse", { n: inKraft })}</span>
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
            {offen.map((o) => {
              const id = o.id.split("@")[0]!;
              // Nächster Schritt über und unter dem Ziel: bei benannten Zuständen der Nachbarzustand, sonst 20 Punkte
              const regime = skalenArt(id) === "regime" || hatZustaende(id) ? skala(id, o.target).stufen : null;
              const hoch = regime ? regime.find((x) => x.w > o.target + 1)?.w : o.target < 99 ? Math.min(100, Math.round(o.target) + 20) : undefined;
              const tief = regime ? [...regime].reverse().find((x) => x.w < o.target - 1)?.w : o.target > 1 ? Math.max(0, Math.round(o.target) - 20) : undefined;
              return (
                <li key={o.id} className={`pd-um ${o.target > o.now ? "steigt" : "faellt"}`}>
                  <div className="pd-um-kopf">
                    <strong>
                      {o.name}
                      {o.ort ? ` ${provinzenText(o.ort)}` : ""}
                    </strong>
                    <em className="pd-um-dauer">{t("ui2.ui.politik.UmsetzungAkte.2ff812a", { p0: o.months })}{o.months === 1 ? "" : "e"}</em>
                  </div>
                  <div className="pd-um-weg">
                    <span className="pd-um-stand"><small>{t("ui2.ui.politik.UmsetzungAkte.cedb067")}</small><b>{stufenName(id, o.now)}</b></span>
                    <span className="pd-um-pfeil" aria-hidden>→</span>
                    <span className="pd-um-stand ziel"><small>{t("ui2.ui.politik.UmsetzungAkte.44d1262")}</small><b>{stufenName(id, o.target)}</b></span>
                  </div>
                  {/* Skala 0 bis 100 wie im Regler: gefüllt bis heute, Marke am Ziel */}
                  <span className="pd-skala breit" aria-hidden>
                    <i style={{ width: `${Math.max(0, Math.min(100, o.now))}%` }} />
                    <b style={{ left: `${Math.max(0, Math.min(100, o.target))}%` }} />
                  </span>
                  <div className="pd-um-tun">
                    {onAendern && hoch !== undefined && (
                      <button type="button" className="pd-btn klein" onClick={() => onAendern({ id, level: hoch, ort: o.ort ?? null })} title={t("um.weiterTitel", { ziel: stufenName(id, hoch) })}>
                        {t("um.weiter", { tun: tunWort(id, 1) })} <small>{stufenName(id, hoch)}</small>
                      </button>
                    )}
                    {onAendern && tief !== undefined && (
                      <button type="button" className="pd-btn quiet klein" onClick={() => onAendern({ id, level: tief, ort: o.ort ?? null })} title={t("um.wenigerTitel", { ziel: stufenName(id, tief) })}>
                        {t("um.weniger")} <small>{stufenName(id, tief)}</small>
                      </button>
                    )}
                    <button
                      type="button"
                      className="pd-btn quiet klein pd-um-stopp"
                      onClick={() => {
                        setPolicy(world, id, Math.round(o.now), o.ort ?? null);
                        refresh();
                      }}
                      title={t("ui.politik.UmsetzungAkte.9a5129a")}
                    >
                      {t("ui2.ui.politik.UmsetzungAkte.d08e4cb")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="pd-block">
        <h4>{t("ui.politik.UmsetzungAkte.daf599e")}</h4>
        {berichte.length === 0 ? (
          <p className="pd-leise">
            {beobachtet > 0
              ? t("n4.bb.beobachtet", { n: beobachtet })
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
                  {/* Die Begründung steht hinter dem Eintrag (Titel), damit die Zeitleiste eine Zeile je Beschluss bleibt */}
                  <div title={l.why}>
                    <p>{l.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            {beschluesse.length > 5 && (
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
