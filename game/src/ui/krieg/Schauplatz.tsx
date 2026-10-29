// Der Schauplatz eines Konfliktvorgangs: ein Satz zur Lage, die Zielregionen als Kette (genommen, umkämpft, beim Gegner), die zwei
// Entscheidungen der Kriegsführung (Einsatzart, Tempo) und der Vergleich der Bestände. Rechnet nichts selbst: alles aus sim/kriegsschauplatz.ts.
// Die Karte zeigt dieselbe Lage (Linse „Welt“ und während eines Krieges immer): Regionen färben sich, Pfeile zeigen die Vorstöße.

import type { World } from "../../sim/types";
import type { KriegVorgang } from "../../sim/krieg-typen";
import { t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import {
  einsatzSichten,
  einsatzVon,
  gegnerBestand,
  gegnerBestandsFaktor,
  generationsAbstand,
  kriegsFaktoren,
  schauplatzFuer,
  tempoVon,
  umkaempfteRegion,
  waehleEinsatz,
  waehleTempo,
  zielRegionen,
} from "../../sim/kriegsschauplatz";
import { streitkraefte } from "../../sim/streitkraefte";
import { land } from "../../sim/laender";
import type { KriegsTempo } from "../../data/schauplaetze";
import "./krieg.css";

const TEMPI: KriegsTempo[] = ["vorsichtig", "normal", "hart"];

function eignungWort(e: number): string {
  if (e >= 1.1) return t("krieg.ui.eignung.gut");
  if (e >= 0.85) return t("krieg.ui.eignung.mittel");
  if (e >= 0.5) return t("krieg.ui.eignung.schwer");
  return t("krieg.ui.eignung.kaum");
}

export function Schauplatz({ world, k, onTat }: { world: World; k: KriegVorgang; onTat: (text: string) => void }) {
  useSprache();
  const s = schauplatzFuer(k.land);
  if (!s) return null;
  const ziel = zielRegionen(k);
  const lage = k.regionen ?? {};
  const genommen = ziel.filter((r) => lage[r.id] === "eigen").length;
  const umk = umkaempfteRegion(k);
  const f = kriegsFaktoren(k);
  const imKrieg = k.phase === "krieg" || k.phase === "waffenruhe";
  const einsatz = einsatzVon(k);
  const sichten = einsatzSichten(world, k);
  const gb = gegnerBestand(world, k);
  const gegnerAnteil = gegnerBestandsFaktor(world, k);
  const abstand = generationsAbstand(world, k);
  const munition = streitkraefte(world).gattungen.munition.menge;
  const lw = k.letzteWoche;

  // Ein Satz zur Lage (Urteil zuerst, Zahlen danach)
  const satz = !imKrieg
    ? t("krieg.ui.lage.vorher", { n: ziel.length, land: land(k.land).name })
    : umk
      ? t("krieg.ui.lage.umkaempft", { region: t(`krieg.region.${umk.id}`), gelaende: t(`krieg.gelaende.${umk.gelaende}`), genommen, n: ziel.length })
      : t("krieg.ui.lage.alles", { n: ziel.length });

  return (
    <section className="ks" aria-label={t("krieg.ui.titel", { land: land(k.land).name })}>
      <header className="ks-kopf">
        <b>{t(`krieg.schauplatz.${s.id}`)}</b>
        <span>{satz}</span>
      </header>

      <ol className="ks-kette" aria-label={t("krieg.ui.kette")}>
        {ziel.map((r) => {
          const l = lage[r.id] ?? "gegner";
          return (
            <li key={r.id} className={`ks-region ks-${l}`} title={`${t(`krieg.gelaende.${r.gelaende}`)}${r.ressource ? ` · ${t(`krieg.ressource.${r.ressource}`)}` : ""}`}>
              <span className="ks-punkt" aria-hidden />
              <span className="ks-name">{t(`krieg.region.${r.id}`)}</span>
              <small>{t(`krieg.ui.lage_wort.${l}`)}</small>
            </li>
          );
        })}
      </ol>
      {f.ausserReichweite && umk && <p className="ks-warn">{t("krieg.ui.reichweite", { region: t(`krieg.region.${umk.id}`), art: t(`krieg.einsatz.${einsatz === "gemischt" ? "luft" : einsatz}.name`) })}</p>}

      <div className="ks-wahl">
        <h5>{t("krieg.ui.einsatz")}</h5>
        <p className="ks-hilfe">{einsatz === "gemischt" ? t("krieg.ui.einsatz_gemischt") : t(`krieg.einsatz.${einsatz}.text`)}</p>
        <div className="ks-knoepfe" role="group">
          {sichten.map((e) => (
            <button key={e.id} type="button" className={e.aktiv ? "on" : ""} disabled={!e.moeglich} title={e.grund ?? t(`krieg.einsatz.${e.id}.text`)} onClick={() => onTat(waehleEinsatz(world, k, e.id).text)}>
              <strong>{t(`krieg.einsatz.${e.id}.name`)}</strong>
              <span>
                {umk ? `${eignungWort(e.eignung)} · ` : ""}
                {t("krieg.ui.kraft", { p: Math.round(e.kraft * 100) })}
              </span>
              {e.grund && !e.aktiv && <em>{e.grund}</em>}
            </button>
          ))}
        </div>
      </div>

      <div className="ks-wahl">
        <h5>{t("krieg.ui.tempo")}</h5>
        <div className="ks-knoepfe ks-tempo" role="group">
          {TEMPI.map((tp) => (
            <button key={tp} type="button" className={tempoVon(k) === tp ? "on" : ""} disabled={tempoVon(k) === tp || k.phase === "frieden" || k.phase === "beendet"} title={t(`krieg.tempo.${tp}.text`)} onClick={() => onTat(waehleTempo(world, k, tp).text)}>
              <strong>{t(`krieg.tempo.${tp}.name`)}</strong>
              <span>{t(`krieg.tempo.${tp}.kurz`)}</span>
            </button>
          ))}
        </div>
      </div>

      <dl className="ks-vergleich">
        <dt>{t("krieg.ui.gegner_bestand")}</dt>
        <dd>
          {t("krieg.ui.prozent", { p: Math.round(gegnerAnteil * 100) })}
          <span className="ks-mini">
            {(Object.keys(gb) as (keyof typeof gb)[]).map((g) => (
              <i key={g} title={`${t(`krieg.gegner.${g}`)}: ${Math.round(gb[g].menge)} · ${t("krieg.ui.gen", { g: zahl(gb[g].generation, 1) })}`} style={{ height: `${Math.max(8, Math.min(100, gb[g].menge))}%` }} />
            ))}
          </span>
        </dd>
        <dt>{t("krieg.ui.generation")}</dt>
        <dd className={abstand >= 0.3 ? "ks-gut" : abstand <= -0.3 ? "ks-schlecht" : ""}>{t(abstand >= 0.3 ? "krieg.ui.gen_vorn" : abstand <= -0.3 ? "krieg.ui.gen_hinten" : "krieg.ui.gen_gleich", { d: zahl(Math.abs(abstand), 1) })}</dd>
        <dt>{t("krieg.ui.munition")}</dt>
        <dd className={munition < 10 ? "ks-schlecht" : ""}>{t("krieg.ui.tage", { n: Math.round(munition) })}</dd>
        {lw && (
          <>
            <dt>{t("krieg.ui.woche")}</dt>
            <dd>{t("krieg.ui.verluste", { e: zahl(lw.eigen, 1), g: zahl(lw.gegner, 1) })}</dd>
          </>
        )}
      </dl>
    </section>
  );
}
