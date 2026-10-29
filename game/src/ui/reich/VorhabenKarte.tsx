// Eine Karte für ein Vorhaben: Was es ist, was es kostet (Kapital, Bau, Verwaltung, Schulden, Zeit), was verlangt wird, was es bringt und was es kostet, das nicht im Geld steckt.
// Beim Beginn wählt der Spieler die Bauvergabe (Stammfirma, Sparvergabe, transparente Ausschreibung); danach steht sie fest und erscheint als Plakette.
// Großvorhaben nennen außerdem ihren Maßstab (Analogie aus der Wirklichkeit), das Risiko (Mehrkosten, ungewisser Durchbruch), die Konkurrenz und was schon während des Baus wirkt.

import { useState } from "react";
import { effektZeile, vergabeAngebot, wirkungsVorschau, type VorhabenSicht } from "../../sim/reich";
import type { World } from "../../sim/types";
import { KLASSEN_NAMEN, VERGABE_NAMEN, type Vergabe } from "../../sim/reich-typen";
import { NET } from "../../sim/modell";
import { WunderBild } from "./WunderBild";

import { t } from "../../i18n";
import { t as tx } from "../../i18n";
import { ohneBeleg } from "../../i18n/ohne-beleg";
const STATUS_WORT: Record<VorhabenSicht["status"], string> = {
  fertig: "Fertig",
  im_bau: "Im Bau",
  pausiert: "Pausiert",
  verfuegbar: "",
  gesperrt: "Gesperrt",
  ausgeschlossen: "Ausgeschlossen",
};

/** Die drei Vergabe-Wege in Worten; die Zahlen kommen aus `vergabeAngebot` (Spielparameter, keine Tatsachen). */
const VERGABE_REIHENFOLGE: Vergabe[] = ["stammfirma", "sparvergabe", "ausschreibung"];
const VERGABE_TEXT: Record<Vergabe, string> = {
  stammfirma: "Schnell und loyal: kürzere Bauzeit, höhere Kosten. Nähe ohne Wettbewerb — das Korruptionsrisiko wächst, die Unternehmer danken es.",
  sparvergabe: "Günstig und langsam: weniger Kosten, längere Bauzeit, und das Ergebnis beginnt in schlechterem Zustand.",
  ausschreibung: "Transparente Ausschreibung: Der Baubeginn verzögert sich um die Vergabephase; dafür kein Korruptionsrisiko, und Märkte, EU und Legitimität sehen es gern.",
};

/** Wer verliert: der Name der Gruppe aus dem Politiknetz, sonst der Text selbst. */
export function verliererName(v: string | undefined): string | null {
  if (!v) return null;
  const n = NET.nodes[NET.index.get(v) ?? -1];
  return n ? n.name : v;
}

export function VorhabenKarte({
  s,
  onBeginne,
  onKarte,
  gross = false,
  ergebnis,
  kapital,
  world,
}: {
  s: VorhabenSicht;
  onBeginne: (id: string, vergabe: Vergabe) => void;
  onKarte?: (o: { lon: number; lat: number }) => void;
  /** Wunder und Großprojekte bekommen ein Bild */
  gross?: boolean;
  ergebnis?: { ok: boolean; text: string } | undefined;
  /** Politisches Kapital des Spielers, um unbezahlbare Vergaben auszugrauen */
  kapital?: number;
  /** Mit der Welt zeigt die Karte zu jeder Wirkung die Ausgangslage („heute 58“) */
  world?: World;
}) {
  const v = s.v;
  // Ob die Vergabe-Wahl auf dieser Karte aufgeklappt ist
  const [vergabeWahl, setVergabeWahl] = useState(false);
  const zeigt = s.status === "verfuegbar" || s.status === "gesperrt" || s.status === "ausgeschlossen";
  const vor = world ? wirkungsVorschau(world, v.id) : null;
  const gewinn = (vor ? vor.sofort : v.abschluss.map((e) => effektZeile(e)).filter((x): x is NonNullable<typeof x> => !!x)).slice(0, 6);
  const dauer = (vor ? vor.dauerhaft : (v.dauer ?? []).map((e) => effektZeile(e, "dauer")).filter((x): x is NonNullable<typeof x> => !!x)).slice(0, 5);
  const waehrend = (vor ? vor.waehrendBau : (v.bauwirkung ?? []).map((e) => effektZeile(e, "dauer")).filter((x): x is NonNullable<typeof x> => !!x)).slice(0, 4);
  const kapazitaet = vor?.kapazitaet ?? [];
  const abgelesen = vor?.zeigt ?? [];
  const risiko = vor?.risiko;
  const los = s.voraus.filter((x) => !x.erfuellt);
  const grund = !s.bereit ? "Voraussetzungen fehlen" : !s.bezahlbar ? "Dafür fehlt Kapital" : !s.verwaltungOk ? "Die Verwaltungskraft reicht nicht" : "";
  const vl = verliererName(v.verlierer);
  return (
    <article className={`rr-karte klasse-${v.klasse} status-${s.status}${gross ? " gross" : ""}${v.unrealistisch ? " unrealistisch" : ""}`}>
      {gross && v.bild && (
        <div className="rr-bild">
          <WunderBild
            art={v.bild}
            zustand={s.status === "fertig" ? "fertig" : s.status === "im_bau" || s.status === "pausiert" ? "bau" : "entwurf"}
            fortschritt={s.fortschritt}
            klasse={s.status === "pausiert" ? "ruht" : ""}
          />
          {s.status === "fertig" && <span className="rr-siegel">{tx("ui2.ui.reich.VorhabenKarte.8c37851")}</span>}
        </div>
      )}
      <div className="rr-karte-kopf">
        <span className="rr-klasse">{KLASSEN_NAMEN[v.klasse]}</span>
        {v.stufe !== undefined && v.stufe > 0 && v.thema && (
          <span className="rr-plakette stufe" title={t("ui.reich.VorhabenKarte.bfa9ed8")}>
            {tx("ui2.ui.reich.VorhabenKarte.875014d", { p0: v.stufe })}
          </span>
        )}
        {v.unrealistisch && (
          <span className="rr-plakette unrealistisch" title={t("ui.reich.VorhabenKarte.bdb9458")}>
            {tx("ui2.ui.reich.VorhabenKarte.d283436")}
          </span>
        )}
        {v.frei && (
          <span className="rr-plakette geschaetzt" title={t("ui.reich.VorhabenKarte.ecf3030")}>
            {t("ui.reich.VorhabenKarte.59d1b61")}
          </span>
        )}
        {s.vergabe && (s.status === "im_bau" || s.status === "pausiert") && (
          <span className="rr-plakette" title={tx("ui2.ui.reich.VorhabenKarte.363f926", { p0: VERGABE_NAMEN[s.vergabe] })}>
            {VERGABE_NAMEN[s.vergabe]}
          </span>
        )}
        {STATUS_WORT[s.status] && <span className={`rr-status ${s.status}`}>{STATUS_WORT[s.status]}</span>}
      </div>
      <h4 className="rr-name">{v.name}</h4>
      {v.ort && (
        <p className="rr-ort">
          {v.ort.name}
          {onKarte && <span> · </span>}
          {onKarte && (
            <button type="button" className="link" onClick={() => onKarte({ lon: v.ort!.lon, lat: v.ort!.lat })}>
              {t("ui.reich.VorhabenKarte.b92f3e9")}
            </button>
          )}
        </p>
      )}
      <p className="rr-text">{ohneBeleg(v.text)}</p>

      {s.status === "fertig" && s.zustand !== undefined && (
        <div className="rr-zustand" title={t("ui.reich.VorhabenKarte.c617cab")}>
          <span>{tx("ui2.ui.reich.VorhabenKarte.97574a9")}</span>
          <span className="rr-balken" aria-hidden>
            <i style={{ width: `${s.zustand}%` }} className={s.zustand < 40 ? "schwach" : ""} />
          </span>
          <b>{Math.round(s.zustand)}</b>
        </div>
      )}

      {(s.status === "im_bau" || s.status === "pausiert") && (
        <div className={`rr-bau wunder-a-bau${s.status === "pausiert" ? " ruht" : ""}`}>
          <span className="rr-balken" aria-hidden>
            <i style={{ width: `${Math.round(s.fortschritt * 100)}%` }} />
          </span>
          <span>
            {tx("ui2.ui.reich.VorhabenKarte.9844a1b", { p0: Math.round(s.fortschritt * 100) })}
            {s.status === "pausiert"
              ? ", ruht"
              : s.vergabePhase
                ? tx("ui2.ui.reich.VorhabenKarte.783d302", { p0: s.vergabeMonate, p1: s.vergabeMonate === 1 ? "Monat" : "Monaten" })
                : s.rate && s.rate > 0
                  ? tx("ui2.ui.reich.VorhabenKarte.36e9b81", { p0: s.restMonate })
                  : tx("ui2.ui.reich.VorhabenKarte.ac5a414")}
          </span>
        </div>
      )}

      {zeigt && (
        <>
          <ul className="rr-kosten" aria-label={tx("ui2.ui.reich.VorhabenKarte.9bc1843")}>
            {v.kosten.pk > 0 && (
              <li title={t("ui.reich.VorhabenKarte.d7d018d")}>
                <b>{v.kosten.pk}</b> {tx("ui2.ui.reich.VorhabenKarte.28d438e")}
              </li>
            )}
            {v.kosten.bau > 0 && (
              <li title={t("ui.reich.VorhabenKarte.b4e53a4")}>
                <b>{v.kosten.bau.toLocaleString("de-DE")}</b> {tx("ui2.ui.reich.VorhabenKarte.f4466ae")}
              </li>
            )}
            {(v.kosten.verwaltung ?? 0) > 0 && (
              <li title={t("ui.reich.VorhabenKarte.3a3e4ed")}>
                <b>{v.kosten.verwaltung}</b> {tx("ui2.ui.reich.VorhabenKarte.48ddb61")}
              </li>
            )}
            <li title={t("ui.reich.VorhabenKarte.72e8bf0")}>
              <b>{v.kosten.monate >= 24 ? (v.kosten.monate / 12).toLocaleString("de-DE", { maximumFractionDigits: 1 }) : v.kosten.monate}</b> {v.kosten.monate >= 24 ? tx("ui2.ui.reich.VorhabenKarte.b0bf214") : v.kosten.monate === 1 ? tx("ui2.ui.reich.VorhabenKarte.da13625") : tx("ui2.ui.reich.VorhabenKarte.1c561ae")}
            </li>
            {v.kosten.schulden ? (
              <li title={t("ui.reich.VorhabenKarte.64361a7")}>
                <b>{v.kosten.schulden.toLocaleString("de-DE")}</b> % BIP
              </li>
            ) : null}
          </ul>
          {s.voraus.length > 0 && (
            <ul className="rr-voraus" aria-label={tx("ui2.ui.reich.VorhabenKarte.bc4e9f4")}>
              {s.voraus.map((x, i) => (
                <li key={i} className={x.erfuellt ? "ok" : "offen"}>
                  <span aria-hidden>{x.erfuellt ? "✓" : "○"}</span> {x.text}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {(gewinn.length > 0 || dauer.length > 0 || waehrend.length > 0 || kapazitaet.length > 0 || abgelesen.length > 0) && (
        <div className="rr-wirkung">
          {waehrend.length > 0 && (
            <>
              <b className="rr-wirkung-kopf">{t("ui.reich.VorhabenKarte.2e75f12")}</b>
              <ul>
                {waehrend.map((z) => (
                  <li key={z.text} className={z.gut ? "rr-gut" : "rr-schlecht"}>
                    <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
                    {z.heute !== undefined && <small> {tx("ui2.ui.reich.VorhabenKarte.c74abd2", { p0: z.heute })}</small>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {gewinn.length > 0 && <b className="rr-wirkung-kopf">{s.status === "fertig" ? tx("ui2.ui.reich.VorhabenKarte.e9194ba") : tx("ui2.ui.reich.VorhabenKarte.53fb0a3")}</b>}
          <ul>
            {gewinn.map((z) => (
              <li key={z.text} className={z.gut ? "rr-gut" : "rr-schlecht"}>
                <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
                {z.heute !== undefined && <small> {tx("ui2.ui.reich.VorhabenKarte.c74abd2", { p0: z.heute })}</small>}
              </li>
            ))}
          </ul>
          {dauer.length > 0 && (
            <>
              <b className="rr-wirkung-kopf">{tx("ui2.ui.reich.VorhabenKarte.90053b7")}</b>
              <ul>
                {dauer.map((z) => (
                  <li key={z.text} className={z.gut ? "rr-gut" : "rr-schlecht"}>
                    <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
                    {z.heute !== undefined && <small> {tx("ui2.ui.reich.VorhabenKarte.c74abd2", { p0: z.heute })}</small>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {kapazitaet.length > 0 && (
            <ul>
              {kapazitaet.map((t) => (
                <li key={t} className="rr-gut">
                  <span aria-hidden>▲</span> {t}
                </li>
              ))}
            </ul>
          )}
          {abgelesen.length > 0 && (
            <>
              <b className="rr-wirkung-kopf">{tx("ui2.ui.reich.VorhabenKarte.46f13e3")}</b>
              <ul>
                {abgelesen.map((g) => (
                  <li key={g.id} className={g.gut ? "rr-gut" : "rr-schlecht"}>
                    {tx("ui2.ui.reich.VorhabenKarte.96504fa", { p0: g.name, p1: g.wert })}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {risiko && zeigt && <p className="rr-risiko"><b>{tx("ui2.ui.reich.VorhabenKarte.4b9c493")}</b> {risiko}</p>}
      <p className="rr-kehrseite">
        <b>{tx("ui2.ui.reich.VorhabenKarte.0289c3f")}</b> {v.kehrseite}
        {vl && <em> Es verliert: {vl}.</em>}
      </p>
      {v.konkurrenz && zeigt && <p className="rr-konkurrenz"><b>{t("ui.reich.VorhabenKarte.dea39ba")}</b> {v.konkurrenz}</p>}
      {v.anker && zeigt && <p className="rr-anker"><b>{t("ui.reich.VorhabenKarte.ac9df63")}</b> {ohneBeleg(v.anker)}</p>}

      {s.grund && (s.status === "gesperrt" || s.status === "ausgeschlossen") && <p className="rr-sperre">{s.grund}</p>}
      {ergebnis && <p className={`rr-ergebnis ${ergebnis.ok ? "ok" : "nein"}`}>{ergebnis.text}</p>}
      {zeigt && s.status === "verfuegbar" && !vergabeWahl && (
        <button type="button" className="aktion-knopf rr-beginnen" disabled={!!grund} onClick={() => setVergabeWahl(true)} title={grund || undefined}>
          {tx("ui2.ui.reich.VorhabenKarte.0760a98")}
          {los.length > 0 && <small> {tx("ui2.ui.reich.VorhabenKarte.35b2f5c", { p0: los.length })}{los.length === 1 ? "" : "en"} offen)</small>}
        </button>
      )}
      {zeigt && s.status === "verfuegbar" && vergabeWahl && (
        <div className="rr-vergabe">
          <b className="rr-wirkung-kopf">{t("ui.reich.VorhabenKarte.1c4cddd")}</b>
          <ul>
            {VERGABE_REIHENFOLGE.map((weg) => {
              const a = vergabeAngebot(v, weg);
              const unbezahlbar = kapital !== undefined && kapital + 1e-9 < a.pk;
              return (
                <li key={weg}>
                  <button
                    type="button"
                    className="aktion-knopf"
                    disabled={unbezahlbar}
                    title={unbezahlbar ? tx("ui2.ui.reich.VorhabenKarte.36325d8", { p0: a.pk }) : VERGABE_TEXT[weg]}
                    onClick={() => {
                      setVergabeWahl(false);
                      onBeginne(v.id, weg);
                    }}
                  >
                    {VERGABE_NAMEN[weg]}
                  </button>
                  <span className="rr-bau-info">
                    {tx("ui2.ui.reich.VorhabenKarte.632836b", { p0: a.pk, p1: a.bau.toLocaleString("de-DE"), p2: a.monate })} {a.monate === 1 ? tx("ui2.ui.reich.VorhabenKarte.da13625") : tx("ui2.ui.reich.VorhabenKarte.1c561ae")}
                    {a.vorlauf > 0 ? tx("ui2.ui.reich.VorhabenKarte.a3ec358", { p0: a.vorlauf }) : ""}
                  </span>
                  <p className="rr-hinweis">{VERGABE_TEXT[weg]}</p>
                </li>
              );
            })}
          </ul>
          <button type="button" className="link" onClick={() => setVergabeWahl(false)}>
            {t("ui.reich.VorhabenKarte.4080624")}
          </button>
        </div>
      )}
    </article>
  );
}
