// Behörden ausbauen: Je Behörde drei Stufenbalken (Personal, Technik, Reichweite), je mit Ausbau (Preis, Dauer, Wirkung in einem Satz)
// und Kürzen, dazu das Sonderinstrument und die Leitung mit Porträt. Der Ausbau ist Spielmechanik mit spürbaren Folgen (sim/behoerden.ts).

import { useState } from "react";
import type { World } from "../../sim/types";
import type { Achse, BehoerdeId } from "../../data/behoerden";
import { behoerdeSicht, behoerdenImBereich, baueAus, kuerze, setzeInstrumentEin, type Antwort } from "../../sim/behoerden";
import { Portraet } from "../art/Portraet";
import { t } from "../../i18n";

function ertragWort(anteil: number): string {
  return t(anteil >= 0.75 ? "behoerden.ui.ertrag.voll" : anteil >= 0.45 ? "behoerden.ui.ertrag.merklich" : "behoerden.ui.ertrag.gering");
}

function Stufenbalken({ stufe, start, lauft }: { stufe: number; start: number; lauft?: boolean }) {
  return (
    <div className="bh-balken" role="img" aria-label={t("behoerden.ui.stufe", { stufe })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`bh-stufe${n <= stufe ? " an" : ""}${lauft && n === stufe + 1 ? " bau" : ""}${n === start ? " heute" : ""}`} aria-hidden />
      ))}
    </div>
  );
}

function BehoerdeKarte({ w, id, refresh }: { w: World; id: BehoerdeId; refresh: () => void }) {
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const s = behoerdeSicht(w, id);
  const tun = (f: () => Antwort) => {
    setAntwort(f());
    refresh();
  };
  return (
    <article className="bh-karte">
      <header className="bh-kopf">
        <Portraet seed={s.leitung.name} size={72} geschlecht={s.leitung.weiblich ? "f" : "m"} rahmen="messing" />
        <div>
          <h4>{s.name}</h4>
          <span className="bh-leitung">{s.leitung.titel}: {s.leitung.name}</span>
          <p className="bh-zweck">{s.text}</p>
        </div>
      </header>

      {antwort && (
        <p className={`bh-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}

      <div className="bh-achsen">
        {s.achsen.map((a) => {
          const imBau = s.bau?.achse === a.achse;
          return (
            <div key={a.achse} className={`bh-achse${imBau ? " laeuft" : ""}`}>
              <div className="bh-achse-kopf">
                <b>{a.name}</b>
                <span>{t("behoerden.ui.stufe", { stufe: a.stufe })}</span>
              </div>
              <Stufenbalken stufe={a.stufe} start={a.start} lauft={imBau} />
              {imBau ? (
                <p className="bh-wirkung">{t("behoerden.ui.laeuft", { achse: s.bau!.name, stufe: s.bau!.ziel, monate: s.bau!.restMonate })}</p>
              ) : (
                <>
                  <p className="bh-wirkung">{a.ausbau.satz}</p>
                  <div className="bh-achse-fuss">
                    <button type="button" className="aktion-knopf klein" disabled={!a.ausbau.ok} onClick={() => tun(() => baueAus(w, id, a.achse as Achse))}>
                      {t("behoerden.ui.ausbauen")}
                    </button>
                    {a.ausbau.ok ? (
                      <span className="bh-preis">
                        {t("behoerden.ui.preis", { pk: a.ausbau.pk, bip: a.ausbau.bip, monate: a.ausbau.monate })} · {ertragWort(a.ausbau.anteil)}
                      </span>
                    ) : (
                      <span className="bh-hinweis">{a.ausbau.grund}</span>
                    )}
                    {a.kuerzen.ok && (
                      <button type="button" className="link bh-kuerz" onClick={() => tun(() => kuerze(w, id, a.achse as Achse))} title={t("behoerden.ui.kuerz_preis", { bip: a.kuerzen.ersparnis })}>
                        {t("behoerden.ui.kuerzen")}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <footer className="bh-fuss">
        {s.etat && (
          <span className={`bh-etat${s.etat.gekuerzt || s.etat.spielraum <= 0 ? " knapp" : ""}`}>
            {t(s.etat.gekuerzt ? "behoerden.ui.etat_gekuerzt" : s.etat.spielraum > 0 ? "behoerden.ui.etat_spielraum" : "behoerden.ui.etat_kein", { ressort: s.etat.name, bip: s.etat.spielraum })}
          </span>
        )}
        <span className="bh-unterhalt">
          {s.unterhalt > 0
            ? t("behoerden.ui.unterhalt", { bip: s.unterhalt })
            : s.unterhalt < 0
              ? t("behoerden.ui.unterhalt_spar", { bip: -s.unterhalt })
              : t("behoerden.ui.unterhalt_null")}
        </span>
        {s.instrument && (
          <div className="bh-instrument">
            <b>{t("behoerden.ui.instrument")}: {s.instrument.name}</b>
            <p>{s.instrument.text}</p>
            <div className="bh-achse-fuss">
              <button type="button" className="aktion-knopf klein" disabled={!s.instrument.moeglich} onClick={() => tun(() => setzeInstrumentEin(w, id))}>
                {t("behoerden.ui.einsetzen")}
              </button>
              {s.instrument.moeglich ? (
                <span className="bh-preis">{t("behoerden.ui.preis", { pk: s.instrument.pk, bip: s.instrument.bip, monate: 0 })}</span>
              ) : (
                <span className="bh-hinweis">{s.instrument.grund}</span>
              )}
            </div>
          </div>
        )}
      </footer>
    </article>
  );
}

/** Alle Behörden eines Bereichs (ui/akte/Bereiche.tsx bindet die Liste als Instrument ein). */
export function BehoerdenListe({ w, bereich, refresh }: { w: World; bereich: string; refresh: () => void }) {
  const ids = behoerdenImBereich(bereich).filter((id) => id !== "mit");
  if (!ids.length) return null;
  return (
    <section className="bh-liste" aria-label={t("behoerden.ui.aria")}>
      <p className="bh-untertitel">{t("behoerden.ui.untertitel")}</p>
      {ids.map((id) => (
        <BehoerdeKarte key={id} w={w} id={id} refresh={refresh} />
      ))}
    </section>
  );
}

export { BehoerdeKarte };
