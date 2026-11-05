// Die Verfassungs-Werkstatt (REC-1): Paket-Baukasten mit Stimmen-Prognose je Variante (Richtung und
// Bandbreite — die Mentorin erklärt die Rechnung, sie verspricht keine Scheingenauigkeit), dazu das
// Tracking des laufenden Vorgangs über Parlament, Verfassungsgericht und Volksabstimmung.

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { addDays, formatDateDe } from "../sim/dates";
import {
  ARTIKEL,
  VERFASSUNG_REGELN,
  artikelDef,
  artikelSperre,
  aymSicht,
  bringeVerfassungEin,
  geaenderteArtikel,
  kampagnenImpuls,
  paketStimmen,
  pruefeVerfassung,
  referendumPrognose,
  statusQuoVon,
  varianteDef,
  verfassungAktiv,
  verfassungStimmenKaufen,
  verfassungsZustand,
  zieheVerfassungZurueck,
  amtszeitBelegt,
} from "../sim/verfassung";
import { PARTEI_NAME, DULDUNG_QUOTE, duldung } from "../sim/fraktionen";
import { NET } from "../sim/modell";
import { HOCH_SCHLECHT } from "../sim/personen";
import { Sitzplan, FARBEN_PAPIER } from "./parlament/Halbrund";
import { parlamentsLage } from "./parlament/lage";
import { stimmzettel } from "./parlament/stimmen";
import { kannZahlen } from "../sim/kapital";
import type { Ergebnis } from "../sim/handeln";
import "./politik/design.css";
import "./verfassung-tafel.css";

import { t } from "../i18n";
const r1 = (x: number): number => Math.round(x * 10) / 10;

/** Wohin eine Variante die Macht rückt, in einem Wort. */
function richtungWort(autoritaer: number): string {
  if (autoritaer >= 2) return t("vf.richtung.palast");
  if (autoritaer === 1) return t("vf.richtung.exekutive");
  if (autoritaer === -1) return t("vf.richtung.kontrolle");
  if (autoritaer <= -2) return t("vf.richtung.abgabe");
  return t("vf.richtung.gleich");
}

/** Wer im Parlament eine Variante trägt oder ablehnt (Qualität statt Scheingenauigkeit). */
function parteienText(world: World, parteien: Record<string, number>): string {
  // Nur Parteien, die im Parlament sitzen
  const sitzt = ([p]: [string, number]) => (world.parliament?.seats[p] ?? 0) > 0;
  const dafuer = Object.entries(parteien).filter(sitzt).filter(([, x]) => x >= 1).map(([p]) => PARTEI_NAME[p] ?? p);
  const dagegen = Object.entries(parteien).filter(sitzt).filter(([, x]) => x <= -1).map(([p]) => PARTEI_NAME[p] ?? p);
  const teile: string[] = [];
  if (dafuer.length) teile.push(t("vf.dafuer", { l: dafuer }));
  if (dagegen.length) teile.push(t("vf.dagegen", { l: dagegen }));
  return teile.length ? teile.join("; ") : t("vf.ohneFronten");
}

const knotenName = (id: string): string => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;

/** Das Paket im Halbrund: jede Fraktion in ihrer Farbe, Ja-Sitze voll, Nein-Sitze blass; darunter die Leiste mit 360 und 400. */
function PaketHalbrund({ world, stimmen }: { world: World; stimmen: ReturnType<typeof paketStimmen> | null }) {
  const lage = useMemo(() => parlamentsLage(world), [world, world.day]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!lage) return null;
  const lagerParteien = new Set([world.player?.partei.kurz ?? "", ...(world.spiel?.lager ?? [])]);
  const dul = new Set(duldung(world).parteien);
  const jaJe: Record<string, number> = {};
  for (const f of lage.fraktionen)
    jaJe[f.partei] = !stimmen ? 0 : lagerParteien.has(f.partei) ? f.sitze : dul.has(f.partei) ? Math.round(f.sitze * DULDUNG_QUOTE) : stimmen.fraktionen.find((x) => x.partei === f.partei)?.ja ?? 0;
  // Fester Zufall: die Abweichler bleiben beim Umschalten auf ihren Plätzen
  const votum = stimmen ? stimmzettel(lage, jaJe, 175) : undefined;
  return (
    <div className="vf-sitze">
      <Sitzplan lage={lage} modus={stimmen ? "abstimmung" : "partei"} {...(votum ? { votum, sichtbar: 600 } : {})} farben={FARBEN_PAPIER}
        aria={stimmen ? t("vf.erwartetJa", { n: stimmen.erwartet }) : t("vf.paket")}
        mitte={stimmen ? <span className="vf-sitze-mitte"><b>{stimmen.erwartet}</b><small>{t("vf.ja")}</small></span> : undefined} />
      {stimmen && (
        <div className="vf-leiste" aria-hidden>
          <i style={{ width: `${(stimmen.erwartet / 600) * 100}%` }} className={stimmen.erwartet >= VERFASSUNG_REGELN.mehrheit ? "reicht" : ""} />
          {[VERFASSUNG_REGELN.mehrheit, VERFASSUNG_REGELN.direkt].map((n) => <b key={n} style={{ left: `${(n / 600) * 100}%` }}><span>{n}</span></b>)}
        </div>
      )}
      {stimmen && (
        <ul className="vf-fraktionen">
          {lage.fraktionen.map((f) => (
            <li key={f.partei} style={{ borderColor: f.farbe }} title={f.name}>
              <span>{f.partei}</span> <b>{jaJe[f.partei] ?? 0}</b><small>/{f.sitze}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Was das Paket im Land bewegt: Größen aus den Effekten der Fassungen und die Wählergruppen der Volksabstimmung, als Abzeichen. */
function PaketFolgen({ paket }: { paket: Record<string, string> }) {
  const groessen = new Map<string, number>(), gruppen = new Map<string, number>();
  for (const x of geaenderteArtikel(paket)) {
    for (const e of x.variante.effekte) groessen.set(e.id, (groessen.get(e.id) ?? 0) + e.d);
    for (const [g, d] of Object.entries(x.variante.waehler)) gruppen.set(g, (gruppen.get(g) ?? 0) + d);
  }
  const g = [...groessen].filter(([, d]) => d !== 0);
  const w = [...gruppen].filter(([, d]) => d !== 0).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 5);
  if (!g.length && !w.length) return null;
  const marke = (id: string, d: number, gut: boolean) => (
    <li key={id} className={gut ? "gut" : "schlecht"}><span aria-hidden>{d > 0 ? "▲" : "▼"}</span> {knotenName(id)} <b>{d > 0 ? `+${d}` : d}</b></li>
  );
  return (
    <div className="vf-folgen">
      {g.length > 0 && <><span className="vf-folgen-titel">{t("vf.folgen.land")}</span><ul>{g.map(([id, d]) => marke(id, d, d > 0 !== HOCH_SCHLECHT.has(id)))}</ul></>}
      {w.length > 0 && <><span className="vf-folgen-titel">{t("vf.folgen.waehler")}</span><ul>{w.map(([id, d]) => marke(id, d, d > 0))}</ul></>}
    </div>
  );
}

/**
 * Die Machtwaage: links Parlament und Bürger, rechts der Palast. Die Summe der Machtrichtung aller gewählten Fassungen neigt den Balken
 * (Daten: `autoritaer` je Fassung, + Machtkonzentration, − mehr Kontrolle). Das ist dieselbe Größe, die Gegenreaktion und Gericht treibt.
 */
function Waage({ summe }: { summe: number }) {
  const winkel = Math.max(-18, Math.min(18, summe * 3));
  const neigung = (winkel * Math.PI) / 180;
  const lx = 60 - 50 * Math.cos(neigung), ly = 44 - 50 * Math.sin(neigung);
  const rx = 60 + 50 * Math.cos(neigung), ry = 44 + 50 * Math.sin(neigung);
  const schale = (x: number, y: number, text: string, cls: string) => (
    <g className={cls}>
      <line x1={x} y1={y} x2={x - 12} y2={y + 20} /><line x1={x} y1={y} x2={x + 12} y2={y + 20} />
      <path d={`M${x - 16},${y + 20} Q${x},${y + 32} ${x + 16},${y + 20} Z`} />
      <text x={x} y={y + 44} textAnchor="middle">{text}</text>
    </g>
  );
  return (
    <figure className="vf-waage" aria-label={t("vf.waage.aria", { n: summe })}>
      <svg viewBox="0 0 120 104">
        <path d="M60,44 L52,96 L68,96 Z" className="vf-waage-fuss" />
        <g className="vf-waage-balken" style={{ transform: `rotate(${winkel}deg)`, transformOrigin: "60px 44px" }}>
          <line x1={10} y1={44} x2={110} y2={44} />
        </g>
        {schale(lx, ly, t("vf.waage.links"), `vf-schale links${summe < 0 ? " schwer" : ""}`)}
        {schale(rx, ry, t("vf.waage.rechts"), `vf-schale rechts${summe > 0 ? " schwer" : ""}`)}
        <circle cx={60} cy={44} r={4} className="vf-waage-achse" />
      </svg>
      <figcaption className={summe > 0 ? "palast" : summe < 0 ? "buerger" : ""}>{summe === 0 ? t("vf.waage.gleich") : t(summe > 0 ? "vf.waage.zumPalast" : "vf.waage.zumParlament")}</figcaption>
    </figure>
  );
}

export function VerfassungWerkstatt({ world, refresh }: { world: World; refresh: () => void }) {
  const spiel = world.spiel;
  const [wahl, setWahl] = useState<Record<string, string>>(() => {
    const z = world.spiel?.verfassungsvorgang;
    return Object.fromEntries(ARTIKEL.map((a) => [a.id, z?.aktiv[a.id] ?? statusQuoVon(a.id)]));
  });
  const [antwort, setAntwort] = useState<Ergebnis | null>(null);

  const z = spiel ? verfassungsZustand(world) : null;
  const v = z?.laufend;
  const paket = useMemo(() => Object.fromEntries(ARTIKEL.map((a) => [a.id, wahl[a.id] ?? statusQuoVon(a.id)])), [wahl]);
  const pr = useMemo(() => (spiel ? pruefeVerfassung(world, paket) : null), [world, paket, spiel, world.day]);

  if (!spiel || !z) return null;

  const tu = (r: Ergebnis) => {
    setAntwort(r);
    refresh();
  };

  // -------------------------------------------------------------------------
  // Laufender Vorgang: Tracking über die Stufen
  if (v) {
    const sicht = paketStimmen(world, v.paket, v.absprachen);
    const geaendert = geaenderteArtikel(v.paket);
    const stufen = [
      { id: "parlament", name: t("vf.stufe.parlament", { m: VERFASSUNG_REGELN.mehrheit, d: VERFASSUNG_REGELN.direkt }), frist: v.abstimmung },
      { id: "aym", name: t("vf.stufe.aym"), frist: v.aymTag },
      { id: "kampagne", name: t("vf.stufe.volk"), frist: v.referendumTag },
    ];
    const aktivStufe = v.phase === "parlament" ? 0 : v.phase === "aym" ? 1 : 2;
    const prognose = v.phase === "kampagne" ? referendumPrognose(world) : null;
    return (
      <div className="beschlussbuch vf-akte">
        <section className="paper">
          <h3>{t("ui.Verfassung.cdb7a4e")}</h3>
          <p className="subtitle">{geaendert.map((x) => `„${x.artikel.name}: ${x.variante.name}“`).join(", ")}</p>
          <ol className="vf-stufen">
            {stufen.map((s, i) => (
              <li key={s.id} className={i < aktivStufe ? "vf-stufe erledigt" : i === aktivStufe ? "vf-stufe aktiv" : "vf-stufe"}>
                <strong>{s.name}</strong>
                {i === aktivStufe && s.frist !== undefined && <span> · {t("vf.inTagen", { n: Math.max(0, s.frist - world.day), datum: formatDateDe(addDays(world.date, s.frist - world.day)) })}</span>}
                {i < aktivStufe && <span> · {t("vf.abgeschlossen")}</span>}
              </li>
            ))}
          </ol>
          {antwort && (
            <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
              {antwort.text}
              {antwort.why && <em> {antwort.why}</em>}
            </p>
          )}
        </section>

        {v.phase === "parlament" && (
          <section className="paper">
            <h3>{t("vf.abstimmungAm", { datum: formatDateDe(addDays(world.date, v.abstimmung - world.day)) })}</h3>
            <div className="stimmen-bar" aria-label={t("vf.erwartetJa", { n: sicht.erwartet })}>
              <div className="stimmen-ja" style={{ width: `${Math.min(100, (sicht.erwartet / 600) * 100)}%` }} />
              <div className="stimmen-marke" style={{ left: `${(VERFASSUNG_REGELN.mehrheit / 600) * 100}%` }} title={t("vf.marke.volk", { n: VERFASSUNG_REGELN.mehrheit })} />
              <div className="stimmen-marke" style={{ left: `${(VERFASSUNG_REGELN.direkt / 600) * 100}%` }} title={t("vf.marke.direkt", { n: VERFASSUNG_REGELN.direkt })} />
            </div>
            <p>
              {t("vf.erwartet", { n: sicht.erwartet, tief: sicht.tief, hoch: sicht.hoch, absprachen: v.absprachen ?? 0, direkt: VERFASSUNG_REGELN.direkt, mehrheit: VERFASSUNG_REGELN.mehrheit })}
            </p>
            <p className="subtitle">
              {sicht.lueckeMehrheit > 0
                ? t("vf.luecke.mehrheit", { n: sicht.lueckeMehrheit })
                : sicht.lueckeDirekt > 0
                  ? t("vf.luecke.direkt", { n: sicht.lueckeDirekt })
                  : t("vf.luecke.keine")}{" "}
              {t("vf.absprachenDoppelt", { f: VERFASSUNG_REGELN.kaufFaktor })}
            </p>
            <div className="stimmen-steuerung">
              {(() => {
                const ziel = sicht.erwartet >= VERFASSUNG_REGELN.mehrheit ? VERFASSUNG_REGELN.direkt + VERFASSUNG_REGELN.stimmenPuffer : VERFASSUNG_REGELN.mehrheit + VERFASSUNG_REGELN.stimmenPuffer;
                const noetig = Math.max(0, ziel - sicht.erwartet);
                const kosten = Math.ceil(noetig * 0.5 * VERFASSUNG_REGELN.kaufFaktor);
                return noetig > 0 ? (
                  <button className="pd-btn primary" disabled={!kannZahlen(spiel.kapital, kosten)} onClick={() => tu(verfassungStimmenKaufen(world, noetig))} title={t("ui.Verfassung.d78021e")}>
                    {t("vf.huerdeSichern", { n: noetig })} <b>{kosten}</b>
                  </button>
                ) : null;
              })()}
              <button className="pd-btn quiet" onClick={() => tu(zieheVerfassungZurueck(world))} title={t("ui.Verfassung.81b4686")}>
                {t("ui.Verfassung.dfaa501")}
              </button>
            </div>
          </section>
        )}

        {v.phase === "aym" && (
          <section className="paper">
            <h3>{t("vf.angefochten")}</h3>
            {(() => {
              const s = aymSicht(world, v.paket);
              return (
                <p>
                  {t("vf.aym", {
                    n: Math.max(0, (v.aymTag ?? world.day) - world.day),
                    loyal: s.sitze.loyal,
                    unabhaengig: s.sitze.unabhaengig,
                    reform: s.sitze.reform,
                    p: s.pKassation < 0.12 ? "selten" : s.pKassation < 0.25 ? "moeglich" : "wahrscheinlich",
                  })}
                </p>
              );
            })()}
            <p className="subtitle">{t("ui.Verfassung.8ed538c")}</p>
          </section>
        )}

        {v.phase === "kampagne" && prognose && (
          <section className="paper">
            <h3>{t("vf.kampagneBis", { datum: v.referendumTag ? formatDateDe(addDays(world.date, v.referendumTag - world.day)) : "" })}</h3>
            <div className="stimmen-bar" aria-label={t("vf.erwartetProzent", { p: r1(prognose.mitte) })}>
              <div className="stimmen-ja" style={{ width: `${prognose.mitte}%` }} />
              <div className="stimmen-marke" style={{ left: "50%" }} title={t("vf.marke.mehrheit")} />
            </div>
            <p>
              {t("vf.referendum", { mitte: r1(prognose.mitte), tief: r1(prognose.tief), hoch: r1(prognose.hoch), zustimmung: r1(prognose.zustimmung), salienz: `${prognose.salienz >= 0 ? "+" : ""}${t("vf.zahl", { x: r1(prognose.salienz) })}`, kampagne: r1(prognose.kampagne) })}
            </p>
            <p className="subtitle">{t("ui.Verfassung.73d21b7")}</p>
            <div className="stimmen-steuerung">
              <button className="pd-btn" onClick={() => tu(kampagnenImpuls(world))} title={t("vf.impulsTitel", { pk: VERFASSUNG_REGELN.kampagnePk })}>
                {t("vf.impuls")} <b>{VERFASSUNG_REGELN.kampagnePk}</b>
              </button>
            </div>
          </section>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Werkstatt: Paket schnüren
  const belegt = amtszeitBelegt(world);
  const aktivEintraege = Object.entries(z.aktiv);
  return (
    <div className="beschlussbuch vf-akte">
      {belegt && <p className="weg-warnung">{t("ui.Verfassung.f354624")}</p>}
      {antwort && (
        <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}

      {/* Tafel als Gesetzentwurf (Rückmeldung 05.11.2026: „super hässlich“): links der Entwurf auf Papier mit Artikelnummern am Rand,
          die Wahl wie mit dem Marker gesetzt; rechts der Stimmzettel als Halbrund mit 600 Sitzen und den Marken 360 und 400 */}
      <div className="vf-tafel">
        <article className="vf-entwurf">
          <header className="vf-entwurf-kopf">
            <span className="vf-siegel" aria-hidden>§</span>
            <div>
              <h3>{t("vf.entwurf.titel")}</h3>
              <p>{t("vf.regelZeile", { mehrheit: VERFASSUNG_REGELN.mehrheit, direkt: VERFASSUNG_REGELN.direkt })}</p>
              <p className="vf-achse-legende"><span>{t("vf.achse.links")}</span><span>{t("vf.achse.rechts")}</span></p>
            </div>
            <Waage summe={geaenderteArtikel(paket).reduce((n, x) => n + x.variante.autoritaer, 0)} />
          </header>
          <ol className="vf-zeilen">
            {ARTIKEL.map((a) => {
              const sperre = artikelSperre(world, a.id);
              const aktiv = verfassungAktiv(world, a.id);
              const dJetzt = paketStimmen(world, paket).erwartet;
              const gewaehlteV = a.varianten.find((x) => x.id === paket[a.id]) ?? a.varianten.find((x) => x.statusQuo);
              return (
                <li key={a.id} className={`vf-zeile${gewaehlteV && !gewaehlteV.statusQuo ? " geaendert" : ""}`}>
                  <div className="vf-rand">
                    <span className="vf-artnr">{t(`vf.art.${a.id}`)}</span>
                  </div>
                  <div className="vf-inhalt">
                    <div className="vf-zeile-kopf">
                      <strong title={a.frage}>{a.name}</strong>
                      {aktiv && <span className="vf-aktiv">{t("vf.beschlossen", { name: varianteDef(aktiv)?.name ?? aktiv })}</span>}
                      {sperre > 0 && <span className="vf-sperre">{t("vf.gesperrt", { n: sperre - world.day })}</span>}
                    </div>
                    <div className="vf-segmente" role="radiogroup" aria-label={a.name}>
                      {[...a.varianten].sort((p, q) => p.autoritaer - q.autoritaer).map((x) => {
                        const gewaehlt = paket[a.id] === x.id;
                        const delta = gewaehlt ? 0 : paketStimmen(world, { ...paket, [a.id]: x.id }).erwartet - dJetzt;
                        const tipp = `${x.text}${x.statusQuo ? "" : ` (${richtungWort(x.autoritaer)}; ${parteienText(world, x.parteien)})`}`;
                        return (
                          <button key={x.id} type="button" role="radio" aria-checked={gewaehlt} className={`vf-segment${gewaehlt ? " on" : ""}${x.statusQuo ? " bisher" : ""} macht-${x.autoritaer > 0 ? "plus" : x.autoritaer < 0 ? "minus" : "null"}`}
                            disabled={sperre > 0 || belegt} title={tipp} onClick={() => setWahl({ ...wahl, [a.id]: x.id })}>
                            <i className="vf-punkt" aria-hidden />
                            <span className="vf-wort">{x.name}</span>
                            {x.statusQuo && <small className="vf-geltend">{t("vf.geltend")}</small>}
                            {!gewaehlt && delta !== 0 && <small className={`vf-delta ${delta > 0 ? "plus" : "minus"}`}>{t("vf.deltaJa", { n: `${delta > 0 ? "+" : "−"}${Math.abs(delta)}` })}</small>}
                          </button>
                        );
                      })}
                    </div>
                    {gewaehlteV && <p className="vf-bedeutung">{gewaehlteV.text}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </article>

        {pr && (
          <aside className="vf-zettel" aria-live="polite">
            <h3>{t("vf.paket")}</h3>
            <PaketHalbrund world={world} stimmen={pr.geaendert > 0 ? pr.stimmen : null} />
            {pr.geaendert > 0 ? (
              <>
                <p className="vf-spanne-zeile">{t("vf.spanne", { tief: pr.stimmen.tief, hoch: pr.stimmen.hoch })}</p>
                <p className={`vf-urteil ${pr.stimmen.erwartet >= VERFASSUNG_REGELN.direkt ? "direkt" : pr.stimmen.erwartet >= VERFASSUNG_REGELN.mehrheit ? "volk" : "fehlt"}`}>
                  {pr.stimmen.erwartet >= VERFASSUNG_REGELN.direkt ? t("vf.urteil.direkt") : pr.stimmen.erwartet >= VERFASSUNG_REGELN.mehrheit ? t("vf.urteil.volk") : t("vf.urteil.fehlt", { n: VERFASSUNG_REGELN.mehrheit - pr.stimmen.erwartet })}
                </p>
                <PaketFolgen paket={paket} />
                <ul className="vf-aenderungen">
                  {geaenderteArtikel(paket).map((x) => (
                    <li key={x.artikel.id}><span>{t(`vf.art.${x.artikel.id}`)}</span> <mark>{x.variante.name}</mark></li>
                  ))}
                </ul>
                {pr.hinweise.length > 0 && (
                  <ul className="vf-hinweise">
                    {pr.hinweise.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                )}
                <button className="pd-btn primary vf-einbringen" disabled={!pr.ok} title={pr.ok ? t("vf.einbringenTitel") : pr.grund} onClick={() => tu(bringeVerfassungEin(world, paket))}>
                  {t("vf.einbringen")} <b>{pr.pk}</b>
                </button>
                {!pr.ok && <p className="weg-warnung">{pr.grund}</p>}
              </>
            ) : (
              <p className="vf-leer">{t("vf.leer")}</p>
            )}
          </aside>
        )}
      </div>

      {(aktivEintraege.length > 0 || z.historie.length > 0) && (
        <section className="paper">
          <h3>{t("ui.Verfassung.e526422")}</h3>
          {aktivEintraege.length > 0 && (
            <p className="subtitle">{t("vf.beschlossenListe", { l: aktivEintraege.map(([id, vId]) => `„${artikelDef(id)?.name ?? id}: ${varianteDef(vId)?.name ?? vId}“`) })}</p>
          )}
          <ul className="beschluss-liste">
            {[...z.historie].reverse().map((h, i) => (
              <li key={i}>
                <span className="when">{h.datum}</span>
                <div>
                  <p>
                    {h.ausgang}: {h.artikel.join(", ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
