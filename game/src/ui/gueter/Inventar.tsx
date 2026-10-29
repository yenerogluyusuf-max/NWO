// Das Inventar des Landes: je Warengruppe Eigenversorgung, Lager, Ein- und Ausfuhr, Partner und ein Satz zur Lage.
// Links die Gruppen mit Autarkiebalken, rechts die gewählte Gruppe mit ihren Instrumenten (sim/gueter.ts).

import { useState } from "react";
import type { World } from "../../sim/types";
import { fuehreGutInstrumentAus, gueterSicht, gutInstrumente, type GutSicht } from "../../sim/gueter";
import { akteurName } from "../../sim/welt-modell";
import type { GutArt } from "../../data/gueter";
import { t, zahl } from "../../i18n";
import { Uebersicht, UbDetailKopf, UbHandlung, UbMehr, UbRueck, type UbKachel } from "../akte/Uebersicht";
import "./inventar.css";

const ARTEN: GutArt[] = ["nahrung", "wasser", "energie", "rohstoff", "industrie", "ruestung"];

const menge = (x: number): string => zahl(x, x >= 100 ? 0 : 1);
const tage = (x: number): string => (Number.isFinite(x) ? zahl(Math.round(x), 0) : "∞");

function ton(s: GutSicht): "gut" | "mittel" | "schlecht" {
  if (s.fehlProzent > 0.5) return "schlecht";
  if (s.zusatz > 0.05 || s.autarkie < 50) return "mittel";
  return "gut";
}

export function Inventar({ world, geaendert }: { world: World; geaendert: () => void }) {
  const sicht = gueterSicht(world);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  if (!sicht.length) return <p className="wi-hinweis">{t("gueter.leer")}</p>;
  const autark = sicht.filter((x) => x.def.id !== "ruestung" && x.autarkie >= 99.5).length;
  const knapp = sicht.filter((x) => x.ampel === "rot" || x.fehlProzent > 0.5).length;
  const kacheln: UbKachel[] = ARTEN.flatMap((art) =>
    sicht
      .filter((x) => x.def.art === art)
      .map((z): UbKachel => {
        const tn = ton(z);
        const n = z.zusatz > 0 ? z.reichweiteJetzt : z.reichweiteTage;
        return {
          id: z.def.id,
          gruppe: t(`gueter.art.${art}`),
          titel: t(`gueter.gut.${z.def.id}`),
          wert: `${Math.round(z.autarkie)} %`,
          anteil: z.autarkie / 100,
          ton: tn,
          ...(z.ampel !== "keine" ? { marke: { text: t("gueter.tage", { n: tage(n) }), ton: z.ampel === "rot" ? ("schlecht" as const) : z.ampel === "gelb" ? ("mittel" as const) : ("gut" as const) } } : {}),
        };
      }),
  );
  const detail = (id: string) => {
    const s = sicht.find((x) => x.def.id === id);
    if (!s) return null;
    const g = s.def;
    const einheit = g.einheit;
    const instrumente = gutInstrumente(world, g.id);
    return (
      <div className="gi-detail">
        <UbDetailKopf titel={t(`gueter.gut.${g.id}`)} unter={`${t(`gueter.art.${g.art}`)} · ${Math.round(s.autarkie)} % ${t("gueter.autarkie")}`} />
        <p className={`gi-satz gi-${ton(s)}`}>{s.satz}</p>
        <UbRueck antwort={meldung} />
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
        {instrumente.map((iv) => (
          <UbHandlung
            key={iv.id}
            titel={t(`gueter.instrument.${iv.id}${iv.id === "stopp" && s.ausfuhrStopp ? "_aus" : ""}`)}
            satz={iv.wirkung}
            ok={iv.moeglich}
            grund={iv.grund}
            preis={[iv.pk > 0 && t("ub.preis.kapital", { n: iv.pk }), iv.bip > 0 && t("militaer.ui.preis_bip", { bip: zahl(iv.bip, 2) })]}
            onTun={() => {
              const r = fuehreGutInstrumentAus(world, g.id, iv.id);
              setMeldung({ ok: r.ok, text: r.text });
              if (r.ok) geaendert();
            }}
          />
        ))}
        {(g.lieferanten.length > 0 || g.kunden.length > 0) && (
          <UbMehr titel={t("gueter.partner_titel")}>
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
            {g.beispiel && (
              <p className="wi-hinweis">
                {t("gueter.beispiel", { name: g.beispiel.name, produktion: zahl(g.beispiel.produktion, 1), verbrauch: zahl(g.beispiel.verbrauch, 1), einheit: g.beispiel.einheit, orte: g.beispiel.orte })}
              </p>
            )}
            <p className="wi-gemessen">{t("gueter.jahr")}</p>
          </UbMehr>
        )}
      </div>
    );
  };
  return (
    <div className="gi-inventar">
      <Uebersicht
        aria={t("gueter.titel")}
        dicht
        sortiert={false}
        lage={t("gueter.einleitung", { autark, gesamt: sicht.length - 1 })}
        zahlen={[{ label: t("gueter.zahl_knapp"), wert: String(knapp), ton: knapp ? "schlecht" : "gut" }]}
        kacheln={kacheln}
        start="getreide"
        detail={detail}
      />
    </div>
  );
}
