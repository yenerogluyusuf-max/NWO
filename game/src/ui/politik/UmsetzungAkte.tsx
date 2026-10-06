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
          <p className="pd-ueber">Verfassungsvorgang</p>
          <p>{verfassungStand(world).zeile} Die Werkstatt und alle Schritte stehen im Parlament-Fenster, Reiter „Verfassung“.</p>
          <p className="pd-leise">Paket: {geaenderteArtikel(spiel.verfassungsvorgang.laufend.paket).map((x) => `„${x.artikel.name}: ${x.variante.name}“`).join(", ")}</p>
        </section>
      )}

      <header className="pd-seitenkopf">
        <div>
          <p className="pd-ueber">Umsetzung</p>
          <h3>Von Beschluss zu Wirkung</h3>
          <p className="pd-lead">{t("ui.politik.UmsetzungAkte.2ea8b02")}</p>
        </div>
        <ul className="pd-zaehler" aria-label="Die Rechnung">
          <li>
            <b>
              {beschlossen >= 0 ? "" : "+"}
              {nf(Math.abs(beschlossen))}
              <small> % BIP</small>
            </b>
            <span>{wirksam === 0 ? "laufende Kosten im Jahr, noch nicht wirksam" : `laufende Kosten im Jahr, davon ${nf(Math.abs(wirksam))} % wirksam`}</span>
          </li>
          <li>
            <b>{beschluesse.length}</b>
            <span>{t("ui.politik.UmsetzungAkte.00c5907")}</span>
          </li>
          <li className={offen.length > 0 ? "hell" : ""}>
            <b>{offen.length}</b>
            <span>{offen.length === 1 ? "Umsetzung läuft" : "Umsetzungen laufen"}</span>
          </li>
        </ul>
      </header>

      <section className="pd-block">
        <h4>In Umsetzung</h4>
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
                    stoppen
                  </button>
                </div>
                <div className="pd-um-zahlen">
                  <span>
                    heute <b>{Math.round(o.now)}</b>
                  </span>
                  <span aria-hidden>→</span>
                  <span>
                    Ziel <b>{Math.round(o.target)}</b>
                  </span>
                  <em>
                    noch etwa {o.months} Monat{o.months === 1 ? "" : "e"}
                  </em>
                </div>
                <span className="pd-skala breit" aria-hidden>
                  <i style={{ width: `${Math.max(0, Math.min(100, o.now))}%` }} />
                  <b style={{ left: `${Math.max(0, Math.min(100, o.target))}%` }} title="Ziel" />
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
              ? `Noch kein Bericht fällig. ${beobachtet} ${beobachtet === 1 ? "Beschluss wird" : "Beschlüsse werden"} beobachtet; der erste Bericht erscheint sechs Monate nach dem Beschluss.`
              : "Sobald Sie ein Gesetz oder einen Erlass durchgebracht haben, wird seine Wirkung hier beobachtet."}
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
                      {b.monate} Monate nach dem Beschluss · {formatDateDe(b.datum)}
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
        {berichte.length > 6 && <p className="pd-legende">Weitere {berichte.length - 6} Berichte stehen im Reiter „Berichte“.</p>}
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
                {alleBeschluesse ? "Weniger anzeigen" : `Alle ${beschluesse.length} Beschlüsse anzeigen`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
