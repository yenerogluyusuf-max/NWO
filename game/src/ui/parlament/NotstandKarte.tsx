// Der Ausnahmezustand als Karte (befund-B B-5, Art. 119): Ohne laufenden Ausnahmezustand zeigt sie den Anlass, den Preis und die
// erwartete Bestätigung im Parlament und ruft ihn aus; läuft er, zeigt sie die Frist als Band mit Verlängern und Aufheben.
// Alle Zahlen kommen aus sim/notstand.ts.

import type { World } from "../../sim/types";
import { NOTSTAND, hebeNotstandAuf, notstandSicht, notstandVon, rufeNotstandAus, verlaengereNotstand } from "../../sim/notstand";
import { t } from "../../i18n";
import "./tagesordnung.css";

type Ergebnis = { ok: boolean; text: string; why?: string };

export function NotstandKarte({ world, tun }: { world: World; tun: (r: Ergebnis) => void }) {
  const s = notstandSicht(world);
  const z = notstandVon(world);
  const anlaesse = s.anlaesse.map((a) => t(`n4.not.anlass.${a}`));
  if (s.aktiv && z) {
    const gesamt = Math.max(1, z.bis - z.seit);
    const vorbei = Math.min(1, (world.day - z.seit) / gesamt);
    return (
      <div className="to-zeile to-notstand aktiv" role="region" aria-label={t("n4.not.titel")}>
        <div className="to-kopf">
          <span className="to-art">{t("n4.not.titel")}</span>
          <strong className="to-titel">{t("n4.nk.aktiv", { anlass: t(`n4.not.anlass.${s.aktiv.anlass}`) })}</strong>
          <span className="to-termin">{t("n4.nk.bis", { datum: s.aktiv.datum, n: s.aktiv.tageRest })}</span>
        </div>
        <div className="to-frist" role="img" aria-label={t("n4.nk.bis", { datum: s.aktiv.datum, n: s.aktiv.tageRest })}>
          <i style={{ width: `${vorbei * 100}%` }} />
        </div>
        <p className="to-hinweis">{t("n4.nk.regel", { tage: NOTSTAND.verlaengerungTage, ja: s.ja, schwelle: s.schwelle, n: s.aktiv.verlaengerungen })}</p>
        <div className="to-fuss">
          <button type="button" className="pd-btn" disabled={!s.bezahlbar} onClick={() => tun(verlaengereNotstand(world))}>
            {t("n4.nk.verlaengern", { tage: NOTSTAND.verlaengerungTage })} <b>{s.pk}</b>
          </button>
          <button type="button" className="pd-btn quiet" onClick={() => tun(hebeNotstandAuf(world))}>{t("n4.nk.aufheben")}</button>
        </div>
      </div>
    );
  }
  return (
    <div className="to-zeile to-notstand" role="region" aria-label={t("n4.not.titel")}>
      <p>{t("n4.nk.erklaerung", { tage: NOTSTAND.hoechstTage, verl: NOTSTAND.verlaengerungTage })}</p>
      <p className={anlaesse.length ? "to-hinweis" : "to-warnung"}>{anlaesse.length ? t("n4.nk.anlaesse", { liste: anlaesse }) : t("n4.not.keinAnlass")}</p>
      <p className="to-zahl">{t("n4.nk.prognose", { ja: s.ja, schwelle: s.schwelle })}</p>
      <div className="to-fuss">
        <button type="button" className="brass-button" disabled={!s.moeglich} title={s.grund} onClick={() => tun(rufeNotstandAus(world))}>
          {t("n4.nk.ausrufen")} <b>{s.pk}</b>
        </button>
      </div>
    </div>
  );
}
