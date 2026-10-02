// Eine Karte für ein Vorhaben: Was es ist, was es kostet (Kapital, Bau, Verwaltung, Zeit), was verlangt wird, was es bringt und was es kostet, das nicht im Geld steckt.
// Beim Beginn wählt der Spieler die Bauvergabe (Stammfirma, Sparvergabe, transparente Ausschreibung); danach steht sie fest und erscheint als Plakette.

import { useState } from "react";
import { effektZeile, vergabeAngebot, type VorhabenSicht } from "../../sim/reich";
import { KLASSEN_NAMEN, VERGABE_NAMEN, type Vergabe } from "../../sim/reich-typen";
import { NET } from "../../sim/modell";
import { WunderBild } from "./WunderBild";

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

function verlierer(v: string | undefined): string | null {
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
}: {
  s: VorhabenSicht;
  onBeginne: (id: string, vergabe: Vergabe) => void;
  onKarte?: (o: { lon: number; lat: number }) => void;
  /** Wunder und Großprojekte bekommen ein Bild */
  gross?: boolean;
  ergebnis?: { ok: boolean; text: string } | undefined;
  /** Politisches Kapital des Spielers, um unbezahlbare Vergaben auszugrauen */
  kapital?: number;
}) {
  const v = s.v;
  // Ob die Vergabe-Wahl auf dieser Karte aufgeklappt ist
  const [vergabeWahl, setVergabeWahl] = useState(false);
  const zeigt = s.status === "verfuegbar" || s.status === "gesperrt" || s.status === "ausgeschlossen";
  const gewinn = v.abschluss.map((e) => effektZeile(e)).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 6);
  const dauer = (v.dauer ?? []).map((e) => effektZeile(e, "dauer")).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 4);
  const los = s.voraus.filter((x) => !x.erfuellt);
  const grund = !s.bereit ? "Voraussetzungen fehlen" : !s.bezahlbar ? "Dafür fehlt Kapital" : !s.verwaltungOk ? "Die Verwaltungskraft reicht nicht" : "";
  const vl = verlierer(v.verlierer);
  return (
    <article className={`rr-karte klasse-${v.klasse} status-${s.status}${gross ? " gross" : ""}`}>
      {gross && v.bild && (
        <div className="rr-bild">
          <WunderBild
            art={v.bild}
            zustand={s.status === "fertig" ? "fertig" : s.status === "im_bau" || s.status === "pausiert" ? "bau" : "entwurf"}
            fortschritt={s.fortschritt}
            klasse={s.status === "pausiert" ? "ruht" : ""}
          />
          {s.status === "fertig" && <span className="rr-siegel">Vollendet</span>}
        </div>
      )}
      <div className="rr-karte-kopf">
        <span className="rr-klasse">{KLASSEN_NAMEN[v.klasse]}</span>
        {s.vergabe && (s.status === "im_bau" || s.status === "pausiert") && (
          <span className="rr-plakette" title={`Vergeben als: ${VERGABE_NAMEN[s.vergabe]} — die Wahl steht seit dem Beginn fest.`}>
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
              auf der Karte
            </button>
          )}
        </p>
      )}
      <p className="rr-text">{v.text}</p>

      {s.status === "fertig" && s.zustand !== undefined && (
        <div className="rr-zustand" title="Ohne Pflege verfällt der Zustand; er bestimmt, wie viel das Bauwerk bringt.">
          <span>Zustand</span>
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
            {Math.round(s.fortschritt * 100)} Prozent
            {s.status === "pausiert"
              ? ", ruht"
              : s.vergabePhase
                ? `, Vergabephase läuft — Baubeginn in etwa ${s.vergabeMonate} ${s.vergabeMonate === 1 ? "Monat" : "Monaten"}`
                : s.rate && s.rate > 0
                  ? `, noch etwa ${s.restMonate} Monate`
                  : ", wartet auf Baukapazität"}
          </span>
        </div>
      )}

      {zeigt && (
        <>
          <ul className="rr-kosten" aria-label="Kosten">
            {v.kosten.pk > 0 && (
              <li title="Politisches Kapital beim Beginn">
                <b>{v.kosten.pk}</b> Kapital
              </li>
            )}
            {v.kosten.bau > 0 && (
              <li title="Baupunkte insgesamt; die Baukapazität des Landes teilt sie auf">
                <b>{v.kosten.bau}</b> Baupunkte
              </li>
            )}
            {(v.kosten.verwaltung ?? 0) > 0 && (
              <li title="Verwaltungskraft je Monat während des Baus">
                <b>{v.kosten.verwaltung}</b> Verwaltung/Monat
              </li>
            )}
            <li title="Frühestens so lange, auch mit viel Baukapazität">
              <b>{v.kosten.monate}</b> {v.kosten.monate === 1 ? "Monat" : "Monate"}
            </li>
            {v.kosten.schulden ? (
              <li title="Erhöht die Schuldenquote, verteilt über die Bauzeit">
                <b>{v.kosten.schulden.toLocaleString("de-DE")}</b> % BIP
              </li>
            ) : null}
          </ul>
          {s.voraus.length > 0 && (
            <ul className="rr-voraus" aria-label="Voraussetzungen">
              {s.voraus.map((x, i) => (
                <li key={i} className={x.erfuellt ? "ok" : "offen"}>
                  <span aria-hidden>{x.erfuellt ? "✓" : "○"}</span> {x.text}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {(gewinn.length > 0 || dauer.length > 0) && (
        <div className="rr-wirkung">
          {gewinn.length > 0 && <b className="rr-wirkung-kopf">{s.status === "fertig" ? "Hat gebracht" : "Bringt"}</b>}
          <ul>
            {gewinn.map((z) => (
              <li key={z.text} className={z.gut ? "rr-gut" : "rr-schlecht"}>
                <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
              </li>
            ))}
          </ul>
          {dauer.length > 0 && (
            <>
              <b className="rr-wirkung-kopf">Dauerhaft</b>
              <ul>
                {dauer.map((z) => (
                  <li key={z.text} className={z.gut ? "rr-gut" : "rr-schlecht"}>
                    <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <p className="rr-kehrseite">
        <b>Der Preis:</b> {v.kehrseite}
        {vl && <em> Es verliert: {vl}.</em>}
      </p>

      {s.grund && (s.status === "gesperrt" || s.status === "ausgeschlossen") && <p className="rr-sperre">{s.grund}</p>}
      {ergebnis && <p className={`rr-ergebnis ${ergebnis.ok ? "ok" : "nein"}`}>{ergebnis.text}</p>}
      {zeigt && s.status === "verfuegbar" && !vergabeWahl && (
        <button type="button" className="aktion-knopf rr-beginnen" disabled={!!grund} onClick={() => setVergabeWahl(true)} title={grund || undefined}>
          Beginnen
          {los.length > 0 && <small> ({los.length} Voraussetzung{los.length === 1 ? "" : "en"} offen)</small>}
        </button>
      )}
      {zeigt && s.status === "verfuegbar" && vergabeWahl && (
        <div className="rr-vergabe">
          <b className="rr-wirkung-kopf">Wie wird der Auftrag vergeben? Die Wahl steht danach fest.</b>
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
                    title={unbezahlbar ? `Dafür fehlt Kapital (${a.pk} nötig).` : VERGABE_TEXT[weg]}
                    onClick={() => {
                      setVergabeWahl(false);
                      onBeginne(v.id, weg);
                    }}
                  >
                    {VERGABE_NAMEN[weg]}
                  </button>
                  <span className="rr-bau-info">
                    {a.pk} Kapital · {a.bau} Baupunkte · {a.monate} {a.monate === 1 ? "Monat" : "Monate"}
                    {a.vorlauf > 0 ? ` + ${a.vorlauf} Monate Vergabephase` : ""}
                  </span>
                  <p className="rr-hinweis">{VERGABE_TEXT[weg]}</p>
                </li>
              );
            })}
          </ul>
          <p className="rr-hinweis">Die Wirkungen der Vergabe sind Spielparameter, keine Tatsachen.</p>
          <button type="button" className="link" onClick={() => setVergabeWahl(false)}>
            Zurück
          </button>
        </div>
      )}
      {v.quelle && <p className="rr-quelle">Quelle: {v.quelle}</p>}
    </article>
  );
}
