// Das Inventar des Landes: je Warengruppe Eigenversorgung, Lager, Ein- und Ausfuhr, Partner und ein Satz zur Lage.
// Links die Gruppen mit Autarkiebalken, rechts die gewählte Gruppe mit ihren Instrumenten (sim/gueter.ts).

import { useState } from "react";
import type { World } from "../../sim/types";
import { fuehreGutInstrumentAus, gueterSicht, gutInstrumente, type GutSicht } from "../../sim/gueter";
import { akteurName } from "../../sim/welt-modell";
import type { GutArt, GutId } from "../../data/gueter";
import { t, zahl } from "../../i18n";
import "./inventar.css";

const ARTEN: GutArt[] = ["nahrung", "wasser", "energie", "rohstoff", "industrie", "ruestung"];

const menge = (x: number): string => zahl(x, x >= 100 ? 0 : 1);
const tage = (x: number): string => (Number.isFinite(x) ? zahl(Math.round(x), 0) : "∞");

function Ampel({ s }: { s: GutSicht }) {
  if (s.ampel === "keine") return null;
  const n = s.zusatz > 0 ? s.reichweiteJetzt : s.reichweiteTage;
  return (
    <span className={`gi-ampel gi-ampel-${s.ampel}`} title={t(`gueter.ampel.${s.ampel}`)}>
      <i aria-hidden="true" />
      {t("gueter.tage", { n: tage(n) })}
    </span>
  );
}

function ton(s: GutSicht): "gut" | "mittel" | "schlecht" {
  if (s.fehlProzent > 0.5) return "schlecht";
  if (s.zusatz > 0.05 || s.autarkie < 50) return "mittel";
  return "gut";
}

function Balken({ s }: { s: GutSicht }) {
  return (
    <span className={`gi-balken gi-${ton(s)}`} aria-hidden="true">
      <span style={{ width: `${Math.max(2, Math.min(100, s.autarkie))}%` }} />
    </span>
  );
}

export function Inventar({ world, geaendert }: { world: World; geaendert: () => void }) {
  const sicht = gueterSicht(world);
  const [wahl, setWahl] = useState<GutId>("getreide");
  const [meldung, setMeldung] = useState<string | null>(null);
  if (!sicht.length) return <p className="wi-hinweis">{t("gueter.leer")}</p>;
  const s = sicht.find((x) => x.def.id === wahl) ?? sicht[0]!;
  const g = s.def;
  const einheit = g.einheit;
  const instrumente = gutInstrumente(world, g.id);
  const autark = sicht.filter((x) => x.def.id !== "ruestung" && x.autarkie >= 99.5).length;

  return (
    <div className="gi-inventar">
      <p className="wi-hinweis">{t("gueter.einleitung", { autark, gesamt: sicht.length - 1 })}</p>
      <div className="wi-lage">
        <aside className="wi-liste" aria-label={t("gueter.titel")}>
          {ARTEN.map((art) => {
            const zeilen = sicht.filter((x) => x.def.art === art);
            if (!zeilen.length) return null;
            return (
              <section key={art}>
                <h4>{t(`gueter.art.${art}`)}</h4>
                <ul>
                  {zeilen.map((z) => (
                    <li key={z.def.id}>
                      <button type="button" className={`wi-zeile gi-zeile${z.def.id === g.id ? " on" : ""}`} aria-pressed={z.def.id === g.id} onClick={() => { setWahl(z.def.id); setMeldung(null); }}>
                        <span className="wi-zeile-name">{t(`gueter.gut.${z.def.id}`)}</span>
                        <span className="wi-zeile-wert">{Math.round(z.autarkie)} %</span>
                        <Balken s={z} />
                        <Ampel s={z} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </aside>

        <section className="wi-detail">
          <header>
            <p className="kicker">{t(`gueter.art.${g.art}`)}</p>
            <h3>{t(`gueter.gut.${g.id}`)}</h3>
            <div className="wi-kopf">
              <span className="wi-gross">{Math.round(s.autarkie)} %<small> {t("gueter.autarkie")}</small></span>
              <Balken s={s} />
            </div>
            <p className={`gi-satz gi-${ton(s)}`}>{s.satz}</p>
          </header>

          {g.id === "ruestung" ? (
            <p className="wi-hinweis">{t("gueter.ruestungHinweis")}</p>
          ) : (
            <dl className="gi-bilanz">
              <div><dt>{t("gueter.produktion")}</dt><dd>{menge(s.produktion)} <small>{einheit}</small></dd></div>
              <div><dt>{t("gueter.verbrauch")}</dt><dd>{menge(s.verbrauch)} <small>{einheit}</small></dd></div>
              <div className="gi-ein"><dt>↓ {t("gueter.einfuhr")}</dt><dd>{menge(s.einfuhr)} <small>{einheit}</small></dd></div>
              <div className="gi-aus"><dt>↑ {t("gueter.ausfuhr")}</dt><dd>{menge(s.ausfuhr)} <small>{einheit}</small></dd></div>
              <div><dt>{t("gueter.lager")}</dt><dd>{menge(s.lager)} <small>{einheit}</small> <small>· {t("gueter.monate", { n: zahl(s.lagerMonate, 1) })}</small></dd></div>
              {s.ampel !== "keine" && (
                <div className={`gi-reichweite gi-ampel-${s.ampel}`}>
                  <dt>{t("gueter.reichweite")}</dt>
                  <dd>{tage(s.reichweiteTage)} <small>{t("gueter.tageEinheit")}</small>{s.zusatz > 0 && <small> · {t("gueter.reichweiteJetzt", { n: tage(s.reichweiteJetzt) })}</small>}</dd>
                </div>
              )}
              {s.blockiert > 0.005 && <div className="gi-aus-fall"><dt>{t("gueter.blockiert")}</dt><dd>{Math.round(s.blockiert * 100)} %</dd></div>}
            </dl>
          )}
          <p className="wi-gemessen">{t("gueter.jahr")}</p>

          {(g.lieferanten.length > 0 || g.kunden.length > 0) && (
            <div className="gi-partner">
              {g.lieferanten.length > 0 && (
                <div>
                  <h4>{t("gueter.lieferanten")}</h4>
                  <ul>{g.lieferanten.map((l) => <li key={l.land}>{akteurName(l.land)} <small>{l.anteil} %</small></li>)}</ul>
                </div>
              )}
              {g.kunden.length > 0 && (
                <div>
                  <h4>{t("gueter.kunden")}</h4>
                  <ul>{g.kunden.map((k) => <li key={k}>{akteurName(k)}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {g.beispiel && (
            <p className="wi-hinweis">
              {t("gueter.beispiel", { name: g.beispiel.name, produktion: zahl(g.beispiel.produktion, 1), verbrauch: zahl(g.beispiel.verbrauch, 1), einheit: g.beispiel.einheit, orte: g.beispiel.orte })}
            </p>
          )}

          {instrumente.length > 0 && (
            <div className="gi-instrumente">
              <h4>{t("gueter.instrumente")}</h4>
              {instrumente.map((iv) => (
                <button
                  key={iv.id}
                  type="button"
                  className="gi-instrument"
                  disabled={!iv.moeglich}
                  title={iv.grund}
                  onClick={() => {
                    const r = fuehreGutInstrumentAus(world, g.id, iv.id);
                    setMeldung(r.text);
                    if (r.ok) geaendert();
                  }}
                >
                  <b>{t(`gueter.instrument.${iv.id}${iv.id === "stopp" && s.ausfuhrStopp ? "_aus" : ""}`)}</b>
                  <span>{iv.wirkung}</span>
                  <small>{t("gueter.preis", { pk: iv.pk, bip: zahl(iv.bip, 2) })}</small>
                </button>
              ))}
              {meldung && <p className="wi-hinweis" role="status">{meldung}</p>}
            </div>
          )}

          <details className="gi-quelle">
            <summary>{t("gueter.quelle")}</summary>
            <p>{g.quelle}{g.pruefen ? ` ${t("gueter.pruefen")}` : ""}</p>
          </details>
        </section>
      </div>
    </div>
  );
}
