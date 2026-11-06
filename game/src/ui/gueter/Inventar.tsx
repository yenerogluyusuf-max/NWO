import type { VersorgungsProgramm } from "../../sim/versorgungspolitik";
// Das Inventar des Landes: je Warengruppe Eigenversorgung, Lager, Ein- und Ausfuhr, Partner und ein Satz zur Lage.
// Links die Gruppen mit Autarkiebalken, rechts die gewählte Gruppe mit ihren Instrumenten (sim/gueter.ts).

import { useState } from "react";
import type { World } from "../../sim/types";
import { fuehreGutInstrumentAus, gueterSicht, gueterZustand, gutInstrumente, type GutSicht } from "../../sim/gueter";
import { VersorgungsLage } from "./VersorgungsLage";
import { addDays, formatDateDe } from "../../sim/dates";
import { akteurName } from "../../sim/welt-modell";
import type { GutArt } from "../../data/gueter";
import { t, zahl } from "../../i18n";
import { UbDetailKopf, UbHandlung, UbMehr, UbRueck, type UbKachel } from "../akte/Uebersicht";
import "./inventar.css";

const ARTEN: GutArt[] = ["nahrung", "wasser", "energie", "rohstoff", "industrie", "ruestung"];

const menge = (x: number): string => zahl(x, x >= 100 ? 0 : 1);
const tage = (x: number): string => (Number.isFinite(x) ? zahl(Math.round(x), 0) : "∞");

/** Ein Ring für die Eigenversorgung: voll bei 100 % und mehr (Befund D-17, Bild oben statt Strichen). */
function Ring({ anteil, ton }: { anteil: number; ton: string }) {
  const r = 18, u = 2 * Math.PI * r, voll = Math.max(0, Math.min(1, anteil));
  return (
    <svg className={`gi-ring-bild gi-${ton}`} viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r={r} className="gi-ring-grund" />
      <circle cx="22" cy="22" r={r} className="gi-ring-wert" strokeDasharray={`${(voll * u).toFixed(1)} ${u.toFixed(1)}`} transform="rotate(-90 22 22)" />
    </svg>
  );
}

function ton(s: GutSicht): "gut" | "mittel" | "schlecht" {
  if (s.fehlProzent > 0.5) return "schlecht";
  if (s.zusatz > 0.05 || s.autarkie < 50) return "mittel";
  return "gut";
}

export function Inventar({ world, geaendert, programm }: { world: World; geaendert: () => void; programm?: VersorgungsProgramm }) {
  const sicht = gueterSicht(world);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [ware, setWare] = useState<string | null>(null);
  if (!sicht.length) return <p className="wi-hinweis">{t("gueter.leer")}</p>;
  const autark = sicht.filter((x) => x.def.id !== "ruestung" && x.autarkie >= 99.5).length;
  const knapp = sicht.filter((x) => x.ampel === "rot" || x.fehlProzent > 0.5).length;
  const kacheln: UbKachel[] = ARTEN.flatMap((art) =>
    sicht
      .filter((x) => x.def.art === art)
      .map((z): UbKachel => {
        const tn = ton(z);
        const n = z.reichweiteTage;
        return {
          id: z.def.id,
          gruppe: t(`gueter.art.${art}`),
          titel: t(`gueter.gut.${z.def.id}`),
          wert: `${Math.round(z.autarkie)} %`,
          anteil: z.autarkie / 100,
          ton: tn,
          // Tag T5: Auf der Kachel nur die Zahl der Tage; was sie bedeutet, sagt die Legende oben (und der Titel der Kachel)
          ...(z.ampel !== "keine" ? { marke: { text: t("t5.vs.tage", { n: tage(n) }), ton: z.ampel === "rot" ? ("schlecht" as const) : z.ampel === "gelb" ? ("mittel" as const) : ("gut" as const) } } : {}),
        };
      }),
  );
  const detail = (id: string) => {
    const s = sicht.find((x) => x.def.id === id);
    if (!s) return null;
    const g = s.def;
    const einheit = g.einheit;
    const instrumente = gutInstrumente(world, g.id);
    const z = gueterZustand(world);
    const auftrag = z.auftraege?.find(o => o.gut === g.id);
    const quelleTag = z.quelleAbTag?.[g.id];
    const f = s.fluss;
    return (
      <div className="gi-detail">
        <UbDetailKopf titel={t(`gueter.gut.${g.id}`)} unter={`${t(`gueter.art.${g.art}`)} · ${Math.round(s.autarkie)} % ${t("gueter.autarkie")}`} />
        <p className={`gi-satz gi-${ton(s)}`}>{s.satz}</p>
        <UbRueck antwort={meldung} />
        {/* Tag T5: links die Rechnung der Ware, rechts was die Regierung tun kann */}
        <div className="gi-detail-spalten"><div className="gi-detail-rechnung">
        {g.id !== "ruestung" && <section className="vs-bilanz" aria-label={t("gueter.kette.vorschau")}>
          <h4>{t("gueter.kette.vorschau")}</h4>
          <p className="vs-hinweis">{t("gueter.kette.vorschauHinweis", { einheit })}</p>
          <dl>
            <div><dt>{t("gueter.kette.anfang")}</dt><dd>{menge(f.anfang)}</dd></div>
            <div><dt>+ {t("gueter.produktion")}</dt><dd>{menge(f.produktion)}</dd></div>
            <div><dt>+ {t("gueter.kette.lieferung")}</dt><dd>{menge(f.importiert)}</dd></div>
            <div><dt>− {t("gueter.kette.zivilGeliefert")}</dt><dd>{menge(f.geliefert)} / {menge(f.bedarf)}</dd></div>
            {f.militaerBedarf > 0 && <div><dt>− {t("gueter.kette.militaerGeliefert")}</dt><dd>{menge(f.militaerGeliefert)} / {menge(f.militaerBedarf)}</dd></div>}
            <div><dt>− {t("gueter.ausfuhr")}</dt><dd>{menge(f.exportiert)}</dd></div>
            {f.verlust > 0 && <div><dt>− {t("gueter.kette.ungenutzt")}</dt><dd>{menge(f.verlust)}</dd></div>}
            <div className="vs-summe"><dt>= {t("gueter.kette.ende")}</dt><dd>{menge(f.ende)}</dd></div>
          </dl>
          {f.fehl > 0.001 && <p className="vs-warnung">{t("gueter.kette.fehl", { menge: menge(f.fehl), einheit })}</p>}
          <p>{t("gueter.kette.rechnung", { import: zahl(f.importUsdMrd, 2), export: zahl(f.exportUsdMrd, 2) })}</p>
          {f.produktionsFaktor < 0.999 && <p className="vs-warnung">{t("gueter.kette.vorprodukte", { n: zahl(f.produktionsFaktor * 100, 0) })}</p>}
          {f.transport < 0.999 && <p className="vs-warnung">{t("gueter.kette.transport", { n: zahl(f.transport * 100, 0) })}</p>}
          {f.hormus > 0 && <p className="vs-warnung">{t("gueter.kette.hormus", { n: zahl(f.hormus * 100, 0) })}</p>}
          {f.wege.filter(l => l.grund !== "offen").map(l => <p className="vs-warnung" key={l.land}>{akteurName(l.land)} · {t(`gueter.kette.${l.grund}`)} · {zahl(l.anteil, 0)} %</p>)}
          {auftrag && <p role="status">{t("gueter.kette.auftrag", { menge: menge(auftrag.rest), einheit, datum: formatDateDe(addDays(world.date, auftrag.abTag - world.day)) })}</p>}
          {quelleTag !== undefined && quelleTag > world.day && <p role="status">{t("gueter.kette.quelleTermin", { datum: formatDateDe(addDays(world.date, quelleTag - world.day)) })}</p>}
          {s.letzteBilanz && <details><summary>{t("gueter.kette.abgerechnet", { monat: z.bilanz!.monat })}</summary><p>{t("gueter.kette.beleg", { import: menge(s.letzteBilanz.importiert), export: menge(s.letzteBilanz.exportiert), ende: menge(s.letzteBilanz.ende), einheit })}</p></details>}
        </section>}
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
                <dd>{tage(s.reichweiteTage)} <small>{t("gueter.tageEinheit")}</small>{s.zusatz > 0.005 && <small> · {t("gueter.reichweiteJetzt", { n: tage(s.reichweiteJetzt) })}</small>}</dd>
              </div>
            )}
            {s.blockiert > 0.005 && <div className="gi-aus-fall"><dt>{t("gueter.blockiert")}</dt><dd>{Math.round(s.blockiert * 100)} %</dd></div>}
          </dl>
        )}
        </div><div className="gi-detail-handeln">
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
                  <ul>{f.wege.map((l) => <li key={l.land}>{akteurName(l.land)} <small>{zahl(l.anteil, 0)} %{l.grund !== "offen" && ` · ${t(`gueter.kette.${l.grund}`)}`}</small></li>)}</ul>
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
        </div></div>
      </div>
    );
  };
  // Oben das Bild: alle Warengruppen als Ringe (Eigenversorgung) mit den Tagen ohne Einfuhr; rot, was knapp ist. Ein Klick öffnet die Ware
  // mit Mengenrechnung, Lieferländern und Knöpfen darunter. Kurs und Programme folgen (Befund D-17).
  return (
    <div className="gi-inventar">
      <section className="gi-raster" aria-label={t("gueter.titel")}>
        <div className="gi-raster-kopf">
          <p className="gi-raster-lage">
            {t("gueter.einleitung", { autark, gesamt: sicht.length - 1 })}{" "}
            <b className={knapp ? "gi-schlecht" : "gi-gut"}>{knapp ? t("n3.vs.knapp", { n: knapp }) : t("n3.vs.keinKnapp")}</b>
          </p>
          <p className="gi-legende">{t("t5.vs.legende")}</p>
        </div>
        <div className="gi-ringe">
          {kacheln.map((k) => {
            const z = sicht.find((x) => x.def.id === k.id)!;
            return (
              <button key={k.id} type="button" className={`gi-ring gi-${k.ton}${ware === k.id ? " on" : ""}`} aria-pressed={ware === k.id} title={z.ampel !== "keine" ? t("gueter.kette.reichweiteOhne", { n: tage(z.reichweiteTage) }) : undefined} onClick={() => setWare(ware === k.id ? null : k.id)}>
                <small className="gi-ring-art">{k.gruppe}</small>
                <span className="gi-ring-mitte"><Ring anteil={z.autarkie / 100} ton={k.ton ?? "gut"} /><b>{k.wert}</b></span>
                <span className="gi-ring-name">{k.titel}</span>
                {k.marke && <small className={`gi-ring-tage gi-${k.marke.ton}`}>{k.marke.text}</small>}
              </button>
            );
          })}
        </div>
      </section>
      {ware && <section className="gi-ware" aria-label={t(`gueter.gut.${ware}`)}>{detail(ware)}</section>}
      <VersorgungsLage programm={programm} world={world} geaendert={geaendert} />
    </div>
  );
}
