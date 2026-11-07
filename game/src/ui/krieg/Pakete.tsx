// Welle 3, K1 (krieg.md Schritt 2): die Friedenspakete der Waffenruhe als Karten. Jede Karte zeigt die Bereitschaft des Gegners als Balken
// mit der Schwelle, ob er annimmt, den Preis daheim und die Rechnung Posten für Posten. Ein Paket unter der Schwelle lässt sich nicht
// vorlegen (im Spielstand 2045 lehnte Griechenland viermal dasselbe Paket mit 47 % ab). Schritt 7 baut daraus den Friedenstisch mit
// Forderungen je Region. Rechnet nichts selbst: alles aus sim/krieg.ts (paketAussicht, paketPreis, handlungenFuer).

import type { World } from "../../sim/types";
import type { KriegVorgang } from "../../sim/krieg-typen";
import { KRIEG, PAKETE, paketAussicht, paketPreis, type KriegHandlungId, type KriegHandlungSicht } from "../../sim/krieg";
import { land } from "../../sim/laender";
import { t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import "./krieg.css";

const zz = (x: number, d = 1): string => (x > 0 ? "+" : x < 0 ? "−" : "") + zahl(Math.abs(x), d);

export function Pakete({ world, k, handlungen, tun }: { world: World; k: KriegVorgang; handlungen: KriegHandlungSicht[]; tun: (id: KriegHandlungId) => void }) {
  useSprache();
  const pakete = handlungen.filter((h) => h.id.startsWith("paket_"));
  if (!pakete.length) return null;
  const name = land(k.land).name;
  return (
    <section className="kp" aria-label={t("welle_k1.pakete.titel")}>
      <header className="kp-kopf">
        <h5>{t("welle_k1.pakete.titel")}</h5>
        <span>{k.rueckzugGegner ? t("welle_k1.pakete.rueckzug", { land: name }) : k.zielErreicht !== undefined ? t("welle_k1.pakete.ziel", { land: name }) : t("welle_k1.pakete.offen", { land: name, n: KRIEG.paketNoetig })}</span>
      </header>
      <ul className="kp-liste">
        {pakete.map((h) => {
          const def = PAKETE[h.id]!;
          const p = def.paket(k.front);
          const a = paketAussicht(world, k, p, h.id);
          const preis = paketPreis(world, k, p);
          const ja = a.prozent >= KRIEG.paketNoetig;
          const angebot = k.angebotPaket === h.id;
          return (
            <li key={h.id} className={`kp-karte${ja ? " ja" : " nein"}${angebot ? " angebot" : ""}`}>
              <div className="kp-titel">
                <strong>{def.name}</strong>
                {angebot && <em>{t("welle_k1.pakete.vorschlag", { land: name })}</em>}
              </div>
              <p className="kp-text">{def.text}</p>
              <div className="kp-aussicht" title={t("welle_k1.pakete.balken")}>
                <span className="kp-balken" aria-hidden>
                  <i style={{ width: `${a.prozent}%` }} />
                  <u style={{ left: `${KRIEG.paketNoetig}%` }} />
                </span>
                <b>{zahl(a.prozent, 0)} %</b>
                <span className={ja ? "kp-ja" : "kp-nein"}>{ja ? t("welle_k1.pakete.nimmt_an") : t("welle_k1.pakete.lehnt_ab", { n: KRIEG.paketNoetig - a.prozent })}</span>
              </div>
              <dl className="kp-preis">
                <dt>{t("welle_k1.pakete.daheim")}</dt>
                <dd>{preis.po > 0 ? t("welle_k1.pakete.zustimmung", { z: zz(-preis.po) }) : t("welle_k1.pakete.kein_preis")}{preis.nationalisten ? ` · ${t("welle_k1.pakete.nationalisten", { z: zz(preis.nationalisten, 0) })}` : ""}</dd>
              </dl>
              <details className="kp-rechnung">
                <summary>{t("welle_k1.pakete.rechnung")}</summary>
                <table>
                  <tbody>
                    {a.gruende.map((g) => (
                      <tr key={g.id}>
                        <td>{t(`welle_k1.aussicht.${g.id}`)}</td>
                        <td className={g.wert >= 0 ? "kp-plus" : "kp-minus"}>{g.id === "grund" || g.id === "angebot" ? zahl(g.wert, 0) : zz(g.wert)}</td>
                      </tr>
                    ))}
                    <tr className="kp-summe">
                      <td>{t("welle_k1.aussicht.summe", { n: KRIEG.paketNoetig })}</td>
                      <td>{zahl(a.prozent, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </details>
              <button type="button" className="aktion-knopf" disabled={!h.moeglich} onClick={() => tun(h.id)}>
                {t("welle_k1.pakete.vorlegen")} <b>{h.pk}</b>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
