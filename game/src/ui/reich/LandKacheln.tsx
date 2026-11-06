// Die Akte Land in Kacheln (Tagarbeit 6. November, Maßstab „Übersicht ohne Scrollen: Kacheln, Detail auf Klick, nichts doppelt“):
// Infrastruktur und Bau sowie Kultur und Erbe zeigten Vorteile, Pflege und Stätten als lange Kartenreihen und füllten fast drei
// Bildschirme. Hier stehen dieselben Angaben und Knöpfe als Kacheln; was eine Kachel nicht fasst, öffnet sich per Klick.
// Alle Zahlen kommen aus denselben Rechnungen wie vorher (sim/reich.ts), nichts wird hier neu berechnet.

import { useState } from "react";
import type { World } from "../../sim/types";
import type { Bereich } from "../../sim/reich-typen";
import { aktiveVorteile, beginne, effektZeile, erhaltung, pflegeStand, reichZustand, verwaltungBilanz, vorhabenDef, wirkungsVorschau, type PflegeStand } from "../../sim/reich";
import { ERBE, type Erbe } from "../../data/erbe";
import { VORTEILE } from "../../data/reich";
import { ohneBeleg } from "../../i18n/ohne-beleg";
import { t, zahl } from "../../i18n";
import { PflegeKarte, Zeilen, dringendste, lohnendste, pflegeIds, zustandWort } from "./Pflege";
import "./landkacheln.css";

/** Verwaltungskraft als Marke neben der Baustelle: Vorrat und Monatsbilanz (vorher ein eigener Balkenblock über der Baustelle). */
export function VerwaltungsMarke({ world }: { world: World }) {
  const vb = verwaltungBilanz(world);
  const saldo = `${vb.netto >= 0 ? "+" : "−"}${zahl(Math.abs(vb.netto), 1)}`;
  return (
    <span className={`lk-marke${vb.vorrat < 15 ? " knapp" : ""}`} title={t("ui.Reich.6284526")}>
      {t("reich.stat.verwaltung")} <b>{Math.round(vb.vorrat)}</b>
      <em className={vb.netto >= 0 ? "hoch" : "runter"}>{saldo} {t("reich.stat.imMonat")}</em>
    </span>
  );
}

/** Vorteile als Kachelreihe: Name und Stand; Beschreibung, Wirkung und Preis in der Detailfläche darunter. */
export function VorteilKacheln({ world, bereich }: { world: World; bereich: Bereich }) {
  const [offen, setOffen] = useState<string | null>(null);
  const aktiv = new Set(aktiveVorteile(world));
  const liste = VORTEILE.filter((v) => v.bereich === bereich);
  if (!liste.length) return null;
  const v = liste.find((x) => x.id === offen);
  const zeilen = (x: (typeof liste)[number]) => x.dauer.map((e) => effektZeile(e, "dauer")).filter((z): z is NonNullable<typeof z> => !!z);
  return (
    <section className="rr-abschnitt lk-abschnitt">
      <h4>
        {t("ui2.ui.Reich.b192857")} <em>{t("tag_t3.vorteileUnter", { n: liste.filter((x) => aktiv.has(x.id)).length, gesamt: liste.length })}</em>
      </h4>
      <ul className="lk-raster lk-raster-schmal">
        {liste.map((x) => {
          const an = aktiv.has(x.id);
          return (
            <li key={x.id}>
              <button type="button" className={`lk-kachel lk-vorteil${an ? " aktiv" : ""}${offen === x.id ? " on" : ""}`} aria-expanded={offen === x.id} aria-controls="lk-vorteil-detail" onClick={() => setOffen(offen === x.id ? null : x.id)}>
                <strong>{x.name}</strong>
                <span className="lk-fuss">
                  <span className={`rr-status ${an ? "fertig" : ""}`}>{an ? t("ui2.ui.Reich.16a766c") : t("ui2.ui.Reich.82a62ea")}</span>
                  <span className="lk-pfeil" aria-hidden>{offen === x.id ? "▴" : "▾"}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {v && (
        <div id="lk-vorteil-detail" className="lk-detail" role="region" aria-label={v.name}>
          <header>
            <strong>{v.name}</strong>
            <button type="button" className="knopf-leise" onClick={() => setOffen(null)}>{t("tag_t3.zuklappen")}</button>
          </header>
          <p>{ohneBeleg(v.text)}</p>
          <Zeilen zeilen={zeilen(v)} />
          <p className="rr-kehrseite"><b>{t("ui2.ui.Reich.0289c3f")}</b> {v.kehrseite}</p>
        </div>
      )}
    </section>
  );
}

/** Ein Knopf „Instandsetzen“ mit gesperrtem Zustand und Grund, wie in der Pflegeliste. */
function InstandKnopf({ s, world, refresh, onAntwort }: { s: PflegeStand; world: World; refresh: () => void; onAntwort: (a: { ok: boolean; text: string }) => void }) {
  const p = s.pflege!;
  return (
    <button
      type="button"
      className="knopf"
      disabled={!p.bezahlbar || !p.verwaltungOk}
      title={!p.bezahlbar ? t("reich.pflege.fehltKapital") : !p.verwaltungOk ? t("reich.pflege.fehltVerwaltung") : undefined}
      onClick={() => {
        const r = beginne(world, p.v.id, "ausschreibung");
        onAntwort({ ok: r.ok, text: r.text });
        refresh();
      }}
    >
      {t("reich.pflege.instandsetzen")}
    </button>
  );
}

/** „Hier lohnt sich Pflege“ als drei Kacheln: Zustand vorher und nachher, der größte Gewinn, Preis und Knopf; weitere Gewinne aufklappbar. */
export function LohntKacheln({ world, bereich, refresh, zuPflege }: { world: World; bereich: Bereich; refresh: () => void; zuPflege: () => void }) {
  const [antwort, setAntwort] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [mehr, setMehr] = useState<string | null>(null);
  const liste = lohnendste(world, bereich, 3);
  const verfaellt = dringendste(world, bereich, 99).length;
  if (!liste.length && !verfaellt) return null;
  return (
    <section className="rr-abschnitt lk-abschnitt">
      <h4>
        {t("reich.pflege.titel")} <em>{t("reich.pflege.untertitel")}</em>
        <button type="button" className="knopf-leise lk-rechts" onClick={zuPflege}>{t("reich.pflege.alle")}</button>
      </h4>
      {liste.length === 0 ? (
        <p className="rr-hinweis">{t("ui2.ui.reich.Pflege.7692875", { p0: verfaellt })} {verfaellt === 1 ? t("ui2.ui.reich.Pflege.bdac2ad") : t("ui2.ui.reich.Pflege.65af42d")} {t("ui2.ui.reich.Pflege.ee79392")}</p>
      ) : (
        <ul className={`lk-raster lk-raster-breit${mehr ? " lose" : ""}`}>
          {liste.map((s) => {
            const gewinn = s.nach?.gewinn ?? [];
            const auf = mehr === s.id;
            const pv = s.pflege!.v;
            return (
              <li key={s.id} className="lk-kachel lk-pflege">
                <strong>{s.v.name}</strong>
                <span className="lk-zustand">{t("reich.pflege.zustand", { von: Math.round(s.zustand), nach: Math.round(s.nach?.zustand ?? s.zustand) })}</span>
                <Zeilen zeilen={auf ? gewinn : gewinn.slice(0, 1)} />
                <span className="lk-preis">{t("reich.pflege.kosten", { pk: pv.kosten.pk, bau: pv.kosten.bau, monate: pv.kosten.monate })}</span>
                <span className="lk-fuss">
                  <InstandKnopf s={s} world={world} refresh={refresh} onAntwort={(a) => setAntwort((x) => ({ ...x, [s.id]: a }))} />
                  {gewinn.length > 1 && (
                    <button type="button" className="knopf-leise lk-mehr" aria-expanded={auf} onClick={() => setMehr(auf ? null : s.id)}>
                      {auf ? t("tag_t3.weniger") : t("tag_t3.weitere", { n: gewinn.length - 1 })} <span aria-hidden>{auf ? "▴" : "▾"}</span>
                    </button>
                  )}
                </span>
                {antwort[s.id] && <p className={`rr-ergebnis ${antwort[s.id]!.ok ? "ok" : "nein"}`}>{antwort[s.id]!.text}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Die am schlechtesten erhaltenen Stätten als Kacheln: Zustand, was das Restaurieren bringt, Preis und Knopf. */
export function StaettenKacheln({ world, refresh, anzahl = 3 }: { world: World; refresh: () => void; anzahl?: number }) {
  const z = reichZustand(world);
  const [rueckmeldung, setRueckmeldung] = useState<string | null>(null);
  const zustandVon = (e: Erbe) => z.staetten[e.id]?.zustand ?? 0;
  // Die volle Pflege steht in reich/Staetten.tsx als Karte mit Raster; hier nur die dringendsten
  const liste = [...ERBE].sort((a, b) => zustandVon(a) - zustandVon(b)).slice(0, anzahl);
  return (
    <section className="rr-abschnitt lk-abschnitt">
      <h4>
        {t("ui2.ui.Reich.fb453c1")} <em>{t("ui2.ui.Reich.9219dc0", { p0: Math.round(erhaltung(world)) })}</em>
      </h4>
      {rueckmeldung && <p className="rr-hinweis" role="status">{rueckmeldung}</p>}
      <ul className="lk-raster lk-raster-breit">
        {liste.map((e) => {
          const st = z.staetten[e.id]!;
          const id = `restaurierung_${e.id}`;
          const def = vorhabenDef(id);
          const laeuft = z.laufend.some((l) => l.id === id);
          const hub = def?.abschluss.find((x) => x.t === "staette");
          const nach = hub && hub.t === "staette" ? Math.min(100, st.zustand + hub.d) : undefined;
          const vor = def ? wirkungsVorschau(world, id) : null;
          const folgen = (vor?.sofort ?? []).filter((x) => !x.text.startsWith(e.name));
          const satz = st.zustand < 30 ? t("ui2.ui.Reich.64becd1") : st.zustand < 50 ? t("ui2.ui.Reich.628669a") : st.zustand < 70 ? t("ui2.ui.Reich.8db82ca") : t("ui2.ui.Reich.1ba54c0");
          return (
            <li key={e.id} className={`lk-kachel lk-staette${st.zustand < 40 ? " gefaehrdet" : ""}`}>
              <span className="lk-kopf">
                <strong>{e.name}</strong>
                {e.unesco.status === "welterbe" && <span className="rr-plakette" title={t("ui2.ui.Reich.2e2e824", { p0: e.unesco.jahr })}>{t("ui2.ui.Reich.8c5c22e")}</span>}
                {e.kirche7 && <span className="rr-plakette kirche" title={t("ui.Reich.b39ebe5")}>{t("ui2.ui.Reich.b2c752c")}</span>}
              </span>
              <span className="lk-ort">{e.ort}: {e.satz}</span>
              <span className="lk-zustandsbalken" title={satz}>
                <span className="rr-balken" aria-hidden>
                  <i style={{ width: `${st.zustand}%` }} className={st.zustand < 40 ? "schwach" : ""} />
                  {nach !== undefined && !laeuft && st.zustand <= 82 && <b className="lk-ziel" style={{ left: `${nach}%` }} />}
                </span>
                <b>{Math.round(st.zustand)}</b>
              </span>
              <span className="lk-satz">{satz}</span>
              {laeuft ? (
                <p className="lk-satz">{t("ui.Reich.b1cebac")}</p>
              ) : st.zustand > 82 ? (
                <p className="lk-satz">{t("ui.Reich.27320b7")}</p>
              ) : (
                def && (
                  <>
                    <span className="lk-zustand">
                      {t("ui2.ui.Reich.b2936db", { p0: Math.round(st.zustand) })} {nach !== undefined ? Math.round(nach) : "?"}
                    </span>
                    <Zeilen zeilen={folgen} />
                    <span className="lk-preis">{t("reich.pflege.kosten", { pk: zahl(def.kosten.pk), bau: zahl(def.kosten.bau), monate: def.kosten.monate })}</span>
                    <span className="lk-fuss">
                      <button type="button" className="knopf" title={def.kehrseite} onClick={() => { const r = beginne(world, id); setRueckmeldung(r.text); refresh(); }}>
                        {t("ui2.ui.Reich.e0e3ae0")}
                      </button>
                    </span>
                  </>
                )
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** „Instandhaltung“ als Raster: jedes Stück eine Kachel mit Zustand; das gewählte (zu Beginn das dringendste) steht darunter ganz. */
export function PflegeKacheln({ world, bereich, refresh }: { world: World; bereich: Bereich; refresh: () => void }) {
  const stuecke = pflegeIds(world, bereich)
    .map((id) => pflegeStand(world, id)!)
    .sort((a, b) => b.dringlichkeit - a.dringlichkeit || b.nutzen - a.nutzen);
  const [wahl, setWahl] = useState<string | null>(stuecke[0]?.id ?? null);
  if (!stuecke.length) return <p className="subtitle">{t("ui.reich.Pflege.455356e")}</p>;
  const s = stuecke.find((x) => x.id === wahl);
  return (
    <section className="rr-abschnitt lk-abschnitt">
      <h4>
        {t("ui2.ui.reich.Pflege.6e8cf3e")} <em>{stuecke.length} {stuecke.length === 1 ? t("ui2.ui.reich.Pflege.26e1a92") : t("ui2.ui.reich.Pflege.cd3f30b")}{t("ui2.ui.reich.Pflege.3144bed")}</em>
      </h4>
      <p className="rr-hinweis">{t("welle_b3.pf.legende")}</p>
      <ul className="lk-raster lk-raster-vier">
        {stuecke.map((x) => (
          <li key={x.id}>
            <button type="button" className={`lk-kachel lk-stueck${x.dringlichkeit >= 8 ? " dringend" : ""}${x.id === wahl ? " on" : ""}`} aria-expanded={x.id === wahl} aria-controls="lk-pflege-detail" onClick={() => setWahl(x.id === wahl ? null : x.id)}>
              <strong>{x.v.name}</strong>
              {x.v.ort && <span className="lk-ort">{x.v.ort.name}</span>}
              <span className="lk-zustandsbalken">
                <span className="rr-balken" aria-hidden>
                  <i style={{ width: `${Math.round(x.zustand)}%` }} className={x.zustand < 40 ? "schwach" : ""} />
                  {x.bezug !== undefined && <b style={{ left: `${x.bezug}%` }} />}
                </span>
                <b>{Math.round(x.zustand)}</b>
              </span>
              <span className="lk-fuss">
                <span className="lk-wort">{zustandWort(x)}</span>
                <span className="lk-pfeil" aria-hidden>{x.id === wahl ? "▴" : "▾"}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {s && (
        <div id="lk-pflege-detail" className="lk-pflege-detail" role="region" aria-label={s.v.name}>
          <PflegeKarte key={s.id} s={s} world={world} refresh={refresh} />
        </div>
      )}
    </section>
  );
}

/** Die letzten Meldungen des Bereichs: die neueste sichtbar, die übrigen aufklappbar. */
export function MeldungenKurz({ world }: { world: World }) {
  const z = reichZustand(world);
  const liste = [...z.meldungen].reverse().slice(0, 5);
  if (!liste.length) return null;
  const [erste, ...rest] = liste;
  return (
    <section className="rr-abschnitt lk-abschnitt lk-meldungen">
      <h4>{t("ui2.ui.Reich.0326b65")}</h4>
      <p className={`lk-meldung ${erste!.art}`}>{erste!.text}</p>
      {rest.length > 0 && (
        <details className="lk-aufklapp">
          <summary>{t("tag_t3.weitere", { n: rest.length })}</summary>
          <ul className="rr-meldungen">
            {rest.map((m, i) => (
              <li key={`${m.tag}-${i}`} className={m.art}>{m.text}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
