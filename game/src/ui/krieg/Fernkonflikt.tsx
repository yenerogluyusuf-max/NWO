// Welle 3, K1 (krieg.md Schritt 3): der Fernkonflikt ohne gemeinsame Grenze. Statt Regionenkette und Bodenoffensive: die Mittel (Luft- und
// Raketenschläge, See, Stellvertreter, Cyber), das Tempo und der Stand gegenüber dem Fernziel in zwei Balken. Rechnet nichts selbst:
// Mittel aus sim/kriegsschauplatz.ts (einsatzSichten, waehleEinsatz), Ziel aus sim/fernkonflikt.ts.

import type { World } from "../../sim/types";
import type { KriegVorgang } from "../../sim/krieg-typen";
import { einsatzSichten, tempoVon, waehleEinsatz, waehleTempo } from "../../sim/kriegsschauplatz";
import { fernZielStand, istFernkonflikt } from "../../sim/fernkonflikt";
import type { KriegsTempo } from "../../data/schauplaetze";
import { land } from "../../sim/laender";
import { gegenueber2026 } from "../militaer/zustand";
import { t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import "./krieg.css";

const TEMPI: KriegsTempo[] = ["vorsichtig", "normal", "hart"];

function Balken({ label, jetzt, noetig, umgekehrt }: { label: string; jetzt: number; noetig: number; umgekehrt?: boolean }) {
  const ok = umgekehrt ? jetzt <= noetig : jetzt >= noetig;
  return (
    <div className={`kf-zeile${ok ? " ok" : ""}`}>
      <span>{label}</span>
      <span className="kp-balken" aria-hidden>
        <i style={{ width: `${Math.max(0, Math.min(100, jetzt))}%` }} />
        <u style={{ left: `${noetig}%` }} />
      </span>
      <b>{t(umgekehrt ? "welle_k1.fern.hoechstens" : "welle_k1.fern.mindestens", { jetzt: zahl(Math.max(0, jetzt), 0), noetig: zahl(noetig, 0) })}</b>
    </div>
  );
}

export function Fernkonflikt({ world, k, onTat }: { world: World; k: KriegVorgang; onTat: (text: string) => void }) {
  useSprache();
  if (!istFernkonflikt(k.land)) return null;
  const name = land(k.land).name;
  const imKrieg = k.phase === "krieg" || k.phase === "waffenruhe";
  const stand = fernZielStand(k);
  const sichten = einsatzSichten(world, k);
  return (
    <section className="ks kf" aria-label={t("welle_k1.fern.titel", { land: name })}>
      <header className="ks-kopf">
        <b>{t("welle_k1.fern.titel", { land: name })}</b>
        <span>{t("welle_k1.fern.satz", { land: name })}</span>
      </header>
      {imKrieg && (
        <div className="kf-ziel">
          <h5>{t("welle_k1.fern.stand", { ziel: t(`welle_k1.fern.ziel.${stand.ziel}.name`) })}</h5>
          <Balken label={t("welle_k1.fern.lage")} jetzt={stand.front.jetzt} noetig={stand.front.noetig} />
          <Balken label={t("welle_k1.fern.rueckhalt_gegner", { land: name })} jetzt={stand.uhrGegner.jetzt} noetig={stand.uhrGegner.noetig} umgekehrt />
          <p className="ks-hilfe">{stand.erreicht ? t("welle_k1.fern.erreicht") : t("welle_k1.fern.wochen", { jetzt: stand.wochen.jetzt, noetig: stand.wochen.noetig })}</p>
        </div>
      )}
      <div className="ks-wahl">
        <h5>{t("welle_k1.fern.mittel")}</h5>
        <div className="ks-knoepfe" role="group">
          {sichten.map((e) => (
            <button key={e.id} type="button" className={e.aktiv ? "on" : ""} disabled={!e.moeglich} title={e.grund ?? t(`krieg.einsatz.${e.id}.text`)} onClick={() => onTat(waehleEinsatz(world, k, e.id).text)}>
              <strong>{t(`welle_k1.fern.mittel.${e.id}`)}</strong>
              <span>{t("nacht_n7.kraefte", { z: gegenueber2026(e.kraft) })}</span>
              {e.grund && !e.aktiv && <em>{e.grund}</em>}
            </button>
          ))}
        </div>
        <p className="ks-hilfe">{t("welle_k1.fern.mittel_hilfe")}</p>
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
    </section>
  );
}
