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
import { PARTEI_NAME } from "../sim/fraktionen";
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

/** Stimmzettel als Halbrund: 600 Sitze von links nach rechts, gefüllt bis zu den erwarteten Ja-Stimmen, Spanne heller, Marken bei 360 und 400. */
function Halbrund({ erwartet, tief, hoch }: { erwartet: number; tief: number; hoch: number }) {
  const r = 88, cx = 120, cy = 116;
  const bogen = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const punkt = (n: number, d = 0) => { const w = Math.PI * (1 - n / 600); return { x: cx + (r + d) * Math.cos(w), y: cy - (r + d) * Math.sin(w) }; };
  const marke = (n: number, text: string) => { const a = punkt(n, -14), b = punkt(n, 14), c = punkt(n, 24); return <g key={n} className="vf-hr-marke"><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} /><text x={c.x} y={c.y} textAnchor={n > 300 ? "start" : "end"}>{text}</text></g>; };
  return (
    <svg className="vf-halbrund" viewBox="0 0 240 130" role="img" aria-label={t("vf.erwartetJa", { n: erwartet })}>
      <path d={bogen} pathLength={600} className="vf-hr-grund" />
      {hoch > tief && <path d={bogen} pathLength={600} className="vf-hr-spanne" strokeDasharray={`0 ${tief} ${hoch - tief} 600`} />}
      {erwartet > 0 && <path d={bogen} pathLength={600} className={`vf-hr-ja${erwartet >= VERFASSUNG_REGELN.mehrheit ? " reicht" : ""}`} strokeDasharray={`${erwartet} 600`} />}
      {marke(VERFASSUNG_REGELN.mehrheit, String(VERFASSUNG_REGELN.mehrheit))}
      {marke(VERFASSUNG_REGELN.direkt, String(VERFASSUNG_REGELN.direkt))}
    </svg>
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
            </div>
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
                      {a.varianten.map((x) => {
                        const gewaehlt = paket[a.id] === x.id;
                        const delta = gewaehlt ? 0 : paketStimmen(world, { ...paket, [a.id]: x.id }).erwartet - dJetzt;
                        const tipp = `${x.text}${x.statusQuo ? "" : ` (${richtungWort(x.autoritaer)}; ${parteienText(world, x.parteien)})`}`;
                        return (
                          <button key={x.id} type="button" role="radio" aria-checked={gewaehlt} className={`vf-segment${gewaehlt ? " on" : ""}${x.statusQuo ? " bisher" : ""}`}
                            disabled={sperre > 0 || belegt} title={tipp} onClick={() => setWahl({ ...wahl, [a.id]: x.id })}>
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
            <Halbrund erwartet={pr.geaendert > 0 ? pr.stimmen.erwartet : 0} tief={pr.geaendert > 0 ? pr.stimmen.tief : 0} hoch={pr.geaendert > 0 ? pr.stimmen.hoch : 0} />
            {pr.geaendert > 0 ? (
              <>
                <p className="vf-zahl">
                  <b>{pr.stimmen.erwartet}</b>
                  <span>{t("vf.spanne", { tief: pr.stimmen.tief, hoch: pr.stimmen.hoch })}</span>
                </p>
                <p className={`vf-urteil ${pr.stimmen.erwartet >= VERFASSUNG_REGELN.direkt ? "direkt" : pr.stimmen.erwartet >= VERFASSUNG_REGELN.mehrheit ? "volk" : "fehlt"}`}>
                  {pr.stimmen.erwartet >= VERFASSUNG_REGELN.direkt ? t("vf.urteil.direkt") : pr.stimmen.erwartet >= VERFASSUNG_REGELN.mehrheit ? t("vf.urteil.volk") : t("vf.urteil.fehlt", { n: VERFASSUNG_REGELN.mehrheit - pr.stimmen.erwartet })}
                </p>
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
