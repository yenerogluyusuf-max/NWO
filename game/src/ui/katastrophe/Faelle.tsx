// Laufende Fälle: je Katastrophe eine Karte mit den Zahlen der Schadenslage, der Hilfskette als Stufenband
// und den Handlungen, die das Spiel jetzt erlaubt (Soforthilfe, Übergangsversorgung, Wiederaufbau mit Vergabe).

import { useState } from "react";
import type { World } from "../../sim/types";
import type { KatastropheFall } from "../../sim/spiel-typen";
import type { Vergabe } from "../../sim/reich-typen";
import { VERGABE_NAMEN } from "../../sim/reich-typen";
import { kannZahlen } from "../../sim/kapital";
import { formatDateDe } from "../../sim/dates";
import {
  ART_NAMEN,
  beginneWiederaufbau,
  fallSicht,
  hilfsketteSicht,
  namenVon,
  schaetzung,
  soforthilfe,
  staerkeWort,
  starteUebergang,
  type FallSicht,
} from "../../sim/katastrophe";
import type { Ziel } from "../schreibtisch/briefing";
import { Hilfskette } from "./Hilfskette";
import { nf } from "./daten";

import { t } from "../../i18n";
/** Kosten der Handlungen in Politischem Kapital (Spielparameter, wie im Ereignis). */
export const PK_SOFORTHILFE = 3;
export const PK_UEBERGANG = 2;

const NEBEL_TEXT = (nebel: string): string => t(`reste.kat.nebel.${nebel}`);

interface Zahl {
  name: string;
  wert: number;
  /** Was die Bereitschaft nach Modellrechnung verhindert hat (nur wo das Modell eine Zahl hat) */
  verhindert?: number;
}

function Kennzahlen({ w, fall, nebelBekannt }: { w: World; fall: KatastropheFall; nebelBekannt: boolean }) {
  const zahlen: Zahl[] = [
    { name: "Todesopfer", wert: fall.tote, verhindert: fall.verhindert.tote },
    { name: "Verletzte", wert: fall.verletzte },
    { name: "Ohne Obdach", wert: fall.obdachlos },
    { name: "Zerstörte Wohnungen", wert: fall.wohnungen, verhindert: fall.verhindert.wohnungen },
  ];
  return (
    <dl className="kr-zahlen">
      {zahlen.map((z) => {
        const text = schaetzung(w, fall, z.wert);
        const lang = !/^[\d.]+$/.test(text);
        return (
          <div key={z.name} className="kr-zahl">
            <dt>{z.name}</dt>
            <dd className={lang ? "unklar" : ""}>{text}</dd>
            {nebelBekannt && z.verhindert !== undefined && z.verhindert > 0 && <small>{t("ui2.ui.katastrophe.Faelle.6d42a65", { p0: nf(z.verhindert) })}</small>}
          </div>
        );
      })}
    </dl>
  );
}

export function FallKarte({ w, sicht, refresh, melde, onGehe }: { w: World; sicht: FallSicht; refresh: () => void; melde: (m: string) => void; onGehe?: (z: Ziel) => void }) {
  const fall = sicht.fall;
  const spiel = w.spiel!;
  const [vergabe, setVergabe] = useState<Vergabe>("ausschreibung");
  const kette = hilfsketteSicht(w, fall);
  const stufe = (id: string) => kette.find((s) => s.id === id);
  const zusage = fall.zusage;
  const geliefert = Math.round((zusage?.geliefert ?? 0) + fall.privatGeliefert);
  const quote = zusage ? Math.min(1, geliefert / zusage.wohnungen) : 0;

  /** Eine Handlung gegen Kapital; scheitert sie (Ergebnis „nicht ok“), kommt das Kapital zurück. */
  const handle = (pk: number, f: () => { ok: boolean; text: string } | string) => {
    if (!kannZahlen(spiel.kapital, pk)) {
      melde(`Dafür fehlt Politisches Kapital (${pk} nötig, vorhanden ${Math.floor(spiel.kapital)}).`);
      return;
    }
    spiel.kapital -= pk;
    const r = f();
    if (typeof r !== "string" && !r.ok) spiel.kapital += pk;
    melde(typeof r === "string" ? r : r.text);
    refresh();
  };

  const nothilfe = stufe("nothilfe");
  const uebergang = stufe("uebergang");
  const aufbau = stufe("wiederaufbau");

  const aktionen = {
    nothilfe:
      nothilfe?.status === "offen" && !fall.bewaeltigt ? (
        <button type="button" className="kr-knopf haupt" disabled={!kannZahlen(spiel.kapital, PK_SOFORTHILFE)} onClick={() => handle(PK_SOFORTHILFE, () => soforthilfe(w, fall.id))}>
          {t("ui2.ui.katastrophe.Faelle.62184bf")} <em>{t("ui2.ui.katastrophe.Faelle.87b52bd", { p0: PK_SOFORTHILFE })}</em>
        </button>
      ) : undefined,
    uebergang:
      uebergang?.status === "offen" && !fall.bewaeltigt ? (
        <button type="button" className="kr-knopf haupt" disabled={!kannZahlen(spiel.kapital, PK_UEBERGANG)} onClick={() => handle(PK_UEBERGANG, () => starteUebergang(w, fall.id))}>
          {t("ui2.ui.katastrophe.Faelle.a4a08df")} <em>{t("ui2.ui.katastrophe.Faelle.87b52bd", { p0: PK_UEBERGANG })}</em>
        </button>
      ) : undefined,
    wiederaufbau:
      aufbau?.status === "offen" && sicht.wiederaufbau.moeglich && !fall.bewaeltigt ? (
        <div className="kr-vergabe">
          <fieldset>
            <legend>{t("ui.katastrophe.Faelle.c76ef94")}</legend>
            {(Object.keys(VERGABE_NAMEN) as Vergabe[]).map((v) => (
              <label key={v}>
                <input type="radio" name={`vergabe-${fall.id}`} checked={vergabe === v} onChange={() => setVergabe(v)} /> {VERGABE_NAMEN[v]}
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            className="kr-knopf haupt"
            onClick={() => {
              const r = beginneWiederaufbau(w, fall.id, vergabe);
              melde(r.text);
              refresh();
            }}
          >
            {t("ui2.ui.katastrophe.Faelle.b6b270e")}
          </button>
        </div>
      ) : aufbau?.status === "laeuft" && onGehe ? (
        <button type="button" className="kr-knopf" onClick={() => onGehe({ art: "akte", akte: "reich_infra" })}>
          {t("ui2.ui.katastrophe.Faelle.1adca3c")}
        </button>
      ) : undefined,
  };

  return (
    <article className={`kr-fall art-${fall.art}`}>
      <header className="kr-fall-kopf">
        <div>
          <p className="kr-art">{ART_NAMEN[fall.art]}</p>
          <h3>{namenVon(fall.provinzen)}</h3>
          <p className="kr-datum">
            {formatDateDe(fall.datum)} · {staerkeWort(fall.staerke)}
            {fall.bewaeltigt ? t("ui2.ui.katastrophe.Faelle.9d17623") : ""}
          </p>
        </div>
        <p className={`kr-nebel nebel-${sicht.nebel}`}>{NEBEL_TEXT(sicht.nebel)}</p>
      </header>

      <Kennzahlen w={w} fall={fall} nebelBekannt={sicht.nebel === "bekannt"} />
      {sicht.nebel === "bekannt" && (fall.verhindert.tote > 0 || fall.verhindert.wohnungen > 0) && (
        <p className="kr-klein">
          {t("ui2.ui.katastrophe.Faelle.b355043", { p0: fall.bereitschaft, p1: nf(fall.verhindert.tote) })}
          {fall.verhindert.wohnungen > 0 ? t("ui2.ui.katastrophe.Faelle.dd09a10", { p0: nf(fall.verhindert.wohnungen) }) : ""} (Bandbreite ±25 %).
        </p>
      )}

      <Hilfskette stufen={kette} aktionen={aktionen} />

      {(zusage || fall.wohnungen > 0) && (
        <section className="kr-versprechen">
          <h4>{t("ui2.ui.katastrophe.Faelle.0658cc6")}</h4>
          {zusage ? (
            <>
              <div className="kr-balken gross" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(quote * 100)}>
                <i style={{ width: `${Math.round(quote * 100)}%` }} />
              </div>
              <p>
                {t("ui2.ui.katastrophe.Faelle.8ae4550", { p0: nf(geliefert), p1: nf(zusage.wohnungen), p2: nf(quote * 100) })}
                {fall.privatGeliefert > 0 ? t("ui2.ui.katastrophe.Faelle.6f4452a", { p0: nf(Math.round(fall.privatGeliefert)) }) : ""}.
              </p>
            </>
          ) : (
            <p className="kr-klein">{t("ui.katastrophe.Faelle.38cae67")}</p>
          )}
        </section>
      )}

      {onGehe && (
        <footer className="kr-fuss">
          <button type="button" className="kr-link" onClick={() => onGehe({ art: "akte", akte: "zeitung" })}>
            {t("ui.katastrophe.Faelle.854e05d")}
          </button>
          <button type="button" className="kr-link" onClick={() => onGehe({ art: "akte", akte: "waehler" })}>
            {t("ui.katastrophe.Faelle.0b6eb4d")}
          </button>
        </footer>
      )}
    </article>
  );
}

export function Faelle({ world, refresh, melde, onGehe, zurLage }: { world: World; refresh: () => void; melde: (m: string) => void; onGehe?: (z: Ziel) => void; zurLage: () => void }) {
  const z = world.spiel?.katastrophen;
  const aktive = (z?.faelle ?? []).filter((f) => !f.bewaeltigt).sort((a, b) => b.tag - a.tag);
  if (aktive.length === 0) {
    return (
      <div className="kr-leer">
        <h3>{t("ui.katastrophe.Faelle.a079334")}</h3>
        <p>{t("ui.katastrophe.Faelle.93a65df")}</p>
        <button type="button" className="kr-knopf haupt" onClick={zurLage}>
          {t("ui.katastrophe.Faelle.5199af5")}
        </button>
      </div>
    );
  }
  return (
    <div className="kr-faelle">
      {aktive.map((f) => (
        <FallKarte key={f.id} w={world} sicht={fallSicht(world, f)} refresh={refresh} melde={melde} {...(onGehe ? { onGehe } : {})} />
      ))}
    </div>
  );
}
