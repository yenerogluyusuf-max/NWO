// Welle 3, K1 (krieg.md Schritt 1): der Weg zum Einsatz als Leiter mit vier Sprossen (Druck, Drohkulisse, Ultimatum, Einsatz) und das
// Kriegsziel in der Konfliktakte: Begründung (Rahmung) und Zielraum, im Fernkonflikt das Fernziel. Vorher lag der Zielraum unter
// Sicherheit, und das Dossier verwies nicht darauf (Befund B8). Rechnet nichts selbst: alles aus sim/krieg.ts und sim/fernkonflikt.ts.

import type { World } from "../../sim/types";
import type { KriegVorgang } from "../../sim/krieg-typen";
import { RAHMUNG, ZIELRAUM_WECHSEL, eskalationsLeiter, tuerkeiBeginnt, ultimatumAussicht, waehleZielraum, zielraeumeFuer, type KriegHandlungSicht, type Sprosse } from "../../sim/krieg";
import { vollmachtFuer } from "../../sim/krieg-recht";
import { FERN, FERN_ZIELE, fernZielStand, fernZielVon, istFernkonflikt, waehleFernZiel } from "../../sim/fernkonflikt";
import { zielRegionen } from "../../sim/kriegsschauplatz";
import { ZIELRAUM_REGIONEN } from "../../data/schauplaetze";
import { stimmenSicht } from "../../sim/handeln";
import { rahmungWerte } from "../../sim/krieg";
import { addDays } from "../../sim/dates";
import { datum, t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import { useContext } from "react";
import { OrtswahlStart } from "../atlas/ortswahl";
import { Icon } from "../icons";
import { kriegszielAnfrage, kriegszielKarteMoeglich, zielBeschreibung } from "./kriegsziel-karte";
import "./krieg.css";

const zz = (x: number): string => (x > 0 ? "+" : x < 0 ? "−" : "") + zahl(Math.abs(x), 0);

/** Die vier Sprossen mit ihrem Stand und dem nächsten Datum. */
export function Leiter({ world, k }: { world: World; k: KriegVorgang }) {
  useSprache();
  const sprossen = eskalationsLeiter(world, k);
  const tag = (d: number) => datum(addDays(world.date, d - world.day));
  const zeile = (s: Sprosse): string => {
    // Der Tag der Entstehung steht in der Kennung des Vorgangs (kv-<Land>-<Tag>)
    if (s.id === "druck") return t("welle_k1.leiter.druck.seit", { datum: tag(Number(k.id.split("-").pop()) || k.seit) });
    if (s.id === "drohkulisse") return s.stand === "vorbei" ? t("welle_k1.leiter.drohkulisse.steht") : s.ab !== undefined && s.ab > world.day ? t("welle_k1.leiter.ab", { datum: tag(s.ab) }) : t("welle_k1.leiter.drohkulisse.frei");
    if (s.id === "ultimatum") {
      if (s.stand === "entfaellt") return t(k.rahmung === "beistand" ? "welle_k1.leiter.ultimatum.beistand" : "welle_k1.leiter.ultimatum.angriff");
      if (s.stand === "vorbei") return t("welle_k1.leiter.ultimatum.abgelehnt");
      return t("welle_k1.leiter.ultimatum.aussicht", { p: Math.round(ultimatumAussicht(world, k) * 100) });
    }
    // Einsatz
    const v = vollmachtFuer(world, k.land);
    const frist = s.ab !== undefined && s.ab > world.day ? " · " + t("welle_k1.leiter.ab", { datum: tag(s.ab) }) : "";
    if (s.weg === "vollmacht") return t("welle_k1.leiter.einsatz.vollmacht", { bis: datum(v?.bis ?? world.date) }) + frist;
    if (s.weg === "erlass") return t("welle_k1.leiter.einsatz.erlass") + frist;
    const stimmen = Math.round(stimmenSicht(world, { massnahme: "m_verteidigung", richtung: 1 }).erwartet + (k.rahmung ? rahmungWerte(k).stimmen : 0));
    return t("welle_k1.leiter.einsatz.parlament", { stimmen, noetig: 301 }) + frist;
  };
  return (
    <section className="kl" aria-label={t("welle_k1.leiter.titel")}>
      <h5>{t("welle_k1.leiter.titel")}</h5>
      <ol className="kl-sprossen">
        {sprossen.map((s, i) => (
          <li key={s.id} className={`kl-sprosse ${s.stand}`}>
            <b>
              <i aria-hidden>{s.stand === "vorbei" ? "✓" : i + 1}</i>
              {t(`welle_k1.leiter.${s.id}`)}
            </b>
            <span>{zeile(s)}</span>
          </li>
        ))}
      </ol>
      {k.kriegszielDeklariert && !tuerkeiBeginnt(k) && <p className="kl-hinweis">{t("welle_k1.leiter.ohne_ultimatum")}</p>}
    </section>
  );
}

/**
 * Das Kriegsziel: Begründung (die Rahmung legt die Preise fest) und Zielraum bzw. Fernziel. Die Begründung kommt aus den Handlungen
 * `ziel_*` (Preis und Sperre wie im Motor), der Zielraum aus `waehleZielraum`, das Fernziel aus `waehleFernZiel`.
 */
export function Kriegsziel({ world, k, ziele, tun, onTat }: { world: World; k: KriegVorgang; ziele: KriegHandlungSicht[]; tun: (id: KriegHandlungSicht["id"]) => void; onTat: (text: string) => void }) {
  useSprache();
  const fern = istFernkonflikt(k.land);
  const raeume = zielraeumeFuer(k.land);
  const offen = k.phase !== "frieden" && k.phase !== "beendet" && k.phase !== "waffenruhe";
  const standard = zielRegionen({ ...k, zielraum: undefined, zielRegionen: undefined } as KriegVorgang).length;
  // K6: Kriegsziel auf der großen Karte setzen (Ortswahl); ohne Stage (Tests) gibt es den Knopf nicht
  const ortswahl = useContext(OrtswahlStart);
  const karte = !!ortswahl && kriegszielKarteMoeglich(world, k);
  return (
    <section className="kz" aria-label={t("welle_k1.ziel.kopf")}>
      <h5>{t("welle_k1.ziel.kopf")}</h5>
      <div className="kz-reihe">
        <span className="kz-etikett">{t("welle_k1.ziel.begruendung")}</span>
        {k.rahmung ? (
          <p className="kz-gewaehlt">
            <strong>{RAHMUNG[k.rahmung].name}</strong> · {t("welle_k1.ziel.begruendung_preis", { stimmen: zz(rahmungWerte(k).stimmen), ansehen: zz(RAHMUNG[k.rahmung].ansehen) })}
          </p>
        ) : (
          <div className="kd-ziele-knoepfe" role="group">
            {ziele.map((h) => {
              const r = RAHMUNG[h.id.slice(5) as keyof typeof RAHMUNG];
              return (
                <button key={h.id} type="button" disabled={!h.moeglich} title={h.moeglich ? h.hinweis : h.grund} onClick={() => tun(h.id)}>
                  <strong>{r.name}</strong>
                  <span>{t("nacht_n7.d.ziel_preis", { pk: h.pk, stimmen: zz(r.stimmen), ansehen: zz(r.ansehen) })}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {!fern && raeume.length > 0 && (
        <div className="kz-reihe">
          <span className="kz-etikett">{t("welle_k1.ziel.raum")}</span>
          <div className="ks-knoepfe" role="group">
            {raeume.map((z) => {
              const an = k.zielraum === z.id && !k.zielRegionen;
              const n = ZIELRAUM_REGIONEN[z.id]?.length ?? 0;
              const wechsel = k.phase === "krieg" && (!!k.zielraum || !!k.zielRegionen) && !an;
              return (
                <button key={z.id} type="button" className={an ? "on" : ""} disabled={an || !offen} onClick={() => onTat(waehleZielraum(world, k.id, z.id).text)}>
                  <strong>{t(`militaer.zielraum.${z.id}`)}</strong>
                  <span>
                    {t("welle_k1.ziel.raum_zeile", { n, f: zahl(z.schwierigkeit, 2) })}
                    {wechsel ? ` · ${t("welle_k1.ziel.raum_wechsel", { pk: ZIELRAUM_WECHSEL.pk, moral: zz(ZIELRAUM_WECHSEL.moral) })}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
          {(k.zielRegionen || karte) && (
            <div className="kz-karte">
              {k.zielRegionen && <p className="kz-eigen"><strong>{zielBeschreibung(k)}</strong> · {t("welle_k6.ziel.eigene_zeile", { n: k.zielRegionen.length, raum: t(`militaer.zielraum.${k.zielraum}`) })}</p>}
              {karte && (
                <button type="button" className="knopf kz-karte-knopf" onClick={() => ortswahl!(kriegszielAnfrage(world, k))}>
                  <Icon name="karte" size={16} />
                  {t("welle_k6.ziel.karte_knopf")}
                </button>
              )}
            </div>
          )}
          {!k.zielraum && <p className="kz-hinweis">{t("welle_k1.ziel.raum_standard", { n: standard })}</p>}
        </div>
      )}
      {fern && (
        <div className="kz-reihe">
          <span className="kz-etikett">{t("welle_k1.fern.ziel_kopf")}</span>
          <div className="ks-knoepfe" role="group">
            {FERN_ZIELE.map((z) => {
              const an = fernZielVon(k) === z;
              const s = fernZielStand(k, z);
              const wechsel = k.phase === "krieg" && !!k.fernZiel && !an;
              return (
                <button key={z} type="button" className={an ? "on" : ""} disabled={an || !offen} onClick={() => onTat(waehleFernZiel(world, k, z).text)}>
                  <strong>{t(`welle_k1.fern.ziel.${z}.name`)}</strong>
                  <span>
                    {t("welle_k1.fern.ziel_bedingung", { front: s.front.noetig, uhr: s.uhrGegner.noetig })}
                    {wechsel ? ` · ${t("welle_k1.fern.ziel_wechsel", { pk: FERN.wechselPk })}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {k.zielErreicht !== undefined && <p className="kz-erreicht">{t("welle_k1.ziel.erreicht_am", { datum: datum(addDays(world.date, k.zielErreicht - world.day)) })}</p>}
      {k.phase === "krieg" && k.zielErreicht === undefined && <p className="kz-hinweis">{t("welle_k1.ziel.bis_dahin")}</p>}
    </section>
  );
}
