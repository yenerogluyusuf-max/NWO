// Möglichkeiten als Bildkarten (GESTALTUNG_2026-11-04, Stufe G3): Vorhaben eines Bereichs mit Bild, Zustand, Preis,
// Wirkung und Kehrseite. Nur lesend: Beginnen, Vergabe und Reihenfolge bleiben in der Vorhabenkarte des Reichs,
// zu der jeder Knopf springt. Gezeigt werden höchstens vier: Laufendes zuerst, dann sofort Mögliches, dann das,
// was seiner Voraussetzung am nächsten ist.

import { aktuelleLocale, t } from "../../i18n";
import { effektZeile, vorhabenListe, type VorhabenSicht } from "../../sim/reich";
import { KLASSEN_NAMEN } from "../../sim/reich-typen";
import type { World } from "../../sim/types";
import { WunderBild } from "../reich/WunderBild";
import { Preis } from "./Zeichen";

type KartenZustand = "bau" | "moeglich" | "verlangt";

const zahl = (x: number, d = 1) => x.toLocaleString(aktuelleLocale(), { maximumFractionDigits: d });

/** Instandsetzungen und regionale Ableger gehören in die Fachansicht, nicht auf die Übersicht. */
const istAbleger = (s: VorhabenSicht) => !!s.v.pflegt || s.v.instanzVon !== undefined || /^(instandsetzung|sanierung)_/.test(s.v.id);

function zustandVon(s: VorhabenSicht): KartenZustand | null {
  if (s.status === "im_bau" || s.status === "pausiert") return "bau";
  if (s.status !== "verfuegbar") return null;
  return s.bereit ? "moeglich" : "verlangt";
}

/** Mittlerer Fortschritt der Voraussetzungen: Was fast erreichbar ist, steht vorn. */
const naehe = (s: VorhabenSicht) => (s.voraus.length ? s.voraus.reduce((a, v) => a + v.fortschritt, 0) / s.voraus.length : 1);

export function kartenAuswahl(w: World, reichBereich: string, max = 4): { s: VorhabenSicht; z: KartenZustand }[] {
  const liste = vorhabenListe(w, reichBereich).filter((s) => !istAbleger(s));
  const mit = liste.map((s) => ({ s, z: zustandVon(s) })).filter((x): x is { s: VorhabenSicht; z: KartenZustand } => x.z !== null);
  const rang: Record<KartenZustand, number> = { bau: 0, moeglich: 1, verlangt: 2 };
  return mit.sort((a, b) => rang[a.z] - rang[b.z] || naehe(b.s) - naehe(a.s)).slice(0, max);
}

function Bildkarte({ s, z, w, oeffnen }: { s: VorhabenSicht; z: KartenZustand; w: World; oeffnen: () => void }) {
  const v = s.v, k = v.kosten;
  const wirkung = v.abschluss.map((e) => effektZeile(e, "sofort", w)).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 3);
  const fehlt = s.voraus.filter((x) => !x.erfuellt).map((x) => x.text);
  const stempel = z === "bau" ? (s.status === "pausiert" ? t("gz.stempel.pausiert") : t("gz.stempel.im_bau")) : z === "verlangt" ? t("gz.stempel.gesperrt") : t("gz.stempel.verfuegbar");
  return (
    <article className={`gz-karte ${z}`} aria-label={v.name}>
      <div className="gz-bild">
        <WunderBild art={v.bild ?? "stadt"} zustand={z === "bau" ? "bau" : z === "verlangt" ? "entwurf" : "fertig"} fortschritt={s.fortschritt} animiert={z === "bau" && s.status !== "pausiert"} />
        <span className="gz-klasse">{KLASSEN_NAMEN[v.klasse]}</span>
        <span className={`gz-stempel ${z}`}>{stempel}</span>
      </div>
      <div className="gz-inhalt">
        <h4>{v.name}</h4>
        <div className="gz-preise">
          {z !== "bau" && k.pk > 0 && <Preis r="pk" wert={zahl(k.pk)} knapp={!s.bezahlbar} />}
          {z !== "bau" && <Preis r="bau" wert={zahl(k.bau, 0)} />}
          {z === "bau"
            ? s.restMonate !== undefined && <Preis r="zeit" wert={zahl(s.restMonate, 0)} einheit={t("gz.einheit.rest")} />
            : <Preis r="zeit" wert={zahl(k.monate, 0)} einheit={t("gz.einheit.monate")} />}
          {z !== "bau" && k.schulden ? <Preis r="schulden" wert={`+${zahl(k.schulden)}`} einheit={t("gz.einheit.pp")} /> : null}
          {z !== "bau" && k.verwaltung ? <Preis r="verwaltung" wert={zahl(k.verwaltung)} knapp={!s.verwaltungOk} /> : null}
        </div>
        {wirkung.length > 0 && (
          <ul className="gz-wirkung">
            {wirkung.map((x) => <li key={x.text} className={x.gut ? "gut" : "schlecht"}>{x.richtung > 0 ? "▲" : "▼"} {x.text}</li>)}
          </ul>
        )}
        {v.kehrseite && <p className="gz-kehrseite">{v.kehrseite}</p>}
        {z === "verlangt" && fehlt.length > 0 && <p className="gz-hinweis">{t("gz.verlangt", { was: fehlt.join(" · ") })}</p>}
        {z === "moeglich" && !s.bezahlbar && <p className="gz-hinweis knapp">{t("gz.kein_kapital")}</p>}
        {z === "moeglich" && s.bezahlbar && !s.verwaltungOk && <p className="gz-hinweis knapp">{t("gz.verwaltung_knapp")}</p>}
        <button type="button" className="gz-knopf" onClick={oeffnen}>
          {z === "bau" ? t("gz.knopf.bau") : z === "verlangt" ? t("gz.knopf.weg") : t("gz.knopf.pruefen")}
        </button>
      </div>
    </article>
  );
}

/** Der Kartenblock einer Bereichsakte. `oeffnen` springt in die Fachansicht des Reichs, wo das Vorhaben begonnen wird. */
export function Bildkarten({ w, reichBereich, ziel, oeffnen }: { w: World; reichBereich: string; ziel: string; oeffnen: () => void }) {
  if (!w.spiel) return null;
  const auswahl = kartenAuswahl(w, reichBereich);
  if (!auswahl.length) return null;
  const gesamt = vorhabenListe(w, reichBereich).filter((s) => !istAbleger(s) && s.status !== "fertig").length;
  return (
    <section className="gz-karten-block" aria-label={t("gz.karten.titel")}>
      <h3 className="gz-karten-kopf">{t("gz.karten.titel")}</h3>
      <div className="gz-karten">
        {auswahl.map(({ s, z }) => <Bildkarte key={s.v.id} s={s} z={z} w={w} oeffnen={oeffnen} />)}
      </div>
      {gesamt > auswahl.length && <button type="button" className="gz-mehr" onClick={oeffnen}>{t("gz.karten.mehr", { n: gesamt, ziel })}</button>}
    </section>
  );
}
