// Bestand pflegen: Was gebaut ist, verfällt ohne Pflege. Jedes Stück zeigt seinen Zustand, was es heute bringt, was ohne Pflege fehlt
// und was die Instandsetzung bringt (Zahlen aus dem Weltzustand, dieselbe Rechnung wie im Monatsschritt). Kultur und Technik folgen
// demselben Muster: Zustand sichtbar, Eingriff, Wirkung. Für Stätten heißt der Eingriff „Restaurieren“, für Bauwerke und Rüstung „Instandsetzen“.

import { useState } from "react";
import type { World } from "../../sim/types";
import type { Bereich } from "../../sim/reich-typen";
import { beginne, pflegeStand, reichZustand, type EffektZeile, type PflegeStand } from "../../sim/reich";
import { t } from "../../i18n";

/** Die Wirkungszeilen als Plaketten, mit der Ausgangslage („heute 58“) wo bekannt. */
export function Zeilen({ zeilen, leer }: { zeilen: EffektZeile[]; leer?: string | undefined }) {
  if (!zeilen.length) return leer ? <p className="rp-leer">{leer}</p> : null;
  return (
    <ul className="rr-wirkung-zeilen">
      {zeilen.map((z) => (
        <li key={z.text} className={z.gut ? "rr-gut" : "rr-schlecht"}>
          <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
          {z.heute !== undefined && <small> (heute {z.heute})</small>}
        </li>
      ))}
    </ul>
  );
}

/** Die Bestandsstücke eines Bereichs, die sich pflegen lassen (ohne Einrichtungen, deren Zustand nichts bewegt). */
export function pflegeIds(world: World, bereich: Bereich): string[] {
  const z = reichZustand(world);
  return Object.keys(z.bestand).filter((id) => {
    const s = pflegeStand(world, id);
    return !!s && s.v.bereich === bereich && s.v.klasse !== "institution";
  });
}

/** Stücke, die spürbar unter ihrem Zustand vom Spielbeginn liegen (acht Punkte und mehr). */
export function dringendste(world: World, bereich: Bereich, n: number): PflegeStand[] {
  return pflegeIds(world, bereich)
    .map((id) => pflegeStand(world, id)!)
    .filter((s) => s.dringlichkeit >= 8 && s.pflege)
    .sort((a, b) => b.dringlichkeit - a.dringlichkeit)
    .slice(0, n);
}

/** Stücke, bei denen die Instandsetzung am meisten bewegt, wenn sie jetzt möglich ist. */
export function lohnendste(world: World, bereich: Bereich, n: number, mindestens = 0.5): PflegeStand[] {
  return pflegeIds(world, bereich)
    .map((id) => pflegeStand(world, id)!)
    .filter((s) => !!s.pflege && s.pflege.bereit && s.pflege.status === "verfuegbar" && s.nutzen >= mindestens)
    .sort((a, b) => b.nutzen - a.nutzen)
    .slice(0, n);
}

/** In einem Wort, wie es um das Stück steht. */
export function zustandWort(s: PflegeStand): string {
  if (s.bezug === undefined) return s.zustand >= 85 ? "gut in Schuss" : s.zustand >= 60 ? "zeigt Alterung" : "verschlissen";
  if (s.skala > 0.1) return "besser als zum Spielbeginn";
  if (s.skala < -0.1) return "schlechter als zum Spielbeginn";
  return "wie zum Spielbeginn";
}

function Zustandsbalken({ zustand, bezug }: { zustand: number; bezug?: number | undefined }) {
  return (
    <div className="rr-zustand" title={bezug !== undefined ? `Strich: Zustand zum Spielbeginn (${bezug}). Darüber bringt das Stück mehr als damals, darunter weniger.` : "Ohne Pflege verfällt der Zustand; er bestimmt, wie viel das Bauwerk bringt."}>
      <span>{t("reich.pflege.zustandLabel", { defaultValue: "Zustand" })}</span>
      <span className="rr-balken" aria-hidden>
        <i style={{ width: `${Math.round(zustand)}%` }} className={zustand < 40 ? "schwach" : ""} />
        {bezug !== undefined && <b style={{ left: `${bezug}%` }} />}
      </span>
      <b>{Math.round(zustand)}</b>
    </div>
  );
}

function PflegeKarte({ s, world, refresh }: { s: PflegeStand; world: World; refresh: () => void }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string } | null>(null);
  const v = s.v;
  const p = s.pflege;
  const pv = p?.v;
  const laeuft = p && (p.status === "im_bau" || p.status === "pausiert");
  const offen = p?.voraus.filter((x) => !x.erfuellt) ?? [];
  const gewinnt = (s.nach?.gewinn.length ?? 0) > 0;
  const los = () => {
    if (!pv) return;
    const r = beginne(world, pv.id, "ausschreibung");
    setAntwort({ ok: r.ok, text: r.text });
    refresh();
  };
  return (
    <article className={`rp-karte${s.dringlichkeit >= 8 ? " dringend" : ""}`}>
      <header className="rp-kopf">
        <h4>{v.name}</h4>
        <span className="rp-wort">{zustandWort(s)}</span>
      </header>
      {v.ort && <p className="rr-ort">{v.ort.name}</p>}
      <Zustandsbalken zustand={s.zustand} bezug={s.bezug} />

      <div className="rp-block">
        <b className="rr-wirkung-kopf">{s.bezug !== undefined ? "Was es heute gegenüber dem Spielbeginn bringt" : "Was es heute bringt"}</b>
        {s.wirkt ? (
          <Zeilen zeilen={s.jetzt} leer={s.bezug !== undefined ? "Genau so viel wie zum Spielbeginn; das steckt schon in den Startwerten des Landes." : "Noch keine messbare Wirkung."} />
        ) : (
          <p className="rp-leer">Der Zustand bewegt hier keine Größen im Land, nur Beziehungen zu anderen Ländern.</p>
        )}
      </div>

      <div className="rp-block">
        <b className="rr-wirkung-kopf">Ohne Pflege</b>
        <p className="rp-satz">
          Verfällt um etwa {s.verfall.proJahr.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Punkte im Jahr, in fünf Jahren auf {Math.round(s.verfall.zustand)}.
          {s.verfall.verlust.length === 0 ? " Das spürt man in dieser Amtszeit kaum." : " Dann fehlt:"}
        </p>
        <Zeilen zeilen={s.verfall.verlust} />
      </div>

      {pv && (
        <div className="rp-block rp-eingriff">
          <b className="rr-wirkung-kopf">{t("reich.pflege.instandsetzen", { defaultValue: "Instandsetzen" })}</b>
          {laeuft ? (
            <p className="rp-satz">
              Läuft: {Math.round(p!.fortschritt * 100)} Prozent
              {p!.status === "pausiert" ? ", ruht" : p!.restMonate ? `, noch etwa ${p!.restMonate} ${p!.restMonate === 1 ? "Monat" : "Monate"}` : ""}.
            </p>
          ) : (
            <>
              {s.nach && (
                <p className="rp-satz">
                  Zustand {Math.round(s.zustand)} → {Math.round(s.nach.zustand)}.{" "}
                  {gewinnt ? "Danach bringt es zusätzlich:" : "Danach bringt es kaum etwas Messbares mehr; es bremst nur den Verfall."}
                </p>
              )}
              <Zeilen zeilen={s.nach?.gewinn ?? []} />
              <ul className="rr-kosten" aria-label="Kosten">
                <li><b>{pv.kosten.pk}</b> Kapital</li>
                <li><b>{pv.kosten.bau}</b> Baupunkte</li>
                <li><b>{pv.kosten.monate}</b> Monate</li>
                {pv.kosten.verwaltung ? <li><b>{pv.kosten.verwaltung}</b> Verwaltung/Monat</li> : null}
              </ul>
              {offen.length > 0 ? (
                <p className="rp-satz rp-nicht">Nicht nötig: {offen.map((x) => x.text).join("; ")}.</p>
              ) : (
                <button type="button" className="aktion-knopf" onClick={los} disabled={!p!.bezahlbar || !p!.verwaltungOk} title={!p!.bezahlbar ? t("reich.pflege.fehltKapital", { defaultValue: "Dafür fehlt Kapital" }) : !p!.verwaltungOk ? t("reich.pflege.fehltVerwaltung", { defaultValue: "Die Verwaltungskraft reicht nicht" }) : undefined}>
                  {t("reich.pflege.instandsetzen", { defaultValue: "Instandsetzen" })}
                </button>
              )}
              <p className="rr-kehrseite"><b>Der Preis:</b> {pv.kehrseite}</p>
            </>
          )}
          {antwort && <p className={`rr-ergebnis ${antwort.ok ? "ok" : "nein"}`}>{antwort.text}</p>}
        </div>
      )}
    </article>
  );
}

/** Die Liste „Bestand pflegen“ für Infrastruktur und Rüstung: das Dringendste zuerst. */
export function PflegeListe({ world, bereich, refresh }: { world: World; bereich: Bereich; refresh: () => void }) {
  const stuecke = pflegeIds(world, bereich)
    .map((id) => pflegeStand(world, id)!)
    .sort((a, b) => b.dringlichkeit - a.dringlichkeit || b.nutzen - a.nutzen);
  if (!stuecke.length) return <p className="subtitle">Hier gibt es nichts, was sich pflegen ließe.</p>;
  return (
    <section className="rr-abschnitt">
      <h4>
        Bestand <em>{stuecke.length} {stuecke.length === 1 ? "Stück" : "Stücke"}, das Dringendste zuerst</em>
      </h4>
      <p className="rr-hinweis">Was gebaut ist, verfällt ohne Pflege. Der Strich im Balken zeigt den Zustand zum Spielbeginn: Darüber bringt ein Stück mehr als damals, darunter weniger. Instandsetzen kostet Baukapazität, die dann für Neues fehlt.</p>
      <div className="rp-liste">
        {stuecke.map((s) => (
          <PflegeKarte key={s.id} s={s} world={world} refresh={refresh} />
        ))}
      </div>
    </section>
  );
}

/** Auf der Lage-Seite: wo Instandsetzen am meisten bringt, mit Knopf; der Rest steht unter „pflegen“. */
export function Lohnt({ world, bereich, refresh, zuPflege }: { world: World; bereich: Bereich; refresh: () => void; zuPflege: () => void }) {
  const [antwort, setAntwort] = useState<Record<string, { ok: boolean; text: string }>>({});
  const liste = lohnendste(world, bereich, 3);
  const verfaellt = dringendste(world, bereich, 99).length;
  if (!liste.length && !verfaellt) return null;
  return (
    <section className="rr-abschnitt">
      <h4>
        {t("reich.pflege.titel", { defaultValue: "Hier lohnt sich Pflege" })} <em>{t("reich.pflege.untertitel", { defaultValue: "wo Instandsetzen am meisten bewegt" })}</em>
      </h4>
      {liste.length === 0 ? (
        <p className="rr-hinweis">Im Moment bewegt keine Instandsetzung viel; {verfaellt} {verfaellt === 1 ? "Stück liegt" : "Stücke liegen"} aber schon spürbar unter dem Zustand vom Spielbeginn.</p>
      ) : (
        <ul className="rv-liste">
          {liste.map((s) => (
            <li key={s.id} className="rv-eintrag">
              <div className="rv-kopf">
                <strong>{s.v.name}</strong>
                <span className="rr-bau-info">
                  {t("reich.pflege.zustand", { von: Math.round(s.zustand), nach: Math.round(s.nach?.zustand ?? s.zustand), defaultValue: `Zustand ${Math.round(s.zustand)} → ${Math.round(s.nach?.zustand ?? s.zustand)}` })}
                </span>
              </div>
              <Zeilen zeilen={s.nach?.gewinn ?? []} />
              <div className="rp-reihe">
                <button
                  type="button"
                  className="aktion-knopf"
                  disabled={!s.pflege!.bezahlbar || !s.pflege!.verwaltungOk}
                  title={!s.pflege!.bezahlbar ? t("reich.pflege.fehltKapital", { defaultValue: "Dafür fehlt Kapital" }) : !s.pflege!.verwaltungOk ? t("reich.pflege.fehltVerwaltung", { defaultValue: "Die Verwaltungskraft reicht nicht" }) : undefined}
                  onClick={() => {
                    const r = beginne(world, s.pflege!.v.id, "ausschreibung");
                    setAntwort((a) => ({ ...a, [s.id]: { ok: r.ok, text: r.text } }));
                    refresh();
                  }}
                >
                  {t("reich.pflege.instandsetzen", { defaultValue: "Instandsetzen" })}
                </button>
                <span className="rr-bau-info">
                  {t("reich.pflege.kosten", { pk: s.pflege!.v.kosten.pk, bau: s.pflege!.v.kosten.bau, monate: s.pflege!.v.kosten.monate, defaultValue: `${s.pflege!.v.kosten.pk} Kapital · ${s.pflege!.v.kosten.bau} Baupunkte · ${s.pflege!.v.kosten.monate} Monate` })}
                </span>
              </div>
              {antwort[s.id] && <p className={`rr-ergebnis ${antwort[s.id]!.ok ? "ok" : "nein"}`}>{antwort[s.id]!.text}</p>}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="link" onClick={zuPflege}>
        {t("reich.pflege.alle", { defaultValue: "Alle Stücke mit Zustand und Folgen ansehen" })}
      </button>
    </section>
  );
}
